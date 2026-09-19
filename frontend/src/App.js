import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import InvestigatePage from './pages/InvestigatePage';
import HistoryPage     from './pages/HistoryPage';
import ProfilePage     from './pages/ProfilePage';
import TrustCirclePage from './pages/TrustCirclePage';
import ReportsPage     from './pages/ReportsPage';
import NetworkScanPage from './pages/NetworkScanPage';
import AuditLogsPage   from './pages/AuditLogsPage';
import './styles/globals.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading CyberTwin...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading CyberTwin...</div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"              element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"         element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"      element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/dashboard"     element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/investigate"   element={<PrivateRoute><InvestigatePage /></PrivateRoute>} />
          <Route path="/history"       element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/trust-circle"  element={<PrivateRoute><TrustCirclePage /></PrivateRoute>} />
          <Route path="/reports"       element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
          <Route path="/network-scan"  element={<PrivateRoute><NetworkScanPage /></PrivateRoute>} />
          <Route path="/audit-logs"    element={<PrivateRoute><AuditLogsPage /></PrivateRoute>} />
          <Route path="/profile"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
