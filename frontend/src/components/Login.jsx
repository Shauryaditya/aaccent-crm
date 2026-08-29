import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });


      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="login-card glassmorphism">
        <div className="logo-area">
          <img 
            className="logo-image" 
            src="https://res.cloudinary.com/dvjbrjvgf/image/upload/v1703397008/Aaccent/ozsltpw9rdp9hprglhwv.jpg" 
            alt="Aaccent Logo" 
          />
        </div>
        <h2 className="auth-title">Advantage Academic Center</h2>
        <p class="auth-subtitle">Internal Portal & CRM Login</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-password">Admin Security Code</label>
            <div className="password-input-wrapper">
              <input 
                type="password" 
                id="admin-password" 
                placeholder="Enter password (default: admin123)" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <p id="login-error" className="error-text">
                Incorrect security code. Please try again.
              </p>
            )}
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-full font-bold"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Access CRM Portal'}
          </button>
        </form>
        <div className="auth-footer">
          <p>© 2026 Advantage Academic Center. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
