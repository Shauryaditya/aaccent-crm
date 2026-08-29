const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'students.json');



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
function readDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Create empty DB file if it doesn't exist
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return [];
  }
}

function writeDatabase(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing to database file:', err);
    return false;
  }
}

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

// 2. Get All Students
app.get('/api/students', (req, res) => {
  const students = readDatabase();
  res.json(students);
});

// 3. Add Student Record
app.post('/api/students', (req, res) => {
  const { name, parentName, phone, email, class: selectedClass, board, subjects, status } = req.body;
  
  // Basic validation
  if (!name || !parentName || !phone || !selectedClass || !board || !subjects) {
    return res.status(400).json({ error: 'Missing required student registration fields.' });
  }
  
  const calculatedFee = calculateFee(selectedClass, subjects);
  if (!calculatedFee) {
    return res.status(400).json({ error: 'Invalid class & subjects combination. No fee is defined.' });
  }
  
  const students = readDatabase();
  const newStudent = {
    id: Date.now().toString(),
    name,
    parentName,
    phone,
    email: email || '',
    class: selectedClass,
    board,
    subjects: parseInt(subjects, 10),
    fee: calculatedFee,
    status: status || 'Pending'
  };
  
  students.push(newStudent);
  writeDatabase(students);
  
  res.status(201).json(newStudent);
});

// 4. Update Student Record
app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const students = readDatabase();
  const index = students.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Student record not found' });
  }
  
  const currentStudent = students[index];
  
  // Merge updates
  const merged = { ...currentStudent, ...updates };
  
  // Recalculate fee if class or subjects count changed
  if (updates.class || updates.subjects) {
    const calculatedFee = calculateFee(merged.class, merged.subjects);
    if (!calculatedFee) {
      return res.status(400).json({ error: 'Invalid class & subjects combination for fee recalculation.' });
    }
    merged.fee = calculatedFee;
  }
  
  // Ensure integers
  merged.subjects = parseInt(merged.subjects, 10);
  
  students[index] = merged;
  writeDatabase(students);
  
  res.json(merged);
});

// 5. Delete Student Record
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  
  let students = readDatabase();
  const exists = students.some(s => s.id === id);
  
  if (!exists) {
    return res.status(404).json({ error: 'Student record not found' });
  }
  
  students = students.filter(s => s.id !== id);
  writeDatabase(students);
  
  res.json({ success: true, id });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Aaccent CRM API server running on port ${PORT}`);
});
