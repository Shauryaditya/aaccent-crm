import { useEffect, useState } from 'react';
import GrowthCharts from './GrowthCharts';

export default function StudentGrowth({ apiBaseUrl, selectedMonth }) {
  const [year, setYear] = useState(selectedMonth.slice(0, 4));
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/student-growth?year=${year}`, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    }).then(setReport).catch(err => {
      if (err.name !== 'AbortError') setError(err.message);
    });
    return () => controller.abort();
  }, [apiBaseUrl, year]);

  const signed = number => `${number > 0 ? '+' : ''}${number}`;
  function selectYear(value) {
    setYear(value);
    setReport(null);
    setError('');
  }

  return <section className="directory-section glassmorphism">
    <div className="directory-header">
      <h2 className="section-title">Student Growth</h2>
      <label>Year <input type="number" min="2000" max={new Date().getFullYear()} value={year} onChange={event => selectYear(event.target.value)} className="dropdown-filter" /></label>
    </div>
    <p className="growth-description">Counts use admission dates and removals for each month. Growth compares the closing student count with the previous period. Current quarters and years are shown through the latest available month.</p>
    {error && <p role="alert" className="salary-error">{error}</p>}
    {!report && !error && <p>Loading growth...</p>}
    {report && <>
      {report.yearly && <article className="stat-card"><div><h3>{year} · through {report.yearly.through}</h3><p>{report.yearly.total} students · {signed(report.yearly.change)} since the start of the year{report.yearly.percent !== null ? ` (${signed(report.yearly.percent)}%)` : ''}</p></div></article>}
      <h3 className="growth-heading">Quarterly growth</h3>
      <div className="salary-cards">{report.quarterly.map(quarter => <article className="stat-card" key={quarter.label}><div><h3>{quarter.label}</h3><p>{quarter.total} students · {signed(quarter.change)} growth{quarter.percent !== null ? ` (${signed(quarter.percent)}%)` : ''}</p><small>Through {quarter.through}</small></div></article>)}</div>
      <h3 className="growth-heading">Monthly trends</h3>
      <GrowthCharts rows={report.monthly} />
      <details className="growth-data-details">
        <summary>View monthly data table</summary>
        <div className="salary-table-wrap"><table className="salary-table"><thead><tr>{['Month', 'Students', 'Added / returned', 'Removed', 'Net growth'].map(heading => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{report.monthly.map(row => <tr key={row.month}><td>{row.month}</td><td>{row.total}</td><td>{row.added}</td><td>{row.removed}</td><td>{signed(row.change)}</td></tr>)}</tbody></table></div>
      </details>
      <p className="growth-description">Historical counts depend on correct admission dates. An older payment can establish that a student was enrolled before their profile was created.</p>
    </>}
  </section>;
}

export function MonthRemovals({ apiBaseUrl, month, students, onRefreshStudents }) {
  const [removed, setRemoved] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/student-month-removals?month=${month}`, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    }).then(setRemoved).catch(err => {
      if (err.name !== 'AbortError') setError(err.message);
    });
    return () => controller.abort();
  }, [apiBaseUrl, month, students]);

  async function restore(id) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/students/${id}/restore-month`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month }) });
      if (!response.ok) throw new Error((await response.json()).error);
      await onRefreshStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="month-removals">
    {error && <p role="alert" className="salary-error">{error}</p>}
    <details><summary>Removed from {month} only ({removed.length})</summary>
      {removed.length === 0 && !error && <p>No students were removed from this month. If a student is missing, check their admission date.</p>}
      {removed.map(row => <div className="removed-student" key={row.studentId}><span>{row.students?.name} · {row.students?.class}</span><button className="btn btn-secondary" disabled={busy} onClick={() => restore(row.studentId)}>Restore to this month</button></div>)}
    </details>
  </div>;
}
