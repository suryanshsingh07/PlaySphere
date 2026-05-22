import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { X, Calendar, Clock, Users, CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function BookingModal({ venue, onClose, onBookingSuccess }) {
  const { token } = useAuth();
  const [selectedSport, setSelectedSport] = useState(venue.sports[0]?.name || '');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch slots on sport or date change
  useEffect(() => {
    if (!selectedSport || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const res = await axios.get(`/api/venues/${venue._id}/slots`, {
          params: { date: selectedDate, sport: selectedSport }
        });
        if (res.data.success) {
          setSlots(res.data.data.slots);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch available time slots');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [venue._id, selectedSport, selectedDate]);

  // Selected sport configuration
  const sportConfig = venue.sports.find(s => s.name === selectedSport);
  const pricePerHour = sportConfig ? sportConfig.pricePerHour : 0;
  const maxPlayers = sportConfig ? sportConfig.maxPlayers : 10;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        '/api/bookings',
        {
          venueId: venue._id,
          sport: selectedSport,
          court: 1,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          playerCount,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onBookingSuccess) onBookingSuccess(res.data.data);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="modal-overlay flex-center animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 13, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div className="glass-strong animate-slide-up" style={{
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        padding: '24px'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'var(--text-secondary)' }}
          className="btn-ghost flex-center"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="text-center" style={{ padding: '30px 10px' }}>
            <CheckCircle size={60} color="var(--accent-secondary)" style={{ margin: '0 auto 16px auto', display: 'block', animation: 'float 3s infinite' }} />
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Booking Confirmed!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Your court has been successfully reserved. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                Book a Court
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🏟️ {venue.name}</p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Sport & Date Selection */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Sport</label>
                <select 
                  className="form-select"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                >
                  {venue.sports.map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name.charAt(0).toUpperCase() + s.name.slice(1)} (₹{s.pricePerHour}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <div className="input-icon-wrapper">
                  <Calendar size={16} className="icon-left" />
                  <input 
                    type="date" 
                    className="form-input" 
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Slots Grid */}
            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <span>Available Slots</span>
                {loadingSlots && <Loader size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
              </label>

              {loadingSlots ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="skeleton" style={{ height: '38px', borderRadius: 'var(--radius-sm)' }}></div>
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No slots available for this date.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '160px', overflowY: 'auto', padding: '2px' }}>
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`btn btn-sm ${
                        !slot.available 
                          ? 'btn-disabled-slot' 
                          : selectedSlot?.startTime === slot.startTime 
                            ? 'btn-selected-slot' 
                            : 'btn-available-slot'
                      }`}
                      style={{
                        padding: '8px 4px',
                        border: '1px solid',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all var(--transition-fast)',
                        ...(selectedSlot?.startTime === slot.startTime ? {
                          background: 'var(--accent-primary)',
                          borderColor: 'var(--accent-primary)',
                          color: '#fff',
                          boxShadow: 'var(--glow-cyan)'
                        } : !slot.available ? {
                          background: 'rgba(255,255,255,0.02)',
                          borderColor: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-muted)',
                          cursor: 'not-allowed'
                        } : {
                          background: 'rgba(6, 182, 212, 0.05)',
                          borderColor: 'rgba(6, 182, 212, 0.2)',
                          color: 'var(--accent-primary)',
                        })
                      }}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Players & Additional Notes */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Players Count</label>
                <div className="input-icon-wrapper">
                  <Users size={16} className="icon-left" />
                  <input 
                    type="number" 
                    className="form-input" 
                    value={playerCount}
                    min={1}
                    max={maxPlayers}
                    onChange={(e) => setPlayerCount(Math.min(maxPlayers, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Max Allowed</label>
                <input 
                  type="text" 
                  className="form-input" 
                  disabled 
                  value={`${maxPlayers} players`}
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes for Venue Manager (Optional)</label>
              <textarea 
                className="form-input" 
                rows="2" 
                placeholder="E.g. Need rackets, extra hydration..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Total Price and Checkout Action */}
            <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="flex-between">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Court Price (1 Hour)</span>
                <span style={{ fontWeight: 600 }}>₹{pricePerHour}</span>
              </div>
              <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Total Amount</span>
                <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.2rem' }}>₹{pricePerHour}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={bookingLoading || !selectedSlot}
              style={{ width: '100%' }}
            >
              {bookingLoading ? (
                <>
                  <Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard size={18} /> Confirm & Pay
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
