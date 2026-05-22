import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { Calendar, Clock, MapPin, Activity, HelpCircle, XCircle, AlertCircle, Loader, Ticket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Bookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | past

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve bookings list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will refund your slot.')) return;

    try {
      const res = await axios.put(
        `/api/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Update state locally
        setBookings(prev =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled', paymentStatus: 'refunded' } : b))
        );
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed': return 'badge-emerald';
      case 'completed': return 'badge-cyan';
      case 'cancelled': return 'badge-red';
      default: return 'badge-amber';
    }
  };

  // Filter bookings based on activeTab
  const filteredBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isUpcoming = bookingDate >= today && b.status !== 'cancelled';
    
    if (activeTab === 'upcoming') {
      return isUpcoming;
    } else {
      // past or cancelled
      return !isUpcoming || b.status === 'cancelled';
    }
  });

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
          My <span className="text-gradient">Bookings</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Verify upcoming game slots, tickets, or review your play history.
        </p>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          className="btn btn-ghost"
          style={{
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            border: 'none',
            borderBottom: activeTab === 'upcoming' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'upcoming' ? '#fff' : 'var(--text-secondary)',
            background: 'transparent',
            fontWeight: 600,
            padding: '12px 20px'
          }}
        >
          Upcoming Games
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className="btn btn-ghost"
          style={{
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            border: 'none',
            borderBottom: activeTab === 'past' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'past' ? '#fff' : 'var(--text-secondary)',
            background: 'transparent',
            fontWeight: 600,
            padding: '12px 20px'
          }}
        >
          Past / Cancelled
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Loader size={32} className="spin text-gradient" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto' }} />
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state glass">
          <Ticket size={48} />
          <h4 style={{ color: '#fff', fontSize: '1.1rem', marginTop: '12px' }}>No Bookings</h4>
          <p style={{ maxWidth: '400px', marginTop: '8px' }}>
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming court slots reserved." 
              : "No booking history found."}
          </p>
          {activeTab === 'upcoming' && (
            <Link to="/explore" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              Explore Venues
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredBookings.map((booking) => {
            const bookingDateStr = new Date(booking.date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div 
                key={booking._id} 
                className="glass animate-fade-in" 
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(6, 182, 212, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Details Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '240px' }}>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                    <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                    
                    {booking.isAgentBooked && (
                      <span className="badge badge-violet flex-center gap-sm" style={{ boxShadow: 'var(--glow-violet)' }}>
                        <Sparkles size={10} /> AI Booked
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    🏟️ {booking.venue?.name}
                  </h3>

                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span className="flex-center gap-sm">
                      <Calendar size={14} className="text-gradient" /> {bookingDateStr}
                    </span>
                    <span className="flex-center gap-sm">
                      <Clock size={14} className="text-gradient" /> {booking.startTime} — {booking.endTime}
                    </span>
                    <span className="flex-center gap-sm">
                      <Activity size={14} className="text-gradient" /> {booking.sport} (Court {booking.court})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    📍 {booking.venue?.address}
                  </p>
                </div>

                {/* Status/Price Actions Block */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-end', 
                  gap: '12px',
                  marginLeft: 'auto'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment: {booking.paymentStatus}</span>
                    <div className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                      ₹{booking.totalPrice}
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="btn btn-danger btn-sm"
                    >
                      <XCircle size={14} /> Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
