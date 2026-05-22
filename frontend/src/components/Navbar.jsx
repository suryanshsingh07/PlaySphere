import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Menu, X, Compass, Calendar, BarChart3, LogOut, User, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar-header glass-strong" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '72px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div className="container flex-between" style={{ width: '100%' }}>
        {/* Logo */}
        <Link to="/" className="flex-center gap-sm" style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: '#fff' }}>
          <div className="logo-icon flex-center" style={{
            width: '36px',
            height: '36px',
            background: 'var(--gradient-primary)',
            borderRadius: '10px',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          Play<span className="text-gradient">Sphere</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="desktop-nav flex-center gap-lg" style={{ display: 'none' }}>
          <NavLink to="/explore" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={({ isActive }) => ({
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: 500,
            transition: 'color var(--transition-fast)'
          })}>
            <Compass size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Explore
          </NavLink>
          
          {isAuthenticated && (
            <>
              <NavLink to="/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={({ isActive }) => ({
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: 500,
                transition: 'color var(--transition-fast)'
              })}>
                <Calendar size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Bookings
              </NavLink>

              {(user?.role === 'venue_owner' || user?.role === 'admin') && (
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={({ isActive }) => ({
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 500,
                  transition: 'color var(--transition-fast)'
                })}>
                  <BarChart3 size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Dashboard
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* Desktop Auth Section */}
        <div className="desktop-auth flex-center gap-md" style={{ display: 'none' }}>
          {isAuthenticated ? (
            <div className="flex-center gap-md">
              <div className="user-profile flex-center gap-sm glass" style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                <User size={16} className="text-gradient" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.username}</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-btn flex-center glass"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            background: 'rgba(255,255,255,0.05)'
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer glass-strong animate-fade-in" style={{
          position: 'fixed',
          top: '72px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: '20px'
        }}>
          <NavLink to="/explore" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link" style={{ fontSize: '1.2rem', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Compass size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Explore Map
          </NavLink>
          
          {isAuthenticated && (
            <>
              <NavLink to="/bookings" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link" style={{ fontSize: '1.2rem', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Calendar size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> My Bookings
              </NavLink>

              {(user?.role === 'venue_owner' || user?.role === 'admin') && (
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link" style={{ fontSize: '1.2rem', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <BarChart3 size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Owner Dashboard
                </NavLink>
              )}
            </>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isAuthenticated ? (
              <>
                <div className="user-profile flex-center gap-sm glass" style={{ padding: '12px', borderRadius: 'var(--radius-md)', justifyContent: 'center' }}>
                  <User size={18} className="text-gradient" />
                  <span style={{ fontWeight: 600 }}>{user.username}</span>
                  <span className="badge badge-cyan">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Media Queries Styling Inline Alternative or Global CSS Addition */}
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
