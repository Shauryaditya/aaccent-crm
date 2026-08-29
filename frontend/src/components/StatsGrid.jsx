import React from 'react';

export default function StatsGrid({ students }) {
  const totalStudents = students.length;
  
  let collected = 0;
  let pending = 0;
  
  students.forEach((s) => {
    if (s.status === 'Paid') {
      collected += s.fee;
    } else {
      pending += s.fee;
    }
  });

  const expected = collected + pending;

  return (
    <section className="dashboard-stats-grid">
      {/* Total Students */}
      <div className="stat-card total-students-card">
        <div className="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div className="stat-details">
          <p className="stat-label">Total Registered Students</p>
          <h3 className="stat-number">{totalStudents}</h3>
        </div>
      </div>
      
      {/* Collected Fees */}
      <div className="stat-card collected-fees-card">
        <div className="stat-icon font-bold">₹</div>
        <div className="stat-details">
          <p className="stat-label">Collected Monthly Fees</p>
          <h3 className="stat-number">₹{collected.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      {/* Outstanding Fees */}
      <div className="stat-card pending-fees-card">
        <div className="stat-icon font-bold">₹</div>
        <div className="stat-details">
          <p className="stat-label">Outstanding Fees</p>
          <h3 className="stat-number text-orange">₹{pending.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      {/* Expected Revenue */}
      <div className="stat-card total-revenue-card">
        <div className="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div className="stat-details">
          <p className="stat-label">Total Monthly Expected</p>
          <h3 className="stat-number">₹{expected.toLocaleString('en-IN')}</h3>
        </div>
      </div>
    </section>
  );
}
