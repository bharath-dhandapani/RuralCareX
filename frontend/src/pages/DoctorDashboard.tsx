import React, { useState, useEffect } from 'react';
import { Activity, Search, Calendar, User, Video, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem('doctorId');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [isAvailable, setIsAvailable] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [prescribeMed, setPrescribeMed] = useState('');
  const [prescribeMorning, setPrescribeMorning] = useState('');
  const [prescribeAfternoon, setPrescribeAfternoon] = useState('');
  const [prescribeNight, setPrescribeNight] = useState('');
  const [prescribeDays, setPrescribeDays] = useState('');
  const [completingAptId, setCompletingAptId] = useState(null);
  const [currentNotes, setCurrentNotes] = useState('');

  useEffect(() => {
    const parsedId = parseInt(doctorId || '', 10);
    if (!doctorId || doctorId === 'undefined' || doctorId === 'null' || isNaN(parsedId)) {
      localStorage.clear();
      navigate('/doctor-login');
      return;
    }
    fetchAppointments();
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctor/${doctorId}`);
      const data = await res.json();
      if (data.success && data.doctor) {
        setIsAvailable(data.doctor.available);
      }
    } catch (err) {
      console.error('Failed to fetch doctor profile:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctor/appointments/${doctorId}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      const res = await fetch(`${API_URL}/api/doctor/${doctorId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      setIsAvailable(!newStatus); // revert on fail
      alert(`Error: ${err.message}`);
    }
  };

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    if (!patientSearch) return;
    try {
      const res = await fetch(`${API_URL}/api/doctor/patient/${patientSearch}`);
      const data = await res.json();
      if (data.success) {
        setPatientData(data);
      } else {
        alert('Patient not found');
        setPatientData(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrescribe = async (e, aptId = null, patientId = null) => {
    e.preventDefault();
    const pId = patientId || patientData?.patient?.id;
    if (!prescribeMed || !pId) return;
    try {
      const res = await fetch(`${API_URL}/api/doctor/prescribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pId,
          doctorId: doctorId,
          medicineName: prescribeMed,
          morning: prescribeMorning || 0,
          afternoon: prescribeAfternoon || 0,
          night: prescribeNight || 0,
          days: prescribeDays || 1,
          appointmentId: aptId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Prescription added successfully');
        setPrescribeMed(''); setPrescribeMorning(''); setPrescribeAfternoon(''); setPrescribeNight(''); setPrescribeDays('');
        if (patientData) handleSearchPatient(new Event('Submit'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateAppointmentStatus = async (id, status, notes = '') => {
    try {
      await fetch(`${API_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      fetchAppointments();
      if (status === 'completed') setCompletingAptId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Doctor Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Welcome back</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleLogout} className="icon-button" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none' }} title="Logout">
            <LogOut size={20} color="var(--primary)" />
          </button>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1rem', color: 'white', cursor: 'pointer'
          }} onClick={() => navigate('/profile')}>
            D
          </div>
        </div>
      </header>

      {/* Status Card */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '12px', height: '12px', borderRadius: '50%', 
            background: isAvailable ? 'var(--secondary)' : 'var(--text-secondary)',
            boxShadow: isAvailable ? '0 0 10px var(--secondary)' : 'none'
          }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{isAvailable ? 'Online & Accepting Calls' : 'Offline'}</h3>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
          <input type="checkbox" checked={isAvailable} onChange={toggleAvailability} style={{ opacity: 0, width: 0, height: 0 }} />
          <span style={{
            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: isAvailable ? 'var(--secondary)' : 'var(--surface-border)',
            transition: '.4s', borderRadius: '24px'
          }}>
            <span style={{
              position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
              backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
              transform: isAvailable ? 'translateX(26px)' : 'translateX(0)'
            }} />
          </span>
        </label>
      </div>

      {/* Patient Search */}
      <div className="glass" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} /> Search Patient History
        </h3>
        <form onSubmit={handleSearchPatient} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="number"
            placeholder="Enter Patient ID"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            style={{ 
              flex: 1, padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
              color: 'white', fontSize: '1rem', outline: 'none'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px 24px', flex: 'none', width: 'auto' }}>
            Lookup
          </button>
        </form>

        {patientData && (
          <div className="animate-slide-up" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary-light)' }}>Patient: {patientData.patient.name || `User #${patientData.patient.id}`}</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone: {patientData.patient.phone}</p>
            
            <h5 style={{ margin: '0 0 8px 0' }}>Past Records ({patientData.records.length})</h5>
            {patientData.records.length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No records found.</p> : (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Type</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Doctor</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientData.records.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{r.type}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{r.doctor}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {patientData.medications && patientData.medications.length > 0 && (
              <div>
                <h5 style={{ margin: '0 0 8px 0' }}>Medications</h5>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Medicine</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Instructions</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Purchased At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientData.medications.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500 }}>{m.medicineName}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{m.instructions}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                            {m.purchasedAt}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(m.date).toLocaleDateString()}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prescriptions Table */}
            {patientData.prescriptions && patientData.prescriptions.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 8px 0' }}>Prescriptions</h5>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Medicine</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Morning</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Afternoon</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Night</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Days</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientData.prescriptions.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500 }}>{p.medicineName}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{p.morning}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{p.afternoon}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{p.night}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{p.days}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(p.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prescribe Form */}
            <h5 style={{ margin: '16px 0 8px 0', color: 'var(--primary-light)' }}>+ New Prescription</h5>
            <form onSubmit={handlePrescribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <input 
                type="text" placeholder="Medicine Name (e.g. Paracetamol)"
                value={prescribeMed} onChange={(e) => setPrescribeMed(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="number" min="0" placeholder="Morning" value={prescribeMorning} onChange={(e) => setPrescribeMorning(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                <input type="number" min="0" placeholder="Afternoon" value={prescribeAfternoon} onChange={(e) => setPrescribeAfternoon(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                <input type="number" min="0" placeholder="Night" value={prescribeNight} onChange={(e) => setPrescribeNight(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                <input type="number" min="1" placeholder="Days" value={prescribeDays} onChange={(e) => setPrescribeDays(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '12px' }}>Add Prescription</button>
            </form>

          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--primary)" /> Manage Appointments
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? <p>Loading...</p> : appointments.length === 0 ? (
            <div className="glass" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No appointments scheduled.
            </div>
          ) : appointments.map((apt) => (
            <div key={apt.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--surface-border)', padding: '10px', borderRadius: '50%' }}>
                    <User size={20} color="var(--primary-light)" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{apt.user?.name || `Patient #${apt.userId}`}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(apt.date).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '4px',
                  background: apt.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : apt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: apt.status === 'pending' ? '#FBBF24' : apt.status === 'confirmed' ? '#10B981' : 'white'
                }}>
                  {apt.status.toUpperCase()}
                </span>
              </div>
              
              {apt.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button className="btn-primary" style={{ flex: 1, padding: '8px', background: 'var(--secondary)' }} onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                    <CheckCircle size={16} /> Confirm
                  </button>
                  <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                    Cancel
                  </button>
                </div>
              )}
              {apt.status === 'confirmed' && completingAptId !== apt.id && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button className="btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => navigate(`/consultations?room=apt_${apt.id}`)}>
                    <Video size={16} /> Start Call
                  </button>
                  <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => { setCompletingAptId(apt.id); setCurrentNotes(''); }}>
                    Complete & Notes
                  </button>
                </div>
              )}

              {completingAptId === apt.id && (
                <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px' }}>
                  <h5 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>Prescribe Medicine for this Appointment</h5>
                  <form onSubmit={(e) => handlePrescribe(e, apt.id, apt.userId)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <input 
                      type="text" placeholder="Medicine Name"
                      value={prescribeMed} onChange={(e) => setPrescribeMed(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} required
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" min="0" placeholder="M" value={prescribeMorning} onChange={(e) => setPrescribeMorning(e.target.value)} style={{ width: '40px', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} />
                      <input type="number" min="0" placeholder="A" value={prescribeAfternoon} onChange={(e) => setPrescribeAfternoon(e.target.value)} style={{ width: '40px', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} />
                      <input type="number" min="0" placeholder="N" value={prescribeNight} onChange={(e) => setPrescribeNight(e.target.value)} style={{ width: '40px', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} />
                      <input type="number" min="1" placeholder="Days" value={prescribeDays} onChange={(e) => setPrescribeDays(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} />
                    </div>
                    <button type="submit" className="btn-secondary" style={{ padding: '8px' }}>+ Add Prescription</button>
                  </form>

                  <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>Extra Suggestions / Notes</h5>
                  <textarea 
                    placeholder="e.g. Take X-ray, drink plenty of fluids..."
                    value={currentNotes}
                    onChange={(e) => setCurrentNotes(e.target.value)}
                    style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={() => updateAppointmentStatus(apt.id, 'completed', currentNotes)}>
                      Mark Complete
                    </button>
                    <button className="btn-secondary" onClick={() => setCompletingAptId(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DoctorDashboard;
