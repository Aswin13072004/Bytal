import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNavigationComponent from './components/BottomNavigation';
import TopProfileMenu from './components/TopProfileMenu';
import Dashboard from './pages/Dashboard';
import Gym from './pages/Gym';
import Profile from './pages/Profile';
import Timer from './pages/Timer';
import Login from './pages/Login';
import './index.css';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black-950 via-black-900 to-black-800 flex items-center justify-center">
        <div className="ice-loading w-16 h-16"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main app content
const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="App">
      {user && <TopProfileMenu />}
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/gym" element={
          <ProtectedRoute>
            <Gym />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/timer" element={
          <ProtectedRoute>
            <Timer />
          </ProtectedRoute>
        } />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <BottomNavigationComponent />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
