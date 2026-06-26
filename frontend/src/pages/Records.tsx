import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Bell, CheckCircle, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Records = () => {
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'https://ruralcarex.onrender.com';

  React.useEffect(() => {
    const userId = parseInt(localStorage.getItem('userId')) || 1;
    fetch(`${API_URL}/api/doctor/patient/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppointments(data.appointments || []);
          setMedicalHistory(data.records || []);
          setMedications(data.medications || []);
          setPrescriptions(data.prescriptions || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/api/patient/${userId}/notifications`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setNotifications(data.notifications || []);
      })
      .catch(err => console.error(err));

    fetch(`${API_URL}/api/doctors`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDoctorsList(data.data || []);
      })
      .catch(err => console.error(err));
  }, []);

  const handleMarkAsRead = async () => {
    try {
      const userId = parseInt(localStorage.getItem('userId')) || 1;
      await fetch(`${API_URL}/api/patient/${userId}/notifications/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = (record) => {
    try {
      const doc = new jsPDF();
      const docDetails = doctorsList.find(d => d.name === record.doctor);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Primary color
    doc.text("RuralCareX", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Digital Health Record", 105, 30, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35);
    
    // Doctor Details
    doc.setFontSize(12);
    doc.text(`Doctor: ${record.doctor}`, 14, 45);
    doc.text(`Phone: ${docDetails?.phone || 'N/A'}`, 14, 52);
    doc.text(`Address: ${docDetails?.address || 'N/A'}`, 14, 59);
    
    // Patient & Date Details
    doc.text(`Patient ID: ${record.userId}`, 120, 45);
    doc.text(`Date & Time: ${new Date(record.date).toLocaleString()}`, 120, 52);
    
    // Problem Section
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Consultation Details", 14, 75);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    const problemText = doc.splitTextToSize(`Diagnosis / Problem: ${record.type === 'General Consultation' ? 'General Checkup & Symptom Review' : record.type}`, 180);
    doc.text(problemText, 14, 85);
    
    // Active Prescriptions on that date
    const recordDateString = new Date(record.date).toLocaleDateString();
    let relatedPrescriptions = [];
    if (record.appointmentId) {
      relatedPrescriptions = prescriptions.filter(p => p.appointmentId === record.appointmentId);
    } else {
      // Fallback for older records
      relatedPrescriptions = prescriptions.filter(p => new Date(p.date).toLocaleDateString() === recordDateString);
    }
    
    let currentY = 105;
    
    // Doctor's Extra Suggestions / Notes
    if (record.notes) {
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text("Doctor's Extra Suggestions", 14, currentY);
      currentY += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      const notesText = doc.splitTextToSize(record.notes, 180);
      doc.text(notesText, 14, currentY);
      currentY += (notesText.length * 5) + 10;
    }

    if (relatedPrescriptions.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text("Prescriptions", 14, currentY);
      currentY += 10;
      
      const tableData = relatedPrescriptions.map(p => [
        p.medicineName,
        `${p.morning} - ${p.afternoon} - ${p.night}`,
        `${p.days} Days`
      ]);
      
      try {
        autoTable(doc, {
          startY: currentY,
          head: [['Medicine', 'Dosage (M-A-N)', 'Duration']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 20;
      } catch (err) {
        console.error("autoTable error:", err);
      }
    } else {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("No new prescriptions issued during this consultation.", 14, currentY);
      currentY += 20;
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This is an electronically generated document.", 105, 280, { align: "center" });
    
    doc.save(`RuralCareX_Record_${record.id}.pdf`);
    } catch (err) {
      alert("Download failed: " + err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-button" onClick={() => navigate(-1)} style={{ width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{'Digital Health Records'}</h1>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText color="var(--secondary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--secondary)' }}>{'Available Offline'}</span>
        </div>
      </div>

      {notifications.filter(n => !n.isRead).length > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24' }}>
              <Bell size={18} /> {'Notifications'}
            </h3>
            <button onClick={handleMarkAsRead} className="icon-button" style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', borderRadius: '6px' }}>
              {'Mark Read'}
            </button>
          </div>
          {notifications.filter(n => !n.isRead).map(n => (
            <div key={n.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <CheckCircle size={16} color="#10B981" style={{ marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{'Loading Records'}</div>
      ) : appointments.length === 0 && medicalHistory.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{'No Records Or Appointments'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {appointments.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>{'Upcoming Appointments'}</h2>
              <div className="responsive-grid">
                {appointments.map((rec, idx) => (
                  <div key={idx} className={`glass animate-slide-up delay-${idx + 1}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: 'var(--surface-border)', padding: '12px', borderRadius: '12px' }}>
                        <Calendar size={24} color="var(--primary-light)" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{'Appointment'}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <Calendar size={12} />
                          <span style={{ fontSize: '0.8rem' }}>{new Date(rec.date).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Doctor ID: {rec.doctorId}</p>
                        <span style={{ 
                          fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block',
                          background: rec.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: rec.status === 'pending' ? '#FBBF24' : '#10B981'
                        }}>
                          {rec.status === 'pending' ? 'Pending' : 'Completed'}
                        </span>
                      </div>
                    </div>
                    {rec.status === 'confirmed' && (
                      <button 
                        className="btn-primary" 
                        style={{ padding: '8px 12px', fontSize: '0.8rem', background: '#10B981', display: 'flex', gap: '6px', alignItems: 'center' }}
                        onClick={() => navigate(`/consultations?room=apt_${rec.id}`)}
                      >
                        <Video size={14} /> {'Join Call'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {prescriptions.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>{'Active Prescriptions'}</h2>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Medicine'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Morning'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Afternoon'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Night'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Days'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 500 }}>{p.medicineName}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{p.morning}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{p.afternoon}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{p.night}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{p.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {medications.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>{'Medications'}</h2>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--surface-border)', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Medicine'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Morning'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Afternoon'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Night'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Days'}</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{'Pharmacy'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 500 }}>{med.medicineName}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{med.morning || 0}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{med.afternoon || 0}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{med.night || 0}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{med.days || 1}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{med.purchasedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {medicalHistory.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>{'Medical History'}</h2>
              <div className="responsive-grid">
                {medicalHistory.map((rec, idx) => (
                  <div key={idx} className={`glass animate-slide-up delay-${idx + 1}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: 'var(--surface-border)', padding: '12px', borderRadius: '12px' }}>
                        <FileText size={24} color="var(--primary-light)" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{rec.type}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <Calendar size={12} />
                          <span style={{ fontSize: '0.8rem' }}>{new Date(rec.date).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{rec.doctor}</p>
                      </div>
                    </div>
                    <button className="icon-button" style={{ background: 'transparent', border: 'none' }} onClick={() => handleDownloadPDF(rec)}>
                      <Download size={20} color="var(--primary)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Records;
