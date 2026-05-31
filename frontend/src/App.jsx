import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIChatbot from './components/AIChatbot';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import VenueDetail from './pages/VenueDetail';
import Bookings from './pages/Bookings';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// ── Auth Context ─────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ps_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ps_token') || null);

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('ps_user', JSON.stringify(userData));
    localStorage.setItem('ps_token', tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ps_user');
    localStorage.removeItem('ps_token');
  };

  const authValue = { user, token, login, logout, isAuthenticated: !!token };

  return (
    <AuthContext.Provider value={authValue}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Custom Loader from Uiverse.io by SelfMadeSystem */
        .uiverse-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 1em 0;
        }
        .uiverse-loader svg {
          width: 60px;
          height: 60px;
        }
        .uiverse-loader .dash {
          animation: dashArray 2s ease-in-out infinite, dashOffset 2s linear infinite;
        }
        .uiverse-loader .spin {
          animation: spinDashArray 2s ease-in-out infinite, spinUiverse 8s ease-in-out infinite, dashOffset 2s linear infinite;
          transform-origin: center;
        }
        @keyframes dashArray {
          0% { stroke-dasharray: 0 1 359 0; }
          50% { stroke-dasharray: 0 359 1 0; }
          100% { stroke-dasharray: 359 1 0 0; }
        }
        @keyframes spinDashArray {
          0% { stroke-dasharray: 270 90; }
          50% { stroke-dasharray: 0 360; }
          100% { stroke-dasharray: 270 90; }
        }
        @keyframes dashOffset {
          0% { stroke-dashoffset: 365; }
          100% { stroke-dashoffset: 5; }
        }
        @keyframes spinUiverse {
          0% { transform: rotate(0deg); }
          12.5%, 25% { transform: rotate(270deg); }
          37.5%, 50% { transform: rotate(540deg); }
          62.5%, 75% { transform: rotate(810deg); }
          87.5%, 100% { transform: rotate(1080deg); }
        }
      `}} />
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/venue/:id" element={<VenueDetail />} />
            <Route
              path="/bookings"
              element={token ? <Bookings /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={token ? <Profile /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard"
              element={token ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={token && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={!token ? <Auth /> : <Navigate to="/" />}
            />
            <Route
              path="/register"
              element={!token ? <Auth /> : <Navigate to="/" />}
            />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        {token && <AIChatbot />}
      </div>
    </AuthContext.Provider>
  );
}

export default App;
