import React, { useState, useEffect } from 'react';

const FEE_MATRIX = {
  4: { 1: 800, 2: 1600, 3: 1900 },
  5: { 1: 800, 2: 1600, 3: 1900 },
  6: { 1: 800, 2: 1600, 3: 1800, 4: 2000, 5: 2100 },
  7: { 1: 800, 2: 1600, 3: 1800, 4: 2100, 5: 2200 },
  8: { 1: 900, 2: 1700, 3: 2100, 4: 2200, 5: 2300 },
  9: { 1: 900, 2: 1700, 3: 2100, 4: 2200, 5: 2400 },
  10: { 1: 900, 2: 1700, 3: 2200, 4: 2300, 5: 2500 },
  11: { 1: 1200, 2: 2200, 3: 3300 },
  12: { 1: 1200, 2: 2200, 3: 3300 }
};

export default function StudentModal({ student, onClose, onSave }) {
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [board, setBoard] = useState('');
  const [subjects, setSubjects] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [liveFee, setLiveFee] = useState(null);

  const isEditing = !!student;

  useEffect(() => {
    if (student) {
      setName(student.name);
      setParentName(student.parentName);
      setPhone(student.phone);
      setEmail(student.email || '');
      setSelectedClass(student.class);
      setBoard(student.board);
      setSubjects(student.subjects.toString());
      setPaymentStatus(student.status);
    } else {
      setName('');
      setParentName('');
      setPhone('');
      setEmail('');
      setSelectedClass('');
      setBoard('');
      setSubjects('');
      setPaymentStatus('Pending');
    }
  }, [student]);

  // Extract class number
  const classNum = selectedClass ? parseInt(selectedClass.replace(/\D/g, ''), 10) : null;
  const maxSubjects = (classNum === 4 || classNum === 5 || classNum === 11 || classNum === 12) ? 3 : 5;

  // Auto-adjust subject option selection when class updates
  useEffect(() => {
    if (classNum && subjects) {
      const currentSubjectsInt = parseInt(subjects, 10);
      if (currentSubjectsInt > maxSubjects) {
        setSubjects(maxSubjects.toString());
      }
    }
  }, [selectedClass, maxSubjects, subjects]);

  // Live calculation of fee
  useEffect(() => {
    if (classNum && subjects) {
      const subsInt = parseInt(subjects, 10);
      const pricing = FEE_MATRIX[classNum];
      if (pricing && pricing[subsInt]) {
        setLiveFee(pricing[subsInt]);
      } else {
        setLiveFee(null);
      }
    } else {
      setLiveFee(null);
    }
  }, [selectedClass, classNum, subjects]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !parentName || !phone || !selectedClass || !board || !subjects) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      name,
      parentName,
      phone,
      email,
      class: selectedClass,
      board,
      subjects: parseInt(subjects, 10),
      status: paymentStatus
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box glassmorphism">
        <div className="modal-header">
          <h3 className="modal-title-text">
            {isEditing ? `Edit Student Profile: ${student.name}` : 'Register New Student'}
          </h3>
          <button onClick={onClose} className="btn-close-modal">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-grid-row">
            {/* Student Name */}
            <div className="form-group">
              <label htmlFor="student-name">Student Full Name <span className="required">*</span></label>
              <input 
                type="text" 
                id="student-name" 
                required 
                placeholder="Enter student's name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {/* Parent/Guardian */}
            <div className="form-group">
              <label htmlFor="parent-name">Parent / Guardian Name <span className="required">*</span></label>
              <input 
                type="text" 
                id="parent-name" 
                required 
                placeholder="Enter parent's name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-grid-row">
            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="student-phone">Phone Number <span className="required">*</span></label>
              <input 
                type="tel" 
                id="student-phone" 
                required 
                pattern="[0-9]{10}" 
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="student-email">Email Address</label>
              <input 
                type="email" 
                id="student-email" 
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-grid-row-three">
            {/* Class Selection */}
            <div className="form-group">
              <label htmlFor="student-class">Class <span className="required">*</span></label>
              <select 
                id="student-class" 
                required
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="" disabled>Select class</option>
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
            </div>
            {/* Board */}
            <div className="form-group">
              <label htmlFor="student-board">Board <span className="required">*</span></label>
              <select 
                id="student-board" 
                required
                value={board}
                onChange={(e) => setBoard(e.target.value)}
              >
                <option value="" disabled>Select board</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="ISC">ISC</option>
                <option value="Madhyamik">Madhyamik</option>
                <option value="State Board">State Board</option>
              </select>
            </div>
            {/* Subjects Count */}
            <div className="form-group">
              <label htmlFor="student-subjects">No. of Subjects <span className="required">*</span></label>
              <select 
                id="student-subjects" 
                required 
                disabled={!selectedClass}
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
              >
                <option value="" disabled>Select subjects</option>
                {[...Array(maxSubjects)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} Subject{i > 0 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-grid-row modal-grid-row-status-fee mt-4">
            {/* Payment Status */}
            <div className="form-group">
              <label htmlFor="student-payment-status">Current Month Fee Status</label>
              <select 
                id="student-payment-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="Pending">Pending / Unpaid</option>
                <option value="Paid">Verified / Paid</option>
              </select>
            </div>
            {/* Dynamic Fee Preview Box */}
            <div className="fee-estimate-panel">
              <div className="fee-estimate-inner">
                <span className="fee-label">Calculated Fee:</span>
                <span id="calculated-fee-display" className="fee-value">
                  {liveFee ? `₹${liveFee.toLocaleString('en-IN')} / month` : 'Select details...'}
                </span>
              </div>
              {maxSubjects === 3 && (
                <p id="fee-warning" className="fee-warning-text">
                  ℹ️ Classes 4, 5, 11 & 12 are limited to a maximum of 3 subjects.
                </p>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Student Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
