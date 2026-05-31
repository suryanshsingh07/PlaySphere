import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { Calendar, Clock, MapPin, Activity, HelpCircle, XCircle, AlertCircle, Loader, Ticket, Sparkles, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Bookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | past
  const [selectedBooking, setSelectedBooking] = useState(null);

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
          <div className="uiverse-loader">
            <svg viewBox="0 0 120 120" width="48" height="48">
              <circle className="dash" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-primary)" strokeWidth="10" strokeLinecap="round" />
              <circle className="spin" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-secondary)" strokeWidth="10" strokeLinecap="round" />
            </svg>
          </div>
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
                onClick={() => setSelectedBooking(booking)}
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
                    
                    {booking.ticketNumber && (
                      <span className="badge badge-cyan" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        🎫 {booking.ticketNumber}
                      </span>
                    )}

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

                  {/* Cancel Button - Only for pending bookings for users, all bookings for owners */}
                  {(booking.status === 'pending' || (booking.status === 'confirmed' && activeTab === 'upcoming')) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking._id); }}
                      className="btn btn-danger btn-sm"
                      title={booking.status === 'confirmed' ? 'Only venue owner can cancel confirmed bookings' : 'Cancel this booking'}
                      disabled={booking.status === 'confirmed'}
                      style={{
                        opacity: booking.status === 'confirmed' ? 0.5 : 1,
                        cursor: booking.status === 'confirmed' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <XCircle size={14} /> {booking.status === 'pending' ? 'Cancel Request' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Pass Receipt Modal popup */}
      {selectedBooking && (
        <div className="modal-overlay flex-center animate-fade-in" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 7, 13, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="glass-strong animate-slide-up" style={{
            width: '100%',
            maxWidth: '430px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative',
            padding: '24px'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedBooking(null)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              className="btn-ghost flex-center"
            >
              <X size={20} />
            </button>

            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="text-center">
                <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 8px auto', display: 'block', filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} />
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Active Entry Pass</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Verify this pass at the sports center arena reception desk.</p>
              </div>

              {/* Ticket Styled UI */}
              <div style={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
                {/* Ticket Top bar */}
                <div style={{
                  background: 'var(--gradient-primary)',
                  padding: '12px',
                  textAlign: 'center',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}>
                  🏟️ PLAYSPHERE ENTRY PASS
                </div>

                {/* Ticket Details */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Venue</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '2px 0 0 0' }}>{selectedBooking.venue?.name}</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>{selectedBooking.venue?.address}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Sport</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{selectedBooking.sport}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Court ID</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Court #{selectedBooking.court}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        {new Date(selectedBooking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Time Slot</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{selectedBooking.startTime} — {selectedBooking.endTime}</div>
                    </div>
                  </div>

                  {/* Ticket Dotted Separator with Edge Cutouts */}
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', margin: '8px 0', position: 'relative' }}>
                    {/* Left Side cutout */}
                    <div style={{
                      position: 'absolute',
                      left: '-29px',
                      top: '-9px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#090b11',
                      borderRight: '1px solid rgba(255,255,255,0.08)'
                    }} />
                    {/* Right Side cutout */}
                    <div style={{
                      position: 'absolute',
                      right: '-29px',
                      top: '-9px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#090b11',
                      borderLeft: '1px solid rgba(255,255,255,0.08)'
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Players</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{selectedBooking.playerCount} Person(s)</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Paid</span>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{selectedBooking.totalPrice}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                    {/* QR Code */}
                    <div style={{ background: '#fff', padding: '6px', borderRadius: '6px' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${selectedBooking.ticketNumber || 'PLAYSPHERE'}`} 
                        alt="Ticket QR Code" 
                        style={{ width: '90px', height: '90px', display: 'block' }}
                      />
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ticket ID Reference</span>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                        {selectedBooking.ticketNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedBooking(null)}
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '5px' }}
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
