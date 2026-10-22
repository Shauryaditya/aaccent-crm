import React, { useState } from 'react';
import StatsGrid from './StatsGrid';
import StudentTable from './StudentTable';
import TeacherSalaries from './TeacherSalaries';
import StudentGrowth, { MonthRemovals } from './StudentGrowth';

export default function Dashboard({ 
  students, 
  apiBaseUrl,
  onRefreshStudents,
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
  const [activeTab, setActiveTab] = useState('students');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleClearFilters = () => {
    setSearchQuery('');
    setClassFilter('all');
    setBoardFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
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

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const pageStart = (visiblePage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(pageStart, pageStart + pageSize);
  const changePage = page => setCurrentPage(Math.min(totalPages, Math.max(1, page)));

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

      <div className="dashboard-navigation glassmorphism">
        <div role="tablist" aria-label="Management pages" className="dashboard-tabs">
          <button id="students-tab" role="tab" aria-selected={activeTab === 'students'} aria-controls="students-panel" className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('students')}>Student Directory</button>
          <button id="salaries-tab" role="tab" aria-selected={activeTab === 'salaries'} aria-controls="salaries-panel" className={`btn ${activeTab === 'salaries' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('salaries')}>Teacher Salaries</button>
          <button id="growth-tab" role="tab" aria-selected={activeTab === 'growth'} aria-controls="growth-panel" className={`btn ${activeTab === 'growth' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('growth')}>Student Growth</button>
        </div>
        <label className="dashboard-month" htmlFor="billing-month">Billing month
          <input id="billing-month" type="month" required value={selectedMonth} onChange={e => { if (e.target.value) { setCurrentPage(1); onMonthChange(e.target.value); } }} className="dropdown-filter" />
        </label>
      </div>

      {activeTab === 'students' ? <div id="students-panel" role="tabpanel" aria-labelledby="students-tab">

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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="filter-dropdowns">
            <select 
              value={classFilter} 
              onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setBoardFilter(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
          students={paginatedStudents}
          onTogglePayment={onTogglePayment}
          onAdjustFee={onAdjustFee}
          onEditStudent={onEditStudent}
          onDeleteStudent={onDeleteStudent}
          onAddFirstClick={onAddStudent}
        />
        {filteredStudents.length > 0 && <nav className="pagination" aria-label="Student directory pagination">
          <p className="pagination-summary">Showing {pageStart + 1}–{Math.min(pageStart + pageSize, filteredStudents.length)} of {filteredStudents.length} students</p>
          <label className="pagination-size">Rows
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="dropdown-filter" aria-label="Students per page">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
          <div className="pagination-controls">
            <button className="btn btn-secondary btn-small" onClick={() => changePage(visiblePage - 1)} disabled={visiblePage === 1} aria-label="Previous page">Previous</button>
            <span aria-live="polite">Page {visiblePage} of {totalPages}</span>
            <button className="btn btn-secondary btn-small" onClick={() => changePage(visiblePage + 1)} disabled={visiblePage === totalPages} aria-label="Next page">Next</button>
          </div>
        </nav>}
        <MonthRemovals key={selectedMonth} apiBaseUrl={apiBaseUrl} month={selectedMonth} students={students} onRefreshStudents={onRefreshStudents} />
      </section>
      </div> : activeTab === 'salaries' ? <div id="salaries-panel" role="tabpanel" aria-labelledby="salaries-tab">
        <TeacherSalaries key={selectedMonth} students={students} month={selectedMonth} apiBaseUrl={apiBaseUrl} />
      </div> : <div id="growth-panel" role="tabpanel" aria-labelledby="growth-tab"><StudentGrowth apiBaseUrl={apiBaseUrl} selectedMonth={selectedMonth} /></div>}
    </div>
  );
}
