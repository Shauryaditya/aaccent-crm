import React from 'react';

export default function StudentTable({ students, onTogglePayment, onAdjustFee, onEditStudent, onDeleteStudent, onAddFirstClick }) {
  const handleAdjustFeeClick = (id, studentName, currentFee) => {
    const promptVal = window.prompt(`Adjust tuition fee for ${studentName} for the selected month:`, currentFee);
    if (promptVal === null) return;
    const parsed = parseInt(promptVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('Please enter a valid amount.');
      return;
    }
    onAdjustFee(id, parsed);
  };

  if (students.length === 0) {
    return (
      <div id="empty-state" className="empty-state-wrapper">
        <div className="empty-icon">📁</div>
        <h3>No Students Found</h3>
        <p>Try adjusting your search criteria, clearing your filters, or register a new student.</p>
        <button 
          onClick={onAddFirstClick} 
          className="btn btn-secondary"
        >
          Add First Student
        </button>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="students-table">
        <thead>
          <tr>
            <th>Student Details</th>
            <th>Class</th>
            <th>Board / Curriculum</th>
            <th>Subjects</th>
            <th>Monthly Fees</th>
            <th>Payment Status</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const badgeClass = s.status === 'Paid' ? 'badge-paid' : 'badge-pending';
            const badgeText = s.status === 'Paid' ? 'Paid' : 'Pending';
            const badgeTitle = s.status === 'Paid' ? 'Click to mark as Unpaid' : 'Verify fee as Paid';

            return (
              <tr key={s.id} data-id={s.id}>
                <td>
                  <div className="student-meta-cell">
                    <span className="student-meta-name">{s.name}</span>
                    <span className="student-meta-parent">Parent: {s.parentName}</span>
                    <span className="student-meta-contact">
                      📞 {s.phone} {s.email ? `| ✉️ ${s.email}` : ''}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="class-badge">{s.class}</span>
                </td>
                <td>
                  <span className="board-tag">{s.board}</span>
                </td>
                <td className="font-bold">
                  {s.subjects} Sub{s.subjects > 1 ? 's' : ''}
                </td>
                <td>
                  <div className="fee-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div>
                      ₹{s.fee.toLocaleString('en-IN')}
                      <span className="fee-sub-info">/ month</span>
                    </div>
                    <button 
                      onClick={() => handleAdjustFeeClick(s.id, s.name, s.fee)}
                      className="btn-action-text" 
                      title="Adjust fee for this month"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--neutral-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '4px'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                  </div>
                </td>
                <td>
                  <span 
                    className={`badge ${badgeClass}`} 
                    title={badgeTitle}
                    onClick={() => onTogglePayment(s.id)}
                  >
                    {badgeText}
                  </span>
                </td>
                <td className="actions-col">
                  <div className="actions-wrapper">
                    <button 
                      className="btn-action btn-action-edit" 
                      title="Edit Student" 
                      onClick={() => onEditStudent(s)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      className="btn-action btn-action-delete" 
                      title="Delete Student" 
                      onClick={() => onDeleteStudent(s.id, s.name)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

