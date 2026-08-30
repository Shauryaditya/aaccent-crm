import React, { useState } from 'react';
import StatsGrid from './StatsGrid';
import StudentTable from './StudentTable';

export default function Dashboard({ 
  students, 
  selectedMonth,
  onMonthChange,
  onLogout, 
  onTogglePayment, 
  onAdjustFee,
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleClearFilters = () => {
    setSearchQuery('');
    setClassFilter('all');
    setBoardFilter('all');
    setStatusFilter('all');
  };

  // Perform local search and filtering of the students database array
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      s.name.toLowerCase().includes(query) ||
      s.parentName.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      (s.email && s.email.toLowerCase().includes(query));

    const matchesClass = classFilter === 'all' || s.class === classFilter;
    const matchesBoard = boardFilter === 'all' || s.board === boardFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'paid' && s.status === 'Paid') ||
      (statusFilter === 'pending' && s.status === 'Pending');

    return matchesSearch && matchesClass && matchesBoard && matchesStatus;
  });

  const hasActiveFilters = 
    searchQuery !== '' || 
    classFilter !== 'all' || 
    boardFilter !== 'all' || 
    statusFilter !== 'all';

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="main-header glassmorphism">
        <div className="header-left">
          <img 
            className="header-logo" 
            src="https://res.cloudinary.com/dvjbrjvgf/image/upload/v1703397008/Aaccent/ozsltpw9rdp9hprglhwv.jpg" 
            alt="Aaccent Logo" 
          />
          <div>
            <h1 className="header-title">Aaccent Student CRM</h1>
            <p className="header-subtitle">Advantage Academic Center Management Portal</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <span className="user-avatar">A</span>
            <div className="user-details">
              <span className="user-name">Site Administrator</span>
              <span className="user-role">Super Admin</span>
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-logout" title="Log Out from CRM">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Stats KPI Overview */}
      <StatsGrid students={students} />

      {/* Directory Section */}
      <section className="directory-section glassmorphism">
        <div className="directory-header">
          <h2 className="section-title">Student Directory & Billings</h2>
          <button onClick={onAddStudent} className="btn btn-add">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Student
          </button>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="search-box">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by name, parent name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-dropdowns">
            {/* Billing Month Picker */}
            <div className="month-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month:</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => onMonthChange(e.target.value)}
                className="dropdown-filter"
                style={{ padding: '0.55rem 0.65rem', minWidth: '150px' }}
              />
            </div>

            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
              className="dropdown-filter"
            >
              <option value="all">All Classes</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
            
            <select 
              value={boardFilter} 
              onChange={(e) => setBoardFilter(e.target.value)}
              className="dropdown-filter"
            >
              <option value="all">All Boards</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="ISC">ISC</option>
              <option value="Madhyamik">Madhyamik</option>
              <option value="State Board">State Board</option>
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="dropdown-filter"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="btn btn-text">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <StudentTable 
          students={filteredStudents}
          onTogglePayment={onTogglePayment}
          onAdjustFee={onAdjustFee}
          onEditStudent={onEditStudent}
          onDeleteStudent={onDeleteStudent}
          onAddFirstClick={onAddStudent}
        />
      </section>
    </div>
  );
}

