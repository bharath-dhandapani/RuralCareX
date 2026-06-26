import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, ArrowRight } from 'lucide-react';

const DoctorRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await fetch(`${API_URL}/api/auth/doctor-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, specialty, phone, email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'doctor');
        localStorage.setItem('doctorId', data.doctor.id.toString());
        navigate('/doctor/dashboard');
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
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'var(--surface-border)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px auto',
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)'
        }}>
          <Stethoscope size={40} color="var(--secondary)" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Doctor Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Register to join the team</p>
      </div>

      <div className="glass-card animate-slide-up delay-1" style={{ padding: '32px 24px' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Full Name
            </label>
            <input 
              type="text"
              placeholder="e.g. Dr. Jane Doe"
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
              Specialty
            </label>
            <input 
              type="text"
              placeholder="e.g. General Physician"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
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
              placeholder="e.g. doctor@clinic.com"
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
          <button type="submit" className="btn-primary" style={{ marginTop: '8px', background: 'var(--secondary)' }} disabled={loading}>
            {loading ? 'Registering...' : 'Register as Doctor'} <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link to="/doctor-login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          Already have an account? <span style={{ color: 'var(--primary)' }}>Login here</span>
        </Link>
      </div>

    </div>
  );
};

export default DoctorRegister;
