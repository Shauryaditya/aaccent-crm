require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const { validMonth, validDate, withLegacyAdmission, enrolledInMonth, activeInMonth, growthReport, TEACHERS, eligibleTeachers, calculateTeacherShare } = require('./monthly');

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

async function legacyStudent(student) {
  if (student.admissionDate) return student;
  const { data, error } = await supabase.from('payments').select('studentId,month').eq('studentId', student.id);
  if (error) throw new Error(error.message);
  return withLegacyAdmission(student, data);
}


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
  if (month && !validMonth(month)) return res.status(400).json({ error: 'Invalid billing month.' });

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
        .select('*');

      if (paymentsError) {
        console.error('Supabase fetch payments error:', paymentsError);
        return res.status(500).json({ error: paymentsError.message });
      }

      const paymentMap = {};
      if (payments) {
        payments.forEach(p => {
          if (p.month === month) paymentMap[p.studentId] = p;
        });
      }

      const { data: exclusions, error: exclusionError } = await supabase.from('student_month_exclusions').select('*').eq('month', month);
      if (exclusionError) return res.status(500).json({ error: exclusionError.message });
      const mergedStudents = students.map(student => withLegacyAdmission(student, payments || [])).filter(student => activeInMonth(student, month, exclusions)).map(student => {
        const payment = paymentMap[student.id];
        return {
          ...student,
          baseFee: student.fee,
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
  const { name, parentName, phone, email, class: selectedClass, board, subjects, status, fee, admissionDate } = req.body;
  if (!validDate(admissionDate)) return res.status(400).json({ error: 'A valid admission date is required.' });
  
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
        admissionDate,
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
    if (!validDate(merged.admissionDate)) return res.status(400).json({ error: 'A valid admission date is required.' });
    
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
        admissionDate: merged.admissionDate,
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

  if (!validMonth(month)) {
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

    if (!enrolledInMonth(await legacyStudent(student), month)) return res.status(400).json({ error: 'Payments cannot be recorded before admission.' });
    const { data: excluded, error: excludedError } = await supabase.from('student_month_exclusions').select('studentId').eq('studentId', id).eq('month', month).maybeSingle();
    if (excludedError) return res.status(500).json({ error: excludedError.message });
    if (excluded) return res.status(400).json({ error: 'Restore the student in this month before recording payment.' });

    // Check if payment row already exists for this student and month
    const { data: existingPayment, error: paymentFetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('studentId', id)
      .eq('month', month)
      .maybeSingle();

    let result;
    if (paymentFetchError) return res.status(500).json({ error: paymentFetchError.message });
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

// Removal affects only the selected month; profiles and payment history are preserved.
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { month } = req.query;
  if (!validMonth(month)) return res.status(400).json({ error: 'A valid month is required. Student profiles cannot be deleted here.' });
  
  try {
    const { error } = await supabase
      .from('student_month_exclusions')
      .upsert({ studentId: id, month }, { onConflict: 'studentId,month' });

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


app.get('/api/student-growth', async (req, res) => {
  const year = Number(req.query.year);
  const throughMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
  if (!Number.isInteger(year) || year < 2000 || year > Number(throughMonth.slice(0, 4))) return res.status(400).json({ error: 'Select a valid year up to the current year.' });
  try {
    const [students, exclusions, payments] = await Promise.all([supabase.from('students').select('*'), supabase.from('student_month_exclusions').select('*'), supabase.from('payments').select('studentId,month')]);
    if (students.error || exclusions.error || payments.error) return res.status(500).json({ error: (students.error || exclusions.error || payments.error).message });
    res.json(growthReport(students.data.map(s => withLegacyAdmission(s, payments.data)), exclusions.data, year, throughMonth));
  } catch { res.status(500).json({ error: 'Unable to load student growth.' }); }
});

app.get('/api/student-month-removals', async (req, res) => {
  if (!validMonth(req.query.month)) return res.status(400).json({ error: 'Invalid month.' });
  const { data, error } = await supabase.from('student_month_exclusions').select('studentId,students(id,name,class)').eq('month', req.query.month);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/students/:id/restore-month', async (req, res) => {
  if (!validMonth(req.body.month)) return res.status(400).json({ error: 'Invalid month.' });
  const { error } = await supabase.from('student_month_exclusions').delete().eq('studentId', req.params.id).eq('month', req.body.month);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/teacher-salaries', async (req, res) => {
  const { month } = req.query;
  if (!validMonth(month)) return res.status(400).json({ error: 'Invalid month.' });
  try {
    const { data, error } = await supabase.from('teacher_classes').select('*').eq('month', month).order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    const [{ data: students, error: studentError }, { data: payments, error: paymentError }] = await Promise.all([
      supabase.from('students').select('*'), supabase.from('payments').select('*')
    ]);
    if (studentError || paymentError) return res.status(500).json({ error: (studentError || paymentError).message });
    const { data: exclusions, error: exclusionError } = await supabase.from('student_month_exclusions').select('*').eq('month', month);
    if (exclusionError) return res.status(500).json({ error: exclusionError.message });
    const profiles = students.map(s => withLegacyAdmission(s, payments));
    const entries = data.filter(entry => profiles.some(s => s.id === entry.studentId && activeInMonth(s, month, exclusions))).map(entry => {
      const student = students.find(s => s.id === entry.studentId);
      const fee = payments.find(p => p.studentId === student.id && p.month === month)?.amount ?? student.fee;
      return { ...entry, monthlyFee: fee, subjects: student.subjects, teacherShare: calculateTeacherShare(fee, student.subjects) };
    });
    res.json({ teachers: TEACHERS, entries });
  } catch { res.status(500).json({ error: 'Unable to load teacher salaries.' }); }
});

app.post('/api/teacher-salaries', async (req, res) => {
  const { month, studentId, subject, teacherId, classes = 0 } = req.body;
  if (!validMonth(month) || !Number.isInteger(classes) || classes < 0) {
    return res.status(400).json({ error: 'Enter a valid month and nonnegative class count.' });
  }
  try {
    const { data: student, error: studentError } = await supabase.from('students').select('*').eq('id', studentId).single();
    if (studentError || !student) return res.status(404).json({ error: 'Student not found.' });
    if (!enrolledInMonth(await legacyStudent(student), month)) return res.status(400).json({ error: 'Classes cannot be recorded before admission.' });
    const { data: excluded, error: exclusionError } = await supabase.from('student_month_exclusions').select('studentId').eq('studentId', studentId).eq('month', month).maybeSingle();
    if (exclusionError) return res.status(500).json({ error: exclusionError.message });
    if (excluded) return res.status(400).json({ error: 'Student is removed from this month.' });
    if (!eligibleTeachers(student.class, subject).some(t => t.id === teacherId)) return res.status(400).json({ error: 'Teacher does not teach this subject and class.' });
    const [{ data: payment, error: paymentError }, { data: existing, error: existingError }] = await Promise.all([
      supabase.from('payments').select('*').eq('studentId', studentId).eq('month', month).maybeSingle(),
      supabase.from('teacher_classes').select('*').eq('studentId', studentId).eq('month', month)
    ]);
    if (paymentError || existingError) return res.status(500).json({ error: (paymentError || existingError).message });
    const previous = existing.find(e => e.subject === subject);
    if (!previous && new Set(existing.map(e => e.subject)).size >= student.subjects) return res.status(400).json({ error: 'All this student’s subjects are already assigned. Edit an existing entry or correct the subject count.' });
    const monthlyFee = payment?.amount ?? student.fee;
    const teacherShare = calculateTeacherShare(monthlyFee, student.subjects);
    const { data, error } = await supabase.from('teacher_classes').upsert({ id: previous?.id || randomUUID(), month, studentId, studentName: student.name, studentClass: student.class, subject, teacherId, classes, teacherShare }, { onConflict: 'month,studentId,subject' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ ...data, monthlyFee, subjects: student.subjects });
  } catch { res.status(500).json({ error: 'Unable to save teacher share.' }); }
});

app.delete('/api/teacher-salaries/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('teacher_classes').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Unable to delete teacher share.' }); }
});

// Start Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Aaccent CRM API server running on port ${PORT}`);
  });
}

module.exports = app;
