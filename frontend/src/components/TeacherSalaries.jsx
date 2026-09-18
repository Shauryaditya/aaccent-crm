import { useEffect, useState } from 'react';

const teachers = [
  { id: 'subrata', name: 'Subrata Bardhan', description: 'Maths Faculty' },
  { id: 'mukta', name: 'Mukta Bardhan', description: 'Physics & Chemistry through Class 10; Physics in Classes 11–12' },
  { id: 'sanjay', name: 'Sanjay Sen', description: 'Science, Maths & Computer through Class 7; Computer in Classes 8–12' }
];
const blankForm = { studentId: '', subject: 'Maths', teacherId: '', classes: '', teacherShare: '' };
const money = amount => Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

export default function TeacherSalaries({ students, month, apiBaseUrl }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [form, setForm] = useState(blankForm);
  const [priceEdit, setPriceEdit] = useState(null);

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
  const change = (field, value) => setForm(previous => ({ ...previous, [field]: value }));

  async function saveEntry(payload) {
    const response = await fetch(`${apiBaseUrl}/teacher-salaries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setEntries(previous => [...previous.filter(entry => !(entry.studentId === data.studentId && entry.subject === data.subject)), data]);
  }

  async function addEntry(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await saveEntry({ ...form, teacherId, month, classes: form.classes === '' ? 0 : Number(form.classes), teacherShare: Number(form.teacherShare) });
      setForm(blankForm);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function savePrice(entry) {
    if (!priceEdit || priceEdit.value === '') return;
    setSaving(true); setError('');
    try {
      await saveEntry({ month, studentId: entry.studentId, subject: entry.subject, teacherId: entry.teacherId, classes: Number(entry.classes), teacherShare: Number(priceEdit.value) });
      setPriceEdit(null);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function remove(id) {
    setSaving(true); setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/teacher-salaries/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error);
      setEntries(previous => previous.filter(entry => entry.id !== id));
      if (priceEdit?.id === id) setPriceEdit(null);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return <section className="directory-section glassmorphism salary-section" key={month}>
    <div className="directory-header"><h2 className="section-title">Teacher Salaries · {month}</h2><strong>Total: {money(entries.reduce((sum, entry) => sum + Number(entry.teacherShare), 0))}</strong></div>
    <p>Assign one teacher to each student subject and enter the agreed price. Existing prices can be edited directly beside each student in the table.</p>
    <div className="salary-cards">{teachers.map(teacher => {
      const rows = entries.filter(entry => entry.teacherId === teacher.id);
      return <article className="stat-card" key={teacher.id}><div><h3>{teacher.name}</h3><p>{teacher.description}</p><h3>{money(rows.reduce((sum, entry) => sum + Number(entry.teacherShare), 0))}</h3><small>{new Set(rows.map(entry => entry.studentId)).size} students · {rows.reduce((sum, entry) => sum + entry.classes, 0)} student classes</small></div></article>;
    })}</div>
    {error && <p role="alert" className="salary-error">{error}</p>}
    {loading ? <p>Loading salaries…</p> : <>
      <p><strong>{students.length} existing students in this billing month · {assignedStudents} fully assigned · {students.length - assignedStudents} needing subject assignments</strong></p>
      <p>Use this form only to add a new student-subject entry.</p>
      <div className="search-box"><input aria-label="Find an existing student for salary assignment" placeholder="Find student by name or class…" value={studentSearch} onChange={event => setStudentSearch(event.target.value)} /></div>
      <form className="salary-form" onSubmit={addEntry}>
        <label>Student<select required value={form.studentId} onChange={event => change('studentId', event.target.value)}><option value="">Select student</option>{students.filter(s => s.id === form.studentId || matchingStudents.some(match => match.id === s.id)).map(s => <option key={s.id} value={s.id}>{s.name} · {s.class} · {new Set(entries.filter(entry => entry.studentId === s.id).map(entry => entry.subject)).size}/{s.subjects} subjects assigned</option>)}</select></label>
        <label>Subject<select value={form.subject} onChange={event => change('subject', event.target.value)}>{['Maths', 'Science', 'Physics', 'Chemistry', 'Computer'].map(subject => <option key={subject}>{subject}</option>)}</select></label>
        <label>Teacher<select required value={teacherId} onChange={event => change('teacherId', event.target.value)}><option value="">Select teacher</option>{eligible.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
        <label>Classes this month (optional)<input type="number" min="0" step="1" value={form.classes} onChange={event => change('classes', event.target.value)} /></label>
        <label>Teacher price (₹)<input required type="number" min="0" max="9999999999.99" step="0.01" value={form.teacherShare} onChange={event => change('teacherShare', event.target.value)} placeholder="Enter agreed amount" /></label>
        <button className="btn btn-primary" disabled={saving || !teacherId || form.teacherShare === ''}>Add entry</button>
      </form>
      <div className="salary-table-wrap"><table className="salary-table">
        <thead><tr>{['Student', 'Subject', 'Teacher', 'Classes', 'Teacher price', 'Actions'].map(heading => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>{entries.map(entry => {
          const editing = priceEdit?.id === entry.id;
          return <tr key={entry.id} className={editing ? 'salary-row-editing' : ''}>
            <td>{entry.studentName}<br /><small>{entry.studentClass}</small></td><td>{entry.subject}</td><td>{teachers.find(teacher => teacher.id === entry.teacherId)?.name}</td><td>{entry.classes}</td>
            <td>{editing ? <label className="inline-price"><span className="sr-only">Teacher price for {entry.studentName}</span><span>₹</span><input autoFocus type="number" min="0" max="9999999999.99" step="0.01" value={priceEdit.value} onChange={event => setPriceEdit({ id: entry.id, value: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); savePrice(entry); } if (event.key === 'Escape') setPriceEdit(null); }} /></label> : money(entry.teacherShare)}</td>
            <td>{editing ? <><button className="btn btn-primary btn-small" disabled={saving || priceEdit.value === ''} onClick={() => savePrice(entry)}>Save</button><button className="btn btn-text" disabled={saving} onClick={() => setPriceEdit(null)}>Cancel</button></> : <button className="btn btn-text" disabled={saving} onClick={() => setPriceEdit({ id: entry.id, value: String(entry.teacherShare) })}>Edit price</button>}<button className="btn btn-text" disabled={saving} onClick={() => remove(entry.id)}>Remove</button></td>
          </tr>;
        })}</tbody>
      </table>{entries.length === 0 && <p>No salary entries for this month.</p>}</div>
    </>}
  </section>;
}
