import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';

const PharmacyRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) {
      alert('Please enter a phone number or email');
      return;
    }
    
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'https://ruralcarex.onrender.com';
    try {
      const res = await fetch(`${API_URL}/api/auth/pharmacy-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, address })
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
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '24px', marginTop: '20px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'var(--surface-border)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 16px auto',
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)'
        }}>
          <Store size={40} color="#10B981" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Pharmacy Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Register your medical store</p>
      </div>

      <div className="glass-card animate-slide-up delay-1" style={{ padding: '32px 24px', marginBottom: '40px' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Pharmacy Name
            </label>
            <input 
              type="text"
              placeholder="e.g. HealthPlus Pharmacy"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              Phone Number
            </label>
            <input 
              type="number"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
                color: 'white', fontSize: '1rem', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Email Address
            </label>
            <input 
              type="email"
              placeholder="e.g. contact@pharmacy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
                color: 'white', fontSize: '1rem', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Address
            </label>
            <input 
              type="text"
              placeholder="e.g. 123 Main St, Village"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
              placeholder="Create a password"
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
            {loading ? 'Registering...' : 'Register Pharmacy'} <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <Link to="/pharmacy-login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          Already registered? <span style={{ color: '#10B981' }}>Login here</span>
        </Link>
      </div>

    </div>
  );
};

export default PharmacyRegister;
