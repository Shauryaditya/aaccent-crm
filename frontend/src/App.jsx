import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentModal from './components/StudentModal';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

const getCurrentMonthString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());

  // Check auth session on startup
  useEffect(() => {
    const token = sessionStorage.getItem('aaccent_crm_authenticated_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch students database once authenticated or month changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated, selectedMonth]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to fetch students database:', err);
    }
  };

  const handleLoginSuccess = (token, user) => {
    sessionStorage.setItem('aaccent_crm_authenticated_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out from Aaccent CRM?')) {
      sessionStorage.removeItem('aaccent_crm_authenticated_token');
      setIsAuthenticated(false);
      setStudents([]);
    }
  };

  // Toggle paid / pending badge status for selected month via monthly payment endpoint
  const handleTogglePayment = async (id) => {
    const target = students.find((s) => s.id === id);
    if (!target) return;

    const nextStatus = target.status === 'Paid' ? 'Pending' : 'Paid';

    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          month: selectedMonth, 
          status: nextStatus 
        }),
      });

      if (response.ok) {
        const updatedPayment = await response.json();
        setStudents((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: updatedPayment.status } : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
    }
  };

  // Adjust fee for selected month via monthly payment endpoint
  const handleAdjustFee = async (id, newAmount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          amount: newAmount
        }),
      });

      if (response.ok) {
        const updatedPayment = await response.json();
        setStudents((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, fee: updatedPayment.fee } : s
          )
        );
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to adjust monthly fee.');
      }
    } catch (err) {
      console.error('Failed to adjust monthly fee:', err);
    }
  };

  // Delete student via API DELETE
  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the student records for ${name}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setStudents((prev) => prev.filter((s) => s.id !== id));
        }
      } catch (err) {
        console.error('Failed to delete student:', err);
      }
    }
  };

  // Handle opening modal for editing or adding
  const handleEditStudentClick = (student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleAddStudentClick = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  // Save new / edited student profile to API
  const handleSaveStudent = async (studentPayload) => {
    try {
      let response;
      if (editingStudent) {
        // Edit PUT request
        response = await fetch(`${API_BASE_URL}/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentPayload),
        });
      } else {
        // Add POST request
        response = await fetch(`${API_BASE_URL}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentPayload),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (editingStudent) {
          // Keep month status / fee data when editing profile
          setStudents((prev) =>
            prev.map((s) =>
              s.id === editingStudent.id
                ? { ...data, status: s.status, fee: s.fee }
                : s
            )
          );
        } else {
          setStudents((prev) => [...prev, data]);
        }
        setModalOpen(false);
        setEditingStudent(null);
      } else {
        const errData = await response.json();
        alert(`Error saving student: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Save student API error:', err);
      alert('Network error while saving student profile.');
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <Dashboard
        students={students}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onLogout={handleLogout}
        onTogglePayment={handleTogglePayment}
        onAdjustFee={handleAdjustFee}
        onAddStudent={handleAddStudentClick}
        onEditStudent={handleEditStudentClick}
        onDeleteStudent={handleDeleteStudent}
      />

      {modalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={() => {
            setModalOpen(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />
      )}
    </>
  );
}

