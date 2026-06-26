import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft, Edit2, Save, X, Phone, Mail, MapPin, Activity, Droplet, Hash, Star, Briefcase } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'guest';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // We need the ID to fetch from /api/profile/:role/:id
  let userId = localStorage.getItem('userId') || '1';
  if (role === 'doctor') userId = localStorage.getItem('doctorId') || '1';
  if (role === 'pharmacy') userId = localStorage.getItem('pharmacyId') || '1';

  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [role, userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/${role}/${userId}`);
      const data = await res.json();
      if (data.success) {
        setProfileData(data.profile);
        setEditForm(data.profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/${role}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setProfileData(data.profile);
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profile...</div>;
  }

  if (!profileData) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Failed to load profile. Your session might be invalid.</p>
        <button className="btn-primary" onClick={handleLogout} style={{ width: '200px' }}>
          <LogOut size={18} style={{ marginRight: '8px' }} /> Log Out & Re-login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh', overflowY: 'auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="icon-button" onClick={() => navigate(-1)} style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>My Profile</h1>
        </div>
        {!isEditing ? (
          <button className="icon-button" onClick={() => { setIsEditing(true); setEditForm(profileData); }} style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <Edit2 size={18} />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="icon-button" onClick={() => setIsEditing(false)} style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <X size={18} />
            </button>
            <button className="icon-button" onClick={handleSave} style={{ width: '40px', height: '40px', background: '#10B981', color: 'white' }}>
              <Save size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="glass-card animate-slide-up delay-1" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', 
          background: 'var(--surface-border)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
        }}>
          {profileData.photo ? (
             <img src={profileData.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
             <User size={48} color="var(--primary-light)" />
          )}
        </div>
        
        {isEditing ? (
          <div style={{ width: '100%' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'left' }}>Upload Profile Picture</label>
            <input 
              type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEditForm((prev: any) => ({ ...prev, photo: reader.result as string }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--surface-border)', border: '1px dashed var(--primary-light)', color: 'var(--text-primary)', textAlign: 'center' }}
            />
          </div>
        ) : null}
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          {isEditing ? (
            <input 
              type="text" name="name" placeholder="Full Name" 
              value={editForm.name || ''} onChange={handleInputChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}
            />
          ) : (
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profileData.name || 'Unnamed User'}</h2>
          )}
          <p style={{ color: 'var(--primary)', margin: '4px 0', fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>
            {role === 'patient' ? 'Patient Account' : role === 'doctor' ? 'Healthcare Professional' : 'Pharmacy Store'}
          </p>
        </div>

        <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <Mail size={20} color="var(--text-secondary)" />
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</span>
              {isEditing ? (
                <input type="email" name="email" value={editForm.email || ''} onChange={handleInputChange} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} placeholder="Enter email address" />
              ) : (
                <span style={{ fontSize: '0.95rem' }}>{profileData.email || 'Not provided'}</span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <Phone size={20} color="var(--text-secondary)" />
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number</span>
              {isEditing ? (
                <input type="tel" name="phone" value={editForm.phone || ''} onChange={handleInputChange} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} placeholder="Enter phone number" />
              ) : (
                <span style={{ fontSize: '0.95rem' }}>{profileData.phone || 'Not provided'}</span>
              )}
            </div>
          </div>

          {/* Address (Hospital for Doctor, Pharmacy for Pharmacy, Home for Patient) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <MapPin size={20} color="var(--text-secondary)" />
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {role === 'doctor' ? 'Hospital Address' : role === 'pharmacy' ? 'Pharmacy Address' : 'Home Address'}
              </span>
              {isEditing ? (
                <input type="text" name="address" value={editForm.address || ''} onChange={handleInputChange} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} placeholder={`Enter ${role === 'doctor' ? 'hospital' : 'home'} address`} />
              ) : (
                <span style={{ fontSize: '0.95rem' }}>{profileData.address || 'Not provided'}</span>
              )}
            </div>
          </div>

          {/* Patient Specific Fields */}
          {role === 'patient' && (
            <>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  <Hash size={20} color="var(--text-secondary)" />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Age</span>
                    {isEditing ? (
                      <input type="number" name="age" value={editForm.age || ''} onChange={handleInputChange} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} placeholder="Age" />
                    ) : (
                      <span style={{ fontSize: '0.95rem' }}>{profileData.age || '--'}</span>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  <User size={20} color="var(--text-secondary)" />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</span>
                    {isEditing ? (
                      <select name="gender" value={editForm.gender || ''} onChange={handleInputChange} style={{ width: '100%', background: 'var(--background)', border: 'none', color: 'white', outline: 'none', padding: '4px' }}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.95rem' }}>{profileData.gender || '--'}</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <Droplet size={20} color="#EF4444" />
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Group</span>
                  {isEditing ? (
                    <select name="bloodGroup" value={editForm.bloodGroup || ''} onChange={handleInputChange} style={{ width: '100%', background: 'var(--background)', border: 'none', color: 'white', outline: 'none', padding: '4px' }}>
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: '0.95rem' }}>{profileData.bloodGroup || '--'}</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Doctor Specific Fields */}
          {role === 'doctor' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <Briefcase size={20} color="var(--text-secondary)" />
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Specialty</span>
                {isEditing ? (
                  <input type="text" name="specialty" value={editForm.specialty || ''} onChange={handleInputChange} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} placeholder="Enter specialty" />
                ) : (
                  <span style={{ fontSize: '0.95rem' }}>{profileData.specialty || 'Not provided'}</span>
                )}
              </div>
            </div>
          )}

        </div>

        <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: '16px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;

