import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, ArrowRight } from 'lucide-react';

const PharmacyLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${API_URL}/api/auth/pharmacy-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'pharmacy');
        localStorage.setItem('pharmacyId', data.pharmacy.id.toString());
        localStorage.setItem('pharmacyName', data.pharmacy.name);
        navigate('/pharmacy/dashboard');
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'var(--surface-border)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px auto',
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)'
        }}>
          <Pill size={40} color="#10B981" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Pharmacy Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Manage stock and dispense medicine</p>
      </div>

      <div className="glass-card animate-slide-up delay-1" style={{ padding: '32px 24px' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Phone or Email
            </label>
            <input 
              type="text"
              placeholder="Enter your registered contact"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
                color: 'white', fontSize: '1rem', outline: 'none'
              }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Password
            </label>
            <input 
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
                color: 'white', fontSize: '1rem', outline: 'none'
              }}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px', background: '#10B981' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'} <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link to="/pharmacy-register" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          Don't have an account? <span style={{ color: '#10B981' }}>Register here</span>
        </Link>
        <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          Not a pharmacy? <span style={{ color: 'var(--primary)' }}>Go to Patient Login</span>
        </Link>
      </div>

    </div>
  );
};

export default PharmacyLogin;
