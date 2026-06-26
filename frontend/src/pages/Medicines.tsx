import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Pill, Package, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Medicines = () => {
  const navigate = useNavigate();
    const location = useLocation();
  const initialQuery = location.state?.query || '';
  const [query, setQuery] = useState(initialQuery);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'https://ruralcarex.onrender.com';

  const fetchMedicines = async (searchQuery = '') => {
    setLoading(true);
    try {
      const url = searchQuery ? `${API_URL}/api/medicines/search?q=${searchQuery}` : `${API_URL}/api/medicines/search`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.results || []);
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines(initialQuery);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedicines(query);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-button" onClick={() => navigate(-1)} style={{ width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{'Find Medicines'}</h1>
      </header>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            placeholder={'Search For Medicines'} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
              border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-primary)'
            }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>{'Search Btn'}</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{'Loading Medicines'}</p>
        ) : medicines.length > 0 ? (
          medicines.map((med) => (
            <div key={med.id} className="glass-card animate-slide-up" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={24} color="#10B981" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>{med.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {med.pharmacy?.name || 'Local Pharmacy'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{med.pharmacy?.address}</div>
                <div style={{ fontSize: '0.8rem', color: med.stock > 0 ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <Package size={14} />
                  {med.stock > 0 ? `${med.stock} ${'In Stock'}` : 'Out Of Stock'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Pill size={48} opacity={0.5} style={{ margin: '0 auto 16px auto' }} />
            <p>{'No Medicines Found'} "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicines;
