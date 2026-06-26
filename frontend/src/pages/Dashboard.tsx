import React, { useState, useEffect } from 'react';
import { Activity, Pill, ShieldAlert, ChevronRight, PhoneCall, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [medicineQuery, setMedicineQuery] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'https://ruralcarex.onrender.com';

  useEffect(() => {
    const fetchProfile = async () => {
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('userId');
      if (role && userId) {
        try {
          const res = await fetch(`${API_URL}/api/profile/${role}/${userId}`);
          const data = await res.json();
          if (data.success) {
            setProfile(data.profile);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    const fetchInitialPharmacies = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/api/medicines/search`);
        const data = await res.json();
        if (data.success) {
          setPharmacies(data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchProfile();
    fetchInitialPharmacies();
  }, [API_URL]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!medicineQuery) {
      setPharmacies([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/medicines/search?q=${medicineQuery}`);
      const data = await res.json();
      if (data.success) {
        setPharmacies(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <header className="animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{'Hello'}, {profile?.name || 'User'} 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>{profile?.address || 'Nabha Village'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => {
            localStorage.clear();
            navigate('/login');
          }} className="icon-button" style={{ background: 'transparent', border: 'none' }} aria-label="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', overflow: 'hidden'
          }} onClick={() => navigate('/profile')}>
            {profile?.photo ? (
              <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
        </div>
      </header>

      {/* Quick Action - Emergency */}
      <div className="glass-card animate-slide-up delay-1" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.05))' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>{'Emergency'}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{'Call Ambulance'}</p>
        </div>
        <button className="icon-button" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>
          <PhoneCall size={20} />
        </button>
      </div>

      {/* Main Grid */}
      <div className="responsive-grid">
        
        <div onClick={() => navigate('/symptom')} className="glass animate-slide-up delay-2" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Activity color="var(--secondary)" size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{'Check Symptoms'}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{'A I Assisted'}</p>
        </div>

        <div onClick={() => navigate('/consultations')} className="glass animate-slide-up delay-2" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldAlert color="var(--primary)" size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{'Consult Doctor'}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{'Video Audio Call'}</p>
        </div>

      </div>

      {/* Upcoming / Pharmacy Section */}
      <div className="animate-slide-up delay-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{'Nearby Pharmacy'}</h3>
        </div>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input 
            type="text"
            placeholder={'Search Medicine'}
            value={medicineQuery}
            onChange={(e) => setMedicineQuery(e.target.value)}
            style={{ 
              flex: 1, padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
              color: 'white', fontSize: '0.9rem', outline: 'none'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px', flex: 'none', background: '#10B981', width: 'auto' }}>
            <Search size={20} />
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSearching && <p style={{ color: 'var(--text-secondary)' }}>{'Searching...'}</p>}
          {!isSearching && pharmacies.length === 0 && medicineQuery && (
            <p style={{ color: 'var(--text-secondary)' }}>{'No Stock'}</p>
          )}
          {!isSearching && pharmacies.map((med: any, idx: number) => (
            <div key={idx} className="glass" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--surface-border)', padding: '12px', borderRadius: '12px' }}>
                <Pill size={24} color="#10B981" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{med.pharmacy.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{med.pharmacy.address}</p>
                <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', fontWeight: 500 }}>
                  {med.name} {'In Stock'} ({med.stock})
                </p>
              </div>
              <a href={`tel:${med.pharmacy.phone}`} style={{ textDecoration: 'none' }}>
                <button className="icon-button" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none' }}>
                  <PhoneCall size={18} />
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
