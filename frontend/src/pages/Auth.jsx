import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { Mail, Lock, User, Phone, Sparkles, AlertCircle, Loader } from 'lucide-react';

const SPORTS = ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'swimming', 'gym'];

export default function Auth() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // user | venue_owner
  const [phone, setPhone] = useState('');
  const [preferredSports, setPreferredSports] = useState([]);

  const toggleSportSelection = (sport) => {
    if (preferredSports.includes(sport)) {
      setPreferredSports(preferredSports.filter(s => s !== sport));
    } else {
      setPreferredSports([...preferredSports, sport]);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email: demoEmail, password: demoPassword });
      if (res.data.success) {
        login(res.data.data, res.data.data.token);
        navigate(res.data.data.role === 'venue_owner' ? '/dashboard' : '/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLoginMode) {
        // Login API Call
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data.success) {
          login(res.data.data, res.data.data.token);
          navigate('/');
        }
      } else {
        // Register API Call
        const res = await axios.post('/api/auth/register', {
          username,
          email,
          password,
          role,
          phone,
          preferredSports
        });
        if (res.data.success) {
          login(res.data.data, res.data.data.token);
          navigate(res.data.data.role === 'venue_owner' ? '/dashboard' : '/');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center hero-bg" style={{ minHeight: '85vh', padding: '40px 16px', background: 'var(--gradient-hero)' }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '15%',
        width: '260px',
        height: '260px',
        background: 'rgba(6, 182, 212, 0.1)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '15%',
        width: '260px',
        height: '260px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-strong animate-fade-in" style={{
        width: '100%',
        maxWidth: isLoginMode ? '420px' : '520px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-xl)',
        padding: '32px',
        position: 'relative',
        zIndex: 10,
        transition: 'max-width var(--transition-slow)'
      }}>
        {/* Toggle tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', paddingBottom: '10px' }}>
          <button
            type="button"
            onClick={() => { setIsLoginMode(true); setError(null); }}
            style={{
              background: 'transparent',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: isLoginMode ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: isLoginMode ? '2px solid var(--accent-primary)' : '2px solid transparent',
              paddingBottom: '8px',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginMode(false); setError(null); }}
            style={{
              background: 'transparent',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: !isLoginMode ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: !isLoginMode ? '2px solid var(--accent-primary)' : '2px solid transparent',
              paddingBottom: '8px',
              cursor: 'pointer'
            }}
          >
            Register Account
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} className="text-gradient" /> PlaySphere
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isLoginMode 
              ? 'Enter email and password to log back in.' 
              : 'Join the premier sports arena booking network.'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username (Only Register) */}
          {!isLoginMode && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <div className="input-icon-wrapper">
                <User size={16} className="icon-left" />
                <input
                  type="text"
                  placeholder="e.g. arjun_striker"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLoginMode}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="icon-left" />
              <input
                type="email"
                placeholder="e.g. name@playsphere.in"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="icon-left" />
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role selection & Phone (Only Register) */}
          {!isLoginMode && (
            <>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Register As</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ padding: '12px 16px', fontSize: '0.95rem' }}
                  >
                    <option value="user">Player (Athlete)</option>
                    <option value="venue_owner">Venue Owner (Manager)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mobile Number</label>
                  <div className="input-icon-wrapper">
                    <Phone size={16} className="icon-left" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Sports */}
              {role === 'user' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Preferred Sports</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {SPORTS.map((sport) => {
                      const isSelected = preferredSports.includes(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => toggleSportSelection(sport)}
                          className={`badge ${isSelected ? 'badge-cyan' : 'badge-ghost'}`}
                          style={{
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            background: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)'
                          }}
                        >
                          {sport}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? (
              <>
                <Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing...
              </>
            ) : (
              isLoginMode ? 'Sign In' : 'Create Account'
            )}
          </button>

          {/* One-Click Instant Login (Only in Sign In Mode) */}
          {isLoginMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>One-Click Demo Access</span>
                <span style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('arjun@playsphere.in', 'password123')}
                  className="btn btn-ghost"
                  disabled={loading}
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    background: 'rgba(6, 182, 212, 0.03)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(6, 182, 212, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>⚽ Athlete Demo</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Book Courts</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('rahul@playsphere.in', 'password123')}
                  className="btn btn-ghost"
                  disabled={loading}
                  style={{
                    padding: '10px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    background: 'rgba(139, 92, 246, 0.03)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#a78bfa' }}>🏆 Owner Demo</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Manage Arenas</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
