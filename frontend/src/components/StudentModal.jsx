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
  const [customFee, setCustomFee] = useState('');

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
      setCustomFee(student.fee !== undefined ? student.fee.toString() : '');
    } else {
      setName('');
      setParentName('');
      setPhone('');
      setEmail('');
      setSelectedClass('');
      setBoard('');
      setSubjects('');
      setPaymentStatus('Pending');
      setCustomFee('');
    }
  }, [student]);

  const classNum = selectedClass ? parseInt(selectedClass.replace(/\D/g, ''), 10) : null;
  const maxSubjects = (classNum === 4 || classNum === 5 || classNum === 11 || classNum === 12) ? 3 : 5;

  const handleClassChange = (e) => {
    const val = e.target.value;
    setSelectedClass(val);

    const newClassNum = val ? parseInt(val.replace(/\D/g, ''), 10) : null;
    const currentSubjectsInt = parseInt(subjects, 10);
    let finalSubs = currentSubjectsInt;

    if (newClassNum) {
      const newMaxSubs = (newClassNum === 4 || newClassNum === 5 || newClassNum === 11 || newClassNum === 12) ? 3 : 5;
      if (currentSubjectsInt > newMaxSubs) {
        finalSubs = newMaxSubs;
        setSubjects(newMaxSubs.toString());
      }
    }

    if (newClassNum && finalSubs) {
      const pricing = FEE_MATRIX[newClassNum];
      if (pricing && pricing[finalSubs]) {
        setCustomFee(pricing[finalSubs].toString());
      }
    } else {
      setCustomFee('');
    }
  };

  const handleSubjectsChange = (e) => {
    const val = e.target.value;
    setSubjects(val);

    const subsInt = parseInt(val, 10);
    if (classNum && subsInt) {
      const pricing = FEE_MATRIX[classNum];
      if (pricing && pricing[subsInt]) {
        setCustomFee(pricing[subsInt].toString());
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !parentName || !phone || !selectedClass || !board || !subjects || customFee === '') {
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
      status: paymentStatus,
      fee: parseInt(customFee, 10)
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
          <div className="modal-grid-row modal-grid-row-stack-mobile">
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

          <div className="modal-grid-row modal-grid-row-stack-mobile">
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
            <div className="form-group">
              <label htmlFor="student-class">Class <span className="required">*</span></label>
              <select 
                id="student-class" 
                required
                value={selectedClass}
                onChange={handleClassChange}
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
            <div className="form-group">
              <label htmlFor="student-subjects">No. of Subjects <span className="required">*</span></label>
              <select 
                id="student-subjects" 
                required 
                disabled={!selectedClass}
                value={subjects}
                onChange={handleSubjectsChange}
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
            <div className="form-group">
              <label htmlFor="student-payment-status">Current Month Status</label>
              <select 
                id="student-payment-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="Pending">Pending / Unpaid</option>
                <option value="Paid">Verified / Paid</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="student-fee">Monthly Tuition Fee (₹) <span className="required">*</span></label>
              <input 
                type="number" 
                id="student-fee" 
                required 
                min="0"
                placeholder="Calculated amount"
                value={customFee}
                onChange={(e) => setCustomFee(e.target.value)}
              />
              {maxSubjects === 3 && (
                <p id="fee-warning" className="fee-warning-text" style={{ margin: '0.25rem 0 0 0' }}>
                  ℹ️ Max 3 subjects allowed for Classes 4, 5, 11 & 12.
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
