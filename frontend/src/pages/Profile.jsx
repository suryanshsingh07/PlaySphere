import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { User, Phone, Mail, Sparkles, Star, Calendar, Clock, Loader, AlertCircle, CheckCircle, Edit, Save, Activity } from 'lucide-react';

const SPORTS = ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'swimming', 'gym'];

export default function Profile() {
  const { token, user, login } = useAuth();
  
  // Profile state
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [preferredSports, setPreferredSports] = useState(user?.preferredSports || []);
  
  // UI states
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Dynamic stats state
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch role-specific stats
  const fetchStats = async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      if (user.role === 'venue_owner') {
        // Owner analytics
        const res = await axios.get('/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUserStats({
            totalVenues: res.data.data.overview.totalVenues,
            totalRevenue: res.data.data.overview.totalRevenue,
            totalBookings: res.data.data.overview.totalBookings,
            avgRating: res.data.data.overview.avgRating
          });
        }
      } else {
        // Player bookings
        const res = await axios.get('/api/bookings/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUserStats({
            bookings: res.data.data,
            totalBookings: res.data.data.length,
            confirmedBookings: res.data.data.filter(b => b.status === 'confirmed').length
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.role]);

  const toggleSportSelection = (sport) => {
    if (preferredSports.includes(sport)) {
      setPreferredSports(preferredSports.filter(s => s !== sport));
    } else {
      setPreferredSports([...preferredSports, sport]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await axios.put(
        '/api/auth/profile',
        { username, phone, preferredSports },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setSuccess('Profile updated successfully!');
        // Update auth context state and localStorage
        const updatedUser = {
          ...user,
          username: res.data.data.username,
          phone: res.data.data.phone,
          preferredSports: res.data.data.preferredSports
        };
        login(updatedUser, token);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
          My <span className="text-gradient">Profile</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Manage your account credentials, preferences, and platform records
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Main Grid Split */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          
          {/* Profile Card Widget */}
          <div className="glass-strong" style={{ padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Personal Details</h3>
                <span className="badge badge-cyan" style={{ marginTop: '6px', display: 'inline-block', fontSize: '0.7rem' }}>
                  {user?.role === 'admin' ? '🛡️ Administrator' : user?.role === 'venue_owner' ? '🏆 Venue Owner' : '⚽ Athlete Player'}
                </span>
              </div>
              <button 
                onClick={() => { setIsEditMode(!isEditMode); setError(null); setSuccess(null); }}
                className="btn btn-ghost btn-sm flex-center gap-xs"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                {isEditMode ? 'Cancel' : <><Edit size={12} /> Edit Profile</>}
              </button>
            </div>

            {success && (
              <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={14} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.8rem' }}>
                <AlertCircle size={14} style={{ marginRight: '6px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Username field */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username</label>
                <div className="input-icon-wrapper">
                  <User size={16} className="icon-left" />
                  <input
                    type="text"
                    disabled={!isEditMode || loading}
                    className="form-input"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={!isEditMode ? { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' } : {}}
                    required
                  />
                </div>
              </div>

              {/* Email Address (disabled always) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail size={16} className="icon-left" />
                  <input
                    type="email"
                    disabled
                    className="form-input"
                    value={user?.email || ''}
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              {/* Phone Number field */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mobile Number</label>
                <div className="input-icon-wrapper">
                  <Phone size={16} className="icon-left" />
                  <input
                    type="tel"
                    disabled={!isEditMode || loading}
                    placeholder="Provide your contact phone..."
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={!isEditMode ? { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' } : {}}
                  />
                </div>
              </div>

              {/* Preferred Sports Selection (Players Only) */}
              {user?.role === 'user' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Preferred Sports</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {SPORTS.map((sport) => {
                      const isSelected = preferredSports.includes(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          disabled={!isEditMode || loading}
                          onClick={() => toggleSportSelection(sport)}
                          className={`badge ${isSelected ? 'badge-cyan' : 'badge-ghost'}`}
                          style={{
                            padding: '5px 12px',
                            cursor: isEditMode ? 'pointer' : 'default',
                            fontSize: '0.72rem',
                            border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            background: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            opacity: !isEditMode && !isSelected ? 0.35 : 1
                          }}
                        >
                          {sport}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Save Button */}
              {isEditMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  {loading ? 'Saving...' : <><Save size={14} style={{ marginRight: '6px' }} /> Save Changes</>}
                </button>
              )}

            </form>
          </div>

          {/* Role-Specific Stats Panel */}
          <div className="glass" style={{ padding: '30px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} className="text-gradient" /> Account Insights
            </h3>

            {loadingStats ? (
              <div style={{ margin: 'auto', padding: '40px 0', textAlign: 'center' }}>
                <div className="uiverse-loader">
                  <svg viewBox="0 0 120 120" width="40" height="40">
                    <circle className="spin" cx="60" cy="60" r="57" fill="none" 
                      stroke="var(--accent-primary)" strokeWidth="12" strokeLinecap="round" />
                  </svg>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>Loading insights...</p>
              </div>
            ) : user?.role === 'venue_owner' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexGrow: 1 }}>
                {[
                  { label: 'Arenas Managed', value: userStats?.totalVenues || 0, color: '#06b6d4' },
                  { label: 'Total Revenue', value: `₹${userStats?.totalRevenue || 0}`, color: '#10b981' },
                  { label: 'Bookings Count', value: userStats?.totalBookings || 0, color: '#8b5cf6' },
                  { label: 'Average Rating', value: userStats?.avgRating ? `⭐ ${userStats.avgRating}/5` : 'N/A', color: '#f59e0b' }
                ].map((stat, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{stat.label}</span>
                    <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color, marginTop: '8px' }}>{stat.value}</h4>
                  </div>
                ))}
              </div>
            ) : user?.role === 'user' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexGrow: 1 }}>
                {[
                  { label: 'Total Reservations', value: userStats?.totalBookings || 0, color: '#06b6d4' },
                  { label: 'Confirmed Bookings', value: userStats?.confirmedBookings || 0, color: '#10b981' },
                  { label: 'Preferred Sport', value: user?.preferredSports?.[0] ? user.preferredSports[0].toUpperCase() : 'NONE', color: '#8b5cf6' },
                  { label: 'Account Tier', value: 'AMATEUR', color: '#f59e0b' }
                ].map((stat, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{stat.label}</span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color, marginTop: '8px' }}>{stat.value}</h4>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Admin users manage platform-wide statistics from the Admin Panel.
              </div>
            )}
          </div>

        </div>

        {/* Player Bookings History List (Only show for users/players) */}
        {user?.role === 'user' && userStats?.bookings && (
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} /> Booking History Details
            </h3>

            {userStats.bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0', textAlign: 'center' }}>
                You haven't reserved any court slots yet. Go to Explore Map to book!
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Venue', 'Sport', 'Date', 'Time Slot', 'Paid Price', 'Status', 'Ticket Reference'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.bookings.map((booking) => {
                      const bDate = new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)', fontSize: '0.825rem' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#fff' }}>{booking.venue?.name || '—'}</td>
                          <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{booking.sport}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{bDate}</td>
                          <td style={{ padding: '12px' }}><Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle', color: 'var(--accent-primary)' }} /> {booking.startTime} — {booking.endTime}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#fff' }}>₹{booking.totalPrice}</td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge ${booking.status === 'confirmed' ? 'badge-emerald' : booking.status === 'completed' ? 'badge-cyan' : booking.status === 'cancelled' ? 'badge-red' : 'badge-ghost'}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-accent)' }}>
                            {booking.ticketNumber || 'PENDING'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
}
