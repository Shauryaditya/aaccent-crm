import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentModal from './components/StudentModal';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Check auth session on startup
  useEffect(() => {
    const token = sessionStorage.getItem('aaccent_crm_authenticated_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch students database once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
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

  // Toggle paid / pending badge status via API PUT
  const handleTogglePayment = async (id) => {
    const target = students.find((s) => s.id === id);
    if (!target) return;

    const nextStatus = target.status === 'Paid' ? 'Pending' : 'Paid';

    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      }
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
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
          setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? data : s)));
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
        onLogout={handleLogout}
        onTogglePayment={handleTogglePayment}
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
