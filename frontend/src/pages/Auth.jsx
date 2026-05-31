import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import {
  Mail, Lock, User, Phone, Sparkles, AlertCircle,
  Loader, CheckCircle, Eye, EyeOff, ArrowRight, Zap, BarChart2, Globe
} from 'lucide-react';

const ROLE_OPTIONS = [
  { id: 'user', title: 'Player', icon: '⚽', color: '#06b6d4', desc: 'Book venues & track games' },
  { id: 'venue_owner', title: 'Venue Owner', icon: '🏆', color: '#8b5cf6', desc: 'Manage facilities & analytics' }
];

const REGISTER_FEATURES = [
  { icon: <Zap size={20} />, title: 'Instant Bookings', desc: 'Reserve courts in seconds with AI assistance' },
  { icon: <BarChart2 size={20} />, title: 'Smart Analytics', desc: 'Track revenue, demand & performance trends' },
  { icon: <Globe size={20} />, title: 'Live Map Search', desc: 'Discover venues near you on an interactive map' },
];

const LOGIN_FEATURES = [
  { icon: <Zap size={20} />, title: 'AI Sports Copilot', desc: '"Book badminton 7 PM near you" — done in seconds' },
  { icon: <Globe size={20} />, title: 'Dynamic Venues', desc: 'Football, cricket, badminton, swimming & more' },
  { icon: <BarChart2 size={20} />, title: 'Real-Time Slots', desc: 'Live availability with instant booking confirmation' },
];

export default function Auth() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sports, setSports] = useState([]);
  const [stats, setStats] = useState({ totalVenues: 0, totalBookings: 0, avgRating: 0 });

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [role, setRole] = useState('user');
  const [preferredSports, setPreferredSports] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch dynamic sports list
  useEffect(() => {
    axios.get('/api/venues/meta').then(res => {
      if (res.data.success) {
        setSports(res.data.data.sports || []);
      }
    }).catch(() => {});

    // Fetch platform stats
    axios.get('/api/analytics/stats').then(res => {
      if (res.data.success) {
        setStats({
          totalVenues: res.data.data.totalVenues || 0,
          totalBookings: res.data.data.totalBookings || 0,
          avgRating: res.data.data.avgRating || 0
        });
      }
    }).catch(() => {});
  }, []);

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!isLogin) {
      if (!form.username || form.username.length < 3) e.username = 'Minimum 3 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Must be 10 digits';
      if (role === 'user' && preferredSports.length === 0) e.sports = 'Select at least one sport';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', { email: form.email, password: form.password });
        if (res.data.success) {
          setSuccess('Login successful! Redirecting...');
          login(res.data.data, res.data.data.token);
          setTimeout(() => {
            const r = res.data.data.role;
            navigate(r === 'admin' ? '/admin' : r === 'venue_owner' ? '/dashboard' : '/explore');
          }, 700);
        }
      } else {
        const res = await axios.post('/api/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password,
          role,
          phone: form.phone || undefined,
          preferredSports: role === 'user' ? preferredSports : undefined,
        });
        if (res.data.success) {
          if (res.data.pendingApproval) {
            setSuccess(res.data.message);
            setTimeout(() => navigate('/login'), 2000);
          } else {
            setSuccess('Account created! Redirecting...');
            login(res.data.data, res.data.data.token);
            setTimeout(() => navigate(role === 'venue_owner' ? '/dashboard' : '/explore'), 700);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (path) => {
    setErrors({});
    setError(null);
    setSuccess(null);
    navigate(path);
  };

return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-wrapper">
        {/* Left panel — both login & register on desktop */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-brand">
              <Sparkles size={28} className="text-gradient" />
              <span className="auth-brand-name">PlaySphere</span>
            </div>

            {isLogin ? (
              <>
                <h1 className="auth-left-title">Welcome Back, Athlete! 🏃</h1>
                <p className="auth-left-sub">
                  Your courts are waiting. Sign in to manage bookings, explore venues, and let the AI copilot handle the rest.
                </p>
                {/* Stats row */}
                <div className="auth-left-stats">
                  <div className="auth-left-stat">
                    <span className="auth-left-stat-value">{stats.totalVenues}+</span>
                    <span className="auth-left-stat-label">Venues</span>
                  </div>
                  <div className="auth-left-stat">
                    <span className="auth-left-stat-value">{stats.totalBookings}+</span>
                    <span className="auth-left-stat-label">Bookings</span>
                  </div>
                  <div className="auth-left-stat">
                    <span className="auth-left-stat-value">{stats.avgRating.toFixed(1)}★</span>
                    <span className="auth-left-stat-label">Avg Rating</span>
                  </div>
                </div>
                <div className="auth-features">
                  {LOGIN_FEATURES.map((f, i) => (
                    <div key={i} className="auth-feature-item">
                      <div className="auth-feature-icon">{f.icon}</div>
                      <div>
                        <div className="auth-feature-title">{f.title}</div>
                        <div className="auth-feature-desc">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="auth-left-badge">🤖 AI-Powered · Zero Friction</div>
              </>
            ) : (
              <>
                <h1 className="auth-left-title">Your Sports Journey Starts Here</h1>
                <p className="auth-left-sub">
                  The AI-powered platform for discovering, booking, and managing sports venues across India.
                </p>
                <div className="auth-features">
                  {REGISTER_FEATURES.map((f, i) => (
                    <div key={i} className="auth-feature-item">
                      <div className="auth-feature-icon">{f.icon}</div>
                      <div>
                        <div className="auth-feature-title">{f.title}</div>
                        <div className="auth-feature-desc">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="auth-left-badge">🏟️ Dynamic Venues</div>
              </>
            )}
          </div>
        </div>

        {/* Right side - Auth Form Card */}
        <div style={{ flex: '1', width: '100%', maxWidth: isLogin ? 'clamp(280px, 95vw, 500px)' : 'clamp(280px, 95vw, 520px)', minWidth: '0' }}>
          <div style={{
            padding: 'clamp(16px, 4vw, 48px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)',
            width: '100%'
          }}>
            
            {/* Header */}
            <div style={{ marginBottom: '28px', textAlign: isLogin ? 'center' : 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)', marginBottom: '12px', justifyContent: isLogin ? 'center' : 'flex-start' }}>
                <Sparkles size={20} className="text-gradient" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', fontWeight: 800, color: '#fff' }}>
                  PlaySphere
                </h2>
              </div>
              <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--text-secondary)' }}>
                {isLogin 
                  ? 'Welcome back! Access your sports journey.'
                  : 'Create your account to get started.'}
              </p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
              <button
                type="button"
                className={`auth-tab ${isLogin ? 'auth-tab-active' : ''}`}
                onClick={() => switchMode('/login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${!isLogin ? 'auth-tab-active' : ''}`}
                onClick={() => switchMode('/register')}
              >
                Create Account
              </button>
            </div>

            <p className="auth-tagline">
              {isLogin ? 'Welcome back! Access your sports journey.' : 'Join thousands of athletes and venue owners.'}
            </p>

            {/* Alerts */}
            {success && (
              <div className="auth-alert auth-alert-success">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="auth-alert auth-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}



            {/* Role selector (register only) */}
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label">I am a</label>
                <div className="auth-roles">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`auth-role-btn ${role === opt.id ? 'auth-role-active' : ''}`}
                      style={{ '--role-color': opt.color }}
                      onClick={() => { setRole(opt.id); setPreferredSports([]); setErrors(e => ({ ...e, sports: null })); }}
                    >
                      <span className="auth-role-icon">{opt.icon}</span>
                      <span className="auth-role-title">{opt.title}</span>
                      <span className="auth-role-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>

              {/* Username */}
              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">Username</label>
                  <div className="auth-input-wrap">
                    <User size={15} className="auth-input-icon" />
                    <input
                      type="text"
                      className={`auth-input ${errors.username ? 'auth-input-error' : ''}`}
                      placeholder="arjun_striker"
                      value={form.username}
                      onChange={e => setField('username', e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && <span className="auth-error-msg">{errors.username}</span>}
                </div>
              )}

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={15} className="auth-input-icon" />
                  <input
                    type="email"
                    className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="auth-error-msg">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input auth-input-pr ${errors.password ? 'auth-input-error' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <span className="auth-error-msg">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={15} className="auth-input-icon" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`auth-input auth-input-pr ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={e => setField('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="auth-error-msg">{errors.confirmPassword}</span>}
                </div>
              )}

              {/* Phone */}
              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">
                    Mobile Number <span className="auth-optional">(Optional)</span>
                  </label>
                  <div className="auth-input-wrap">
                    <Phone size={15} className="auth-input-icon" />
                    <input
                      type="tel"
                      className={`auth-input ${errors.phone ? 'auth-input-error' : ''}`}
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={e => setField('phone', e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <span className="auth-error-msg">{errors.phone}</span>}
                </div>
              )}

              {/* Preferred Sports */}
              {!isLogin && role === 'user' && (
                <div className="auth-field">
                  <label className="auth-label">
                    Preferred Sports <span className="auth-required">*</span>
                  </label>
                  <div className="auth-sports-grid">
                    {sports.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px' }}>
                        Loading sports...
                      </div>
                    ) : (
                      sports.map(sport => (
                        <button
                          key={sport}
                          type="button"
                          className={`auth-sport-btn ${preferredSports.includes(sport) ? 'auth-sport-active' : ''}`}
                          onClick={() => {
                            setPreferredSports(prev =>
                              prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
                            );
                            setErrors(e => ({ ...e, sports: null }));
                          }}
                        >
                          {sport}
                        </button>
                      ))
                    )}
                  </div>
                  {errors.sports && <span className="auth-error-msg">{errors.sports}</span>}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In to PlaySphere' : 'Create My Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="auth-footer-text">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className="auth-link-btn" onClick={() => switchMode(isLogin ? '/register' : '/login')}>
                {isLogin ? 'Sign up free' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
