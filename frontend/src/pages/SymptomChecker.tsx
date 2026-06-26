import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Activity, BrainCircuit } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SymptomChecker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [symptoms, setSymptoms] = useState(location.state?.autoSymptoms || '');
  const [duration, setDuration] = useState('Less than 24 hours');
  const [severity, setSeverity] = useState('Mild');
  const [ageGroup, setAgeGroup] = useState('Adult (18-64)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [hasAutoRun, setHasAutoRun] = useState(false);

  useEffect(() => {
    if (symptoms && location.state?.autoSymptoms && !hasAutoRun) {
      handleAnalyze();
      setHasAutoRun(true);
    }
  }, [symptoms, location.state, hasAutoRun]);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);
    setPrediction(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const promptData = [
        `Symptoms: ${symptoms}`,
        `Duration: ${duration}`,
        `Severity: ${severity}`,
        `Age Group: ${ageGroup}`
      ];

      const response = await fetch(`${API_URL}/api/ai/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: promptData })
      });
      
      const data = await response.json();
      if (data.success) {
        // --- INJECT NATIVE TRANSLATION FOR OLD BACKEND / MOCK DATA ---
        let isMock = false;
        if (data.predictions && data.predictions.length > 0) {
            isMock = data.predictions[0].condition.includes('Mock');
        }
        
        if (isMock) {
            alert("Server Busy (Rate Limit). Please wait 1 minute before trying again.");
            return;
        } else if (!data.summary && data.predictions && data.predictions.length > 0) {
            // If it's a real response from the old backend without the summary field
            data.summary = `${data.predictions[0].condition}. ${data.predictions[0].recommendation}`;
        }
        // -------------------------------------------------------------

        setPrediction(data);
      } else {
        throw new Error('Prediction failed');
      }
    } catch (err) {
      console.error(err);
      setPrediction({
        urgency: 'Medium',
        recommendation: 'Unable to reach AI service. Please consult a doctor directly.',
        predictions: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-button" onClick={() => navigate(-1)} style={{ width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Symptom Checker</h1>
      </header>

      <div className="glass-card animate-slide-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={20} color="var(--primary)" />
          AI-Powered Symptom Checker
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Describe your symptoms in detail</label>
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. headache, fever, body ache..."
              style={{ 
                width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', 
                border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.1)', 
                color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.1)', color: 'var(--text-primary)' }}>
                <option value="Less than 24 hours">Less than 24 hours</option>
                <option value="1-3 days">1-3 days</option>
                <option value="More than a week">More than a week</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.1)', color: 'var(--text-primary)' }}>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Age Group</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.1)', color: 'var(--text-primary)' }}>
                <option value="Child (0-12)">Child (0-12)</option>
                <option value="Teen (13-17)">Teen (13-17)</option>
                <option value="Adult (18-64)">Adult (18-64)</option>
                <option value="Senior (65+)">Senior (65+)</option>
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={handleAnalyze} disabled={isAnalyzing || !symptoms.trim()} style={{ marginTop: '8px', background: '#2563EB', color: 'white', padding: '12px', border: 'none' }}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </div>
      </div>

      {isAnalyzing && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ animation: 'pulse-subtle 1s infinite alternate', background: 'rgba(37, 99, 235, 0.1)', padding: '20px', borderRadius: '50%' }}>
            <Activity color="#2563EB" size={40} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '16px' }}>Analyzing your symptoms...</h3>
        </div>
      )}

      {prediction && !isAnalyzing && (
        <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>AI Analysis Results</h2>
          </div>
          
          <div style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '0.95rem' }}>
              Based on your symptoms, you might have:
            </p>
            
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#2563EB', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prediction.predictions?.map((p, idx) => (
                <li key={idx}><strong>{p.condition}</strong> - {p.recommendation || prediction.recommendation || 'Please consult a doctor.'}</li>
              ))}
              {(!prediction.predictions || prediction.predictions.length === 0) && (
                <li>No specific condition matched.</li>
              )}
            </ul>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#B45309', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>This is AI-generated advice. Please consult a qualified doctor for proper diagnosis.</span>
            </div>

            {prediction.summary && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '16px', color: 'var(--text-primary)', fontSize: '1rem', lineHeight: '1.5', marginBottom: '16px' }}>
                <strong style={{ color: '#10B981', display: 'block', marginBottom: '8px' }}>Summary:</strong>
                {prediction.summary}
              </div>
            )}

            {prediction.explanation && (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>Full Explanation:</strong>
                {prediction.explanation}
              </div>
            )}

            {prediction.thingsToAvoid && prediction.thingsToAvoid.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <strong style={{ color: '#EF4444', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>Things to Avoid:</strong>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {prediction.thingsToAvoid.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/consultations')} style={{ flex: 1, background: '#10B981', color: 'white', padding: '12px', minWidth: '150px', border: 'none' }}>
              Book Consultation
            </button>
            <button className="btn-primary" onClick={() => navigate('/medicines', { state: { query: prediction.suggestedMedicine || '' } })} style={{ flex: 1, background: '#F97316', color: 'white', padding: '12px', minWidth: '150px', border: 'none' }}>
              Find Medicines
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
