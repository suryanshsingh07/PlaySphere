import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIChatbot from './components/AIChatbot';
import Home from './pages/Home';
import Explore from './pages/Explore';
import VenueDetail from './pages/VenueDetail';
import Bookings from './pages/Bookings';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

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
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/venue/:id" element={<VenueDetail />} />
            <Route
              path="/bookings"
              element={token ? <Bookings /> : <Navigate to="/auth" />}
            />
            <Route
              path="/dashboard"
              element={token ? <Dashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/auth"
              element={!token ? <Auth /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        {token && <AIChatbot />}
      </div>
    </AuthContext.Provider>
  );
}

export default App;
