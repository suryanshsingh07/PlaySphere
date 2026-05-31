import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Menu, X, Compass, Calendar, BarChart3, LogOut, User, Sparkles, ChevronDown, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleColor = user?.role === 'admin' ? '#ef4444' : user?.role === 'venue_owner' ? '#f59e0b' : '#06b6d4';
  const roleLabel = user?.role === 'admin' ? '🛡️ Admin' : user?.role === 'venue_owner' ? '🏆 Owner' : '⚽ Player';
  const avatarInitial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <header className="navbar-header glass-strong" style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '72px',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div className="container flex-between" style={{ width: '100%' }}>
        {/* Logo */}
        <Link to="/" className="flex-center gap-sm" style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontFamily: 'var(--font-display)', color: '#fff' }}>
          <div className="logo-icon flex-center" style={{
            width: 'clamp(28px, 6vw, 36px)', height: 'clamp(28px, 6vw, 36px)',
            minWidth: '28px', minHeight: '28px',
            background: 'var(--gradient-primary)', borderRadius: '10px', boxShadow: 'var(--glow-cyan)'
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          Play<span className="text-gradient">Sphere</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav flex-center gap-lg" style={{ display: 'none' }}>
          <NavLink to="/explore" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500, transition: 'color var(--transition-fast)' })}>
            <Compass size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Explore
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500, transition: 'color var(--transition-fast)' })}>
                <Calendar size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Bookings
              </NavLink>
              {user?.role === 'venue_owner' && (
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500, transition: 'color var(--transition-fast)' })}>
                  <BarChart3 size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Dashboard
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500, transition: 'color var(--transition-fast)' })}>
                  <BarChart3 size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Admin Panel
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="desktop-auth flex-center gap-md" style={{ display: 'none' }}>
          {isAuthenticated ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              {/* Clickable Avatar Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex-center gap-sm glass"
                style={{
                  padding: '6px 12px 6px 6px', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${roleColor}33`, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = roleColor + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = roleColor + '33'}
              >
                {/* Avatar circle */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0,
                  boxShadow: `0 0 10px ${roleColor}44`
                }}>
                  {avatarInitial}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{user.username}</div>
                  <div style={{ fontSize: '0.68rem', color: roleColor, fontWeight: 600 }}>{roleLabel}</div>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="glass-strong animate-fade-in" style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: '200px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden', zIndex: 100
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Signed in as</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{user.email}</div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                      className="flex-center gap-sm"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, justifyContent: 'flex-start', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <User size={15} /> My Profile
                    </button>
                    <button onClick={() => { navigate('/bookings'); setDropdownOpen(false); }}
                      className="flex-center gap-sm"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, justifyContent: 'flex-start', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Calendar size={15} /> My Bookings
                    </button>
                    {user?.role === 'venue_owner' && (
                      <button onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                        className="flex-center gap-sm"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, justifyContent: 'flex-start', transition: 'all 0.15s', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <BarChart3 size={15} /> Dashboard
                      </button>
                    )}
                  </div>
                  <div style={{ padding: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={handleLogout}
                      className="flex-center gap-sm"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, justifyContent: 'flex-start', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-center gap-sm">
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ fontWeight: 600, padding: '8px 16px', background: 'var(--gradient-primary)', boxShadow: 'var(--glow-cyan)' }}>Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className="mobile-menu-btn flex-center glass" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ width: 'clamp(40px, 8vw, 48px)', height: 'clamp(40px, 8vw, 48px)', minWidth: '40px', minHeight: '40px', borderRadius: '10px', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)' }}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer glass-strong animate-fade-in" style={{
          position: 'fixed', top: '72px', left: 0, right: 0, bottom: 0, zIndex: 999,
          display: 'flex', flexDirection: 'column', padding: 'clamp(16px, 4vw, 24px)',
          gap: 'clamp(14px, 3vw, 20px)', overflowY: 'auto'
        }}>
          <NavLink to="/explore" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link"
            style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', padding: 'clamp(8px, 2vh, 10px) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Compass size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Explore Map
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/bookings" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link"
                style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', padding: 'clamp(8px, 2vh, 10px) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Calendar size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> My Bookings
              </NavLink>
              <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link"
                style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', padding: 'clamp(8px, 2vh, 10px) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <User size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> My Profile
              </NavLink>
              {user?.role === 'venue_owner' && (
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link"
                  style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', padding: 'clamp(8px, 2vh, 10px) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <BarChart3 size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Owner Dashboard
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link"
                  style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', padding: 'clamp(8px, 2vh, 10px) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <BarChart3 size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Admin Panel
                </NavLink>
              )}
            </>
          )}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isAuthenticated ? (
              <>
                <div className="glass flex-center gap-sm" style={{ padding: '12px', borderRadius: 'var(--radius-md)', justifyContent: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>{avatarInitial}</div>
                  <span style={{ fontWeight: 600 }}>{user.username}</span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost" style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}>Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: 'var(--gradient-primary)' }}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-auth { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}} />
    </header>
  );
}
