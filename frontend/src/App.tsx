import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Stethoscope, FileText, User, Activity, Package, Sun, Moon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import SymptomChecker from './pages/SymptomChecker';
import Consultations from './pages/Consultations';
import Records from './pages/Records';
import Medicines from './pages/Medicines';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacyLogin from './pages/PharmacyLogin';
import PharmacyRegister from './pages/PharmacyRegister';
import PharmacyDashboard from './pages/PharmacyDashboard';
import Profile from './pages/Profile';

// Auth Guard Wrapper
const ProtectedRoute = ({ children, allowedRole = 'patient' }: { children: JSX.Element, allowedRole?: string }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('role') || 'patient';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (role !== allowedRole) {
    return <Navigate to={role === 'doctor' ? '/doctor/dashboard' : '/'} replace />;
  }
  
  return children;
};

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Hide nav on login pages
  const authPaths = ['/login', '/register', '/doctor-login', '/doctor-register', '/pharmacy-login', '/pharmacy-register'];
  if (authPaths.includes(location.pathname)) {
    return (
      <main style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="app-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    );
  }

  const role = localStorage.getItem('role');

  const patientNavItems = [
    { path: '/', icon: <Home size={24} />, label: 'Home' },
    { path: '/symptom', icon: <Stethoscope size={24} />, label: 'Check' },
    { path: '/consultations', icon: <User size={24} />, label: 'Doctors' },
    { path: '/records', icon: <FileText size={24} />, label: 'Records' },
  ];

  const doctorNavItems = [
    { path: '/doctor/dashboard', icon: <Activity size={24} />, label: 'Dashboard' }
  ];

  const pharmacyNavItems = [
    { path: '/pharmacy/dashboard', icon: <Package size={24} />, label: 'Inventory' }
  ];

  const navItems = role === 'pharmacy' ? pharmacyNavItems : (role === 'doctor' ? doctorNavItems : patientNavItems);

  return (
    <>
      <main style={{ flex: 1, paddingBottom: '80px', height: '100%', overflowY: 'auto' }}>
        <div className="app-container">
          {children}
        </div>
      </main>
      
      <nav className="desktop-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--surface)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--surface-border)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        zIndex: 50,
        borderBottomLeftRadius: 'inherit',
        borderBottomRightRadius: 'inherit'
      }}>
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
            }}
          >
            {item.icon}
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function App() {
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <Router>
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
        <button 
          onClick={() => setIsLightMode(!isLightMode)}
          className="icon-button"
          style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}
        >
          {isLightMode ? <Moon size={20} color="var(--primary)" /> : <Sun size={20} color="var(--primary)" />}
        </button>
      </div>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/doctor-register" element={<DoctorRegister />} />
          <Route path="/pharmacy-login" element={<PharmacyLogin />} />
          <Route path="/pharmacy-register" element={<PharmacyRegister />} />
          <Route path="/profile" element={<Profile />} />
          
          <Route path="/" element={<ProtectedRoute allowedRole="patient"><Dashboard /></ProtectedRoute>} />
          <Route path="/symptom" element={<ProtectedRoute allowedRole="patient"><SymptomChecker /></ProtectedRoute>} />
          <Route path="/consultations" element={<ProtectedRoute allowedRole="patient"><Consultations /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute allowedRole="patient"><Records /></ProtectedRoute>} />
          <Route path="/medicines" element={<ProtectedRoute allowedRole="patient"><Medicines /></ProtectedRoute>} />
          
          <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/call" element={<ProtectedRoute allowedRole="doctor"><Consultations /></ProtectedRoute>} />
          
          <Route path="/pharmacy/dashboard" element={<ProtectedRoute allowedRole="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
