const validMonth = month => /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '');
const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
const admissionDate = student => student.admissionDate || student.created_at?.slice(0, 10);
function withLegacyAdmission(student, payments) {
  if (student.admissionDate) return student;
  const dates = [student.created_at?.slice(0, 10), ...payments.filter(p => p.studentId === student.id && validMonth(p.month)).map(p => `${p.month}-01`)].filter(Boolean).sort();
  return { ...student, admissionDate: dates[0] };
}
const enrolledInMonth = (student, month) => !!admissionDate(student) && admissionDate(student).slice(0, 7) <= month;
const activeInMonth = (student, month, exclusions = []) => enrolledInMonth(student, month) && !exclusions.some(e => e.studentId === student.id && e.month === month);
function growthReport(students, exclusions, year, throughMonth) {
  const count = month => students.filter(s => activeInMonth(s, month, exclusions)).length;
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`;
    const previous = i === 0 ? `${year - 1}-12` : `${year}-${String(i).padStart(2, '0')}`;
    const active = students.filter(s => activeInMonth(s, month, exclusions));
    const prior = students.filter(s => activeInMonth(s, previous, exclusions));
    const total = active.length;
    return { month, total, previous: prior.length, added: active.filter(s => !prior.some(p => p.id === s.id)).length, removed: prior.filter(s => !active.some(p => p.id === s.id)).length, change: total - prior.length };
  }).filter(row => row.month <= throughMonth);
  const summarize = (label, rows, previousMonth) => {
    const previous = count(previousMonth);
    const total = rows.at(-1).total;
    return { label, through: rows.at(-1).month, previous, total, change: total - previous, percent: previous ? Math.round((total - previous) / previous * 10000) / 100 : null };
  };
  const quarterly = [0, 1, 2, 3].map(q => {
    const rows = monthly.filter(r => Number(r.month.slice(5)) > q * 3 && Number(r.month.slice(5)) <= (q + 1) * 3);
    return rows.length ? summarize(`Q${q + 1}`, rows, q === 0 ? `${year - 1}-12` : `${year}-${String(q * 3).padStart(2, '0')}`) : null;
  }).filter(Boolean);
  return { monthly, quarterly, yearly: monthly.length ? summarize(String(year), monthly, `${year - 1}-12`) : null };
}
const TEACHERS = [
  { id: 'subrata', name: 'Subrata Bardhan', description: 'Maths Faculty' },
  { id: 'mukta', name: 'Mukta Bardhan', description: 'Physics & Chemistry through Class 10; Physics in Classes 11–12' },
  { id: 'sanjay', name: 'Sanjay Sen', description: 'Science, Maths & Computer through Class 7; Computer in Classes 8–12' }
];
function eligibleTeachers(className, subject) {
  const grade = Number(className?.match(/\d+/)?.[0]);
  if (grade < 4 || grade > 12) return [];
  return TEACHERS.filter(t => t.id === 'subrata' ? subject === 'Maths' : t.id === 'mukta' ? subject === 'Physics' || (subject === 'Chemistry' && grade <= 10) : subject === 'Computer' || (grade <= 7 && ['Science', 'Maths'].includes(subject)));
}
function calculateTeacherShare(fee, subjects) {
  const amount = Number(fee);
  const count = Number(subjects);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(count) || count < 1) throw new Error('Invalid monthly fee or subject count.');
  return Math.round(amount * 100 / count) / 100;
}
module.exports = { validMonth, validDate, admissionDate, withLegacyAdmission, enrolledInMonth, activeInMonth, growthReport, TEACHERS, eligibleTeachers, calculateTeacherShare };
