import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Trash2, UserCheck, CheckCircle, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Area } from 'recharts';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const pharmacyId = localStorage.getItem('pharmacyId');
  const pharmacyName = localStorage.getItem('pharmacyName') || 'Pharmacy';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  const [inventory, setInventory] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedStock, setNewMedStock] = useState('');
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  
  const [patientSearch, setPatientSearch] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [dispenseMed, setDispenseMed] = useState('');
  const [dispenseMorning, setDispenseMorning] = useState('');
  const [dispenseAfternoon, setDispenseAfternoon] = useState('');
  const [dispenseNight, setDispenseNight] = useState('');
  const [dispenseDays, setDispenseDays] = useState('');

  // Auto-fill form if medicine matches a previous record
  useEffect(() => {
    if (patientData && patientData.medications && dispenseMed) {
      const match = patientData.medications.find(
        m => m.medicineName.toLowerCase() === dispenseMed.toLowerCase()
      );
      if (match) {
        setDispenseMorning(match.morning?.toString() || '0');
        setDispenseAfternoon(match.afternoon?.toString() || '0');
        setDispenseNight(match.night?.toString() || '0');
        setDispenseDays(match.days?.toString() || '1');
      }
    }
  }, [dispenseMed, patientData]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacy/${pharmacyId}/inventory`);
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newMedName || !newMedStock) return;
    try {
      await fetch(`${API_URL}/api/pharmacy/${pharmacyId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMedName, stock: newMedStock })
      });
      setNewMedName('');
      setNewMedStock('');
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMedicine = async (id) => {
    try {
      await fetch(`${API_URL}/api/pharmacy/inventory/${id}`, { method: 'DELETE' });
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMedicine = async (id) => {
    if (!editStockValue) return;
    try {
      await fetch(`${API_URL}/api/pharmacy/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: editStockValue })
      });
      setEditingMedicine(null);
      setEditStockValue('');
      fetchInventory();
    } catch (err) {
      console.error(err);
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

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!dispenseMed || !patientData) return;
    
    try {
      const res = await fetch(`${API_URL}/api/pharmacy/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: patientData.patient.id,
          medicineName: dispenseMed,
          morning: dispenseMorning || 0,
          afternoon: dispenseAfternoon || 0,
          night: dispenseNight || 0,
          days: dispenseDays || 1,
          purchasedAt: pharmacyName,
          pharmacyId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Medicine dispensed and recorded successfully!');
        setDispenseMed('');
        setDispenseMorning(''); setDispenseAfternoon(''); setDispenseNight(''); setDispenseDays('');
        setPatientData(null);
        setPatientSearch('');
        fetchInventory();
      } else {
        alert(data.message || 'Failed to dispense medicine');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dispense medicine');
    }
  };

  const handleDispensePrescription = async (prescription) => {
    try {
      const res = await fetch(`${API_URL}/api/pharmacy/dispense-prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: prescription.id,
          pharmacyId,
          pharmacyName
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Prescription dispensed and stock updated successfully!');
        handleSearchPatient(new Event('Submit') as any);
        fetchInventory();
      } else {
        alert(`Failed to dispense: ${data.message}`);
        handleSearchPatient(new Event('Submit') as any);
      }
    } catch (err) {
      console.error(err);
      alert('Error dispensing prescription');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/pharmacy-login');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{pharmacyName}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Inventory & Dispensing</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleLogout} className="icon-button" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none' }} title="Logout">
            <LogOut size={20} color="#10B981" />
          </button>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', 
            background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1rem', color: 'white', cursor: 'pointer'
          }} onClick={() => navigate('/profile')}>
            P
          </div>
        </div>
      </header>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#10B981' }}>Stock Details (Real-time)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend />
                <Bar dataKey="stock" name="Current Stock" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#EF4444' }}>Stock Sold (Profit & Loss)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend />
                <Line type="monotone" dataKey="totalSold" name="Total Sold (Loss of Stock / Profit)" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#3B82F6' }}>Inventory Distribution</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventory} dataKey="stock" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {inventory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#F59E0B' }}>Stock vs Sales Overview</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={inventory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend />
                <Area type="monotone" dataKey="stock" name="Remaining Stock" fill="#8B5CF6" stroke="#8B5CF6" fillOpacity={0.3} />
                <Bar dataKey="totalSold" name="Total Sold" barSize={20} fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patient Dispensing Section */}
      <div className="glass" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={18} color="#10B981" /> Dispense to Patient
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
          <button type="submit" className="btn-primary" style={{ padding: '12px 24px', flex: 'none', background: '#10B981', width: 'auto' }}>
            Lookup
          </button>
        </form>

        {patientData && (
          <div className="animate-slide-up" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#10B981' }}>Dispensing to: {patientData.patient.name || `Patient #${patientData.patient.id}`}</h4>
            
            {patientData.prescriptions && patientData.prescriptions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Active Prescriptions</h5>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Medicine</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Morning</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Afternoon</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Night</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Days</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Status</th>
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
                          <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: p.status === 'dispensed' ? '#10B981' : p.status === 'out_of_stock' ? '#EF4444' : '#FBBF24' }}>
                            {p.status === 'pending' ? (
                              <button onClick={() => handleDispensePrescription(p)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#10B981' }}>Dispense</button>
                            ) : (
                              p.status.toUpperCase().replace('_', ' ')
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {patientData.medications && patientData.medications.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Previous Medications</h5>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Medicine</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Morning</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Afternoon</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Night</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Days</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Pharmacy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientData.medications.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500 }}>{m.medicineName}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{m.morning || 0}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{m.afternoon || 0}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{m.night || 0}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.9rem' }}>{m.days || 1}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.purchasedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <form onSubmit={handleDispense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text"
                placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                value={dispenseMed}
                onChange={(e) => setDispenseMed(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
                  color: 'white', fontSize: '0.9rem', outline: 'none'
                }}
                required
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="number" min="0" placeholder="Morning" value={dispenseMorning} onChange={(e) => setDispenseMorning(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                <input type="number" min="0" placeholder="Afternoon" value={dispenseAfternoon} onChange={(e) => setDispenseAfternoon(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                <input type="number" min="0" placeholder="Night" value={dispenseNight} onChange={(e) => setDispenseNight(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                <input type="number" min="1" placeholder="Days" value={dispenseDays} onChange={(e) => setDispenseDays(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Mark as Bought
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Inventory Management Section */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={20} color="#10B981" /> Inventory Stock
        </h3>
        
        <form onSubmit={handleAddMedicine} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input 
            type="text"
            placeholder="Medicine Name"
            value={newMedName}
            onChange={(e) => setNewMedName(e.target.value)}
            style={{ 
              flex: 2, padding: '12px', borderRadius: '8px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
              color: 'white', fontSize: '0.9rem', outline: 'none'
            }}
            required
          />
          <input 
            type="number"
            placeholder="Stock"
            value={newMedStock}
            onChange={(e) => setNewMedStock(e.target.value)}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)',
              color: 'white', fontSize: '0.9rem', outline: 'none'
            }}
            required
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px', flex: 'none', background: '#10B981', width: 'auto' }}>
            <Plus size={20} />
          </button>
        </form>

        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)' }}>
          {inventory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No medicines in inventory. Add some above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Medicine Name</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Previous Stock</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Remaining Stock</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Total Sold</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Last Updated</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.name}</td>
                    
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.previousStock || 0}</td>
                    
                    <td style={{ padding: '12px 16px' }}>
                      {editingMedicine === item.id ? (
                        <input 
                          type="number" 
                          value={editStockValue}
                          onChange={(e) => setEditStockValue(e.target.value)}
                          style={{ width: '80px', padding: '6px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--surface-border)' }}
                        />
                      ) : (
                        <span style={{ 
                          color: item.stock < 10 ? '#EF4444' : 'var(--text-primary)',
                          fontWeight: item.stock < 10 ? 'bold' : 'normal'
                        }}>
                          {item.stock}
                        </span>
                      )}
                    </td>
                    
                    <td style={{ padding: '12px 16px', color: '#EF4444', fontWeight: 500 }}>
                      {item.totalSold || 0}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}
                    </td>
                    
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {editingMedicine === item.id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleUpdateMedicine(item.id)} className="btn-primary" style={{ padding: '6px 12px', background: '#10B981', fontSize: '0.8rem' }}>Save</button>
                          <button onClick={() => setEditingMedicine(null)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingMedicine(item.id); setEditStockValue(item.stock.toString()); }} className="icon-button" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteMedicine(item.id)} className="icon-button" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', padding: '6px' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default PharmacyDashboard;
