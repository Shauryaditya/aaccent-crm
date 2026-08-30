require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY environment variables must be defined!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


// --- Aaccent Fee Matrix (from www.aaccent.in) ---
const FEE_MATRIX = {
  4: { 1: 800, 2: 1600, 3: 1900 },
  5: { 1: 800, 2: 1600, 3: 1900 },
  6: { 1: 800, 2: 1600, 3: 1800, 4: 2000, 5: 2100 },
  7: { 1: 800, 2: 1600, 3: 1800, 4: 2100, 5: 2200 },
  8: { 1: 900, 2: 1700, 3: 2100, 4: 2200, 5: 2300 },
  9: { 1: 900, 2: 1700, 3: 2100, 4: 2200, 5: 2400 },
  10: { 1: 900, 2: 1700, 3: 2200, 4: 2300, 5: 2500 },
  11: { 1: 1200, 2: 2200, 3: 3300 },
  12: { 1: 1200, 2: 2200, 3: 3300 }
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Helper Functions ---
function parseClassNumber(classString) {
  if (!classString) return null;
  const match = classString.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function calculateFee(classString, subjectsCount) {
  const classNum = parseClassNumber(classString);
  const subs = parseInt(subjectsCount, 10);
  
  if (!classNum || !subs) return null;
  
  const classPricing = FEE_MATRIX[classNum];
  if (!classPricing) return null;
  
  return classPricing[subs] || null;
}

// --- REST API ROUTES ---

// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  
  if (password === 'admin123') {
    return res.json({
      success: true,
      token: 'aaccent_admin_session_token_secure_temp',
      user: { name: 'Site Administrator', role: 'Super Admin' }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid administrator password code'
    });
  }
});

// 2. Get All Students (Supports month-wise payment/fee status merge)
app.get('/api/students', async (req, res) => {
  const { month } = req.query; // Expects format: YYYY-MM

  try {
    // Fetch all student profiles
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: true });

    if (studentsError) {
      console.error('Supabase fetch students error:', studentsError);
      return res.status(500).json({ error: studentsError.message });
    }

    if (!students || students.length === 0) {
      return res.json([]);
    }

    // Merge month-specific payments if a month parameter is active
    if (month) {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('month', month);

      if (paymentsError) {
        console.error('Supabase fetch payments error:', paymentsError);
        return res.status(500).json({ error: paymentsError.message });
      }

      const paymentMap = {};
      if (payments) {
        payments.forEach(p => {
          paymentMap[p.studentId] = p;
        });
      }

      const mergedStudents = students.map(student => {
        const payment = paymentMap[student.id];
        return {
          ...student,
          status: payment ? payment.status : 'Pending',
          fee: payment ? payment.amount : student.fee // Use adjusted monthly fee if custom payment record exists
        };
      });

      return res.json(mergedStudents);
    }

    res.json(students);
  } catch (err) {
    console.error('API Error fetching students:', err);
    res.status(500).json({ error: 'Internal server error while loading database.' });
  }
});

// 3. Add Student Record (Supports base fee override)
app.post('/api/students', async (req, res) => {
  const { name, parentName, phone, email, class: selectedClass, board, subjects, status, fee } = req.body;
  
  // Basic validation
  if (!name || !parentName || !phone || !selectedClass || !board || !subjects) {
    return res.status(400).json({ error: 'Missing required student registration fields.' });
  }
  
  // Use custom fee override if specified; otherwise compute standard rate
  const finalFee = fee !== undefined ? parseInt(fee, 10) : calculateFee(selectedClass, subjects);
  if (!finalFee && finalFee !== 0) {
    return res.status(400).json({ error: 'Invalid class & subjects combination. No fee is defined.' });
  }
  
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([{
        id: Date.now().toString(),
        name,
        parentName,
        phone,
        email: email || '',
        class: selectedClass,
        board,
        subjects: parseInt(subjects, 10),
        fee: finalFee,
        status: status || 'Pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (err) {
    console.error('API Error adding student:', err);
    res.status(500).json({ error: 'Internal server error while saving student.' });
  }
});


// 4. Update Student Record (Supports custom base fee override)
app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // Get current record
    const { data: currentStudent, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentStudent) {
      return res.status(404).json({ error: 'Student record not found' });
    }
    
    // Merge updates
    const merged = { ...currentStudent, ...updates };
    
    // Respect custom fee update if provided; otherwise calculate on class/subject mutations
    if (updates.fee !== undefined) {
      merged.fee = parseInt(updates.fee, 10);
    } else if (updates.class || updates.subjects) {
      const calculatedFee = calculateFee(merged.class, merged.subjects);
      if (!calculatedFee) {
        return res.status(400).json({ error: 'Invalid class & subjects combination for fee recalculation.' });
      }
      merged.fee = calculatedFee;
    }
    
    merged.subjects = parseInt(merged.subjects, 10);
    
    // Update in Supabase
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({
        name: merged.name,
        parentName: merged.parentName,
        phone: merged.phone,
        email: merged.email,
        class: merged.class,
        board: merged.board,
        subjects: merged.subjects,
        fee: merged.fee,
        status: merged.status
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    res.json(updatedStudent);
  } catch (err) {
    console.error('API Error updating student:', err);
    res.status(500).json({ error: 'Internal server error while saving updates.' });
  }
});

// 5. Update Monthly Payment Status / Fee Adjustment (One-time and Toggling)
app.put('/api/students/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { month, status, amount } = req.body;

  if (!month) {
    return res.status(400).json({ error: 'Missing required "month" parameter.' });
  }

  try {
    // Get student default fee profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // Check if payment row already exists for this student and month
    const { data: existingPayment, error: paymentFetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('studentId', id)
      .eq('month', month)
      .maybeSingle();

    let result;
    if (existingPayment) {
      // Update existing record
      const updates = {};
      if (status !== undefined) updates.status = status;
      if (amount !== undefined) updates.amount = parseInt(amount, 10);

      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update payment error:', error);
        return res.status(500).json({ error: error.message });
      }
      result = data;
    } else {
      // Create new record
      const insertData = {
        id: Date.now().toString(),
        studentId: id,
        month,
        amount: amount !== undefined ? parseInt(amount, 10) : student.fee,
        status: status || 'Pending'
      };

      const { data, error } = await supabase
        .from('payments')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert payment error:', error);
        return res.status(500).json({ error: error.message });
      }
      result = data;
    }

    res.json({
      studentId: id,
      month: result.month,
      status: result.status,
      fee: result.amount
    });
  } catch (err) {
    console.error('API Error updating payment:', err);
    res.status(500).json({ error: 'Internal server error while saving payment details.' });
  }
});

// 6. Delete Student Record
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, id });
  } catch (err) {
    console.error('API Error deleting student:', err);
    res.status(500).json({ error: 'Internal server error while deleting record.' });
  }
});


// Start Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Aaccent CRM API server running on port ${PORT}`);
  });
}

module.exports = app;

