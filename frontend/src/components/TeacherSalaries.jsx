import { useEffect, useRef, useState } from 'react';

const teachers = [
  { id: 'subrata', name: 'Subrata Bardhan', description: 'Maths Faculty' },
  { id: 'mukta', name: 'Mukta Bardhan', description: 'Physics & Chemistry through Class 10; Physics in Classes 11–12' },
  { id: 'sanjay', name: 'Sanjay Sen', description: 'Science, Maths & Computer through Class 7; Computer in Classes 8–12' }
];
const money = amount => Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
export default function TeacherSalaries({ students, month, apiBaseUrl }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const formRef = useRef(null);
  const [form, setForm] = useState({ studentId: '', subject: 'Maths', teacherId: '', classes: '', teacherShare: '' });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/teacher-salaries?month=${month}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(data => setEntries(data.entries))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, apiBaseUrl]);
  const student = students.find(s => s.id === form.studentId);
  const grade = Number(student?.class.match(/\d+/)?.[0]);
  const eligible = teachers.filter(t => student && (t.id === 'subrata' ? form.subject === 'Maths' : t.id === 'mukta' ? form.subject === 'Physics' || (form.subject === 'Chemistry' && grade <= 10) : form.subject === 'Computer' || (grade <= 7 && ['Science', 'Maths'].includes(form.subject))));
  const teacherId = eligible.some(t => t.id === form.teacherId) ? form.teacherId : eligible[0]?.id || '';
  const assignedStudents = students.filter(s => new Set(entries.filter(e => e.studentId === s.id).map(e => e.subject)).size >= Number(s.subjects)).length;
  const matchingStudents = students.filter(s => `${s.name} ${s.class}`.toLowerCase().includes(studentSearch.toLowerCase().trim()));
  const change = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/teacher-salaries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, teacherId, month, classes: form.classes === '' ? 0 : Number(form.classes), teacherShare: Number(form.teacherShare) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setEntries(prev => [...prev.filter(e => !(e.studentId === data.studentId && e.subject === data.subject)), data]);
      setForm(prev => ({ ...prev, classes: '', teacherShare: '' }));
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function remove(id) {
    setSaving(true); setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/teacher-salaries/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  function edit(entry) {
    setForm({ studentId: entry.studentId, subject: entry.subject, teacherId: entry.teacherId, classes: String(entry.classes), teacherShare: String(entry.teacherShare) });
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }
  return <section className="directory-section glassmorphism salary-section" key={month}>
    <div className="directory-header"><h2 className="section-title">Teacher Salaries · {month}</h2><strong>Total: {money(entries.reduce((sum, e) => sum + Number(e.teacherShare), 0))}</strong></div>
    <p>Assign one teacher to each student subject and enter the agreed teacher price manually. Editing an existing subject updates its teacher, class count, and price for this month.</p>
    <div className="salary-cards">{teachers.map(t => {
      const rows = entries.filter(e => e.teacherId === t.id);
      return <article className="stat-card" key={t.id}><div><h3>{t.name}</h3><p>{t.description}</p><h3>{money(rows.reduce((sum, e) => sum + Number(e.teacherShare), 0))}</h3><small>{new Set(rows.map(e => e.studentId)).size} students · {rows.reduce((sum, e) => sum + e.classes, 0)} student classes</small></div></article>;
    })}</div>
    {error && <p role="alert" className="salary-error">{error}</p>}
    {loading ? <p>Loading salaries…</p> : <>
      <p><strong>{students.length} existing students in this billing month · {assignedStudents} fully assigned · {students.length - assignedStudents} needing subject assignments</strong></p>
      <p>Use the existing student records below to assign their subjects. Their fees and subject counts are already filled in.</p>
      <div className="search-box"><input aria-label="Find an existing student for salary assignment" placeholder="Find student by name or class…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} /></div>
      <form ref={formRef} className="salary-form" onSubmit={save}>
        <label>Student<select required value={form.studentId} onChange={e => change('studentId', e.target.value)}><option value="">Select student</option>{students.filter(s => s.id === form.studentId || matchingStudents.some(match => match.id === s.id)).map(s => <option key={s.id} value={s.id}>{s.name} · {s.class} · {new Set(entries.filter(e => e.studentId === s.id).map(e => e.subject)).size}/{s.subjects} subjects assigned</option>)}</select></label>
        <label>Subject<select value={form.subject} onChange={e => change('subject', e.target.value)}>{['Maths', 'Science', 'Physics', 'Chemistry', 'Computer'].map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Teacher<select required value={teacherId} onChange={e => change('teacherId', e.target.value)}><option value="">Select teacher</option>{eligible.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>Classes this month (optional)<input type="number" min="0" step="1" value={form.classes} onChange={e => change('classes', e.target.value)} /></label>
        <label>Teacher price (₹)<input required type="number" min="0" max="9999999999.99" step="0.01" value={form.teacherShare} onChange={e => change('teacherShare', e.target.value)} placeholder="Enter agreed amount" /></label>
        <button className="btn btn-primary" disabled={saving || !teacherId || form.teacherShare === ''}>Save entry</button>
      </form>
      <div className="salary-table-wrap"><table className="salary-table"><thead><tr>{['Student', 'Subject', 'Teacher', 'Classes', 'Teacher price', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{entries.map(e => <tr key={e.id}><td>{e.studentName}<br /><small>{e.studentClass}</small></td><td>{e.subject}</td><td>{teachers.find(t => t.id === e.teacherId)?.name}</td><td>{e.classes}</td><td>{money(e.teacherShare)}</td><td><button className="btn btn-text" disabled={saving} onClick={() => edit(e)}>Edit</button><button className="btn btn-text" disabled={saving} onClick={() => remove(e.id)}>Remove</button></td></tr>)}</tbody></table>{entries.length === 0 && <p>No salary entries for this month.</p>}</div>
    </>}
  </section>;
}
