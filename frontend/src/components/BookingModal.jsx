import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { X, Calendar, Clock, Users, CreditCard, CheckCircle, AlertCircle, Loader, Shield, Smartphone, Wallet, Banknote, QrCode } from 'lucide-react';

export default function BookingModal({ venue, onClose, onBookingSuccess }) {
  const { token } = useAuth();
  const [step, setStep] = useState('select'); // select | pay | success
  
  // Selection state
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
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card'); // card | upi | wallet | cash
  
  // Card payment state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocused, setCardFocused] = useState(false);
  
  // UPI state
  const [upiId, setUpiId] = useState('');
  
  // Wallet state
  const [walletProvider, setWalletProvider] = useState('paytm');
  
  // Booking API states
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

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

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    setError(null);
    setStep('pay');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleExpiryChange = (e) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Validate based on payment method
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
        setError('Please fill in all card details.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        setError('Please enter a valid UPI ID (e.g., user@paytm)');
        return;
      }
    }

    setBookingLoading(true);
    setError(null);

    try {
      // 1. Create the booking document (pending payment status)
      const createRes = await axios.post(
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

      if (createRes.data.success) {
        const bookingId = createRes.data.data._id;

        // 2. Call pay endpoint to mock process payment
        const payRes = await axios.put(
          `/api/bookings/${bookingId}/pay`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (payRes.data.success) {
          setCreatedBooking(payRes.data.data);
          setStep('success');
          if (onBookingSuccess) onBookingSuccess(payRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Payment processing failed. Please check details.');
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
        maxWidth: step === 'success' ? '430px' : '550px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        padding: '24px',
        transition: 'all 0.3s ease'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          className="btn-ghost flex-center"
        >
          <X size={20} />
        </button>

        {/* STEP 1: Select Sport & Time Slot */}
        {step === 'select' && (
          <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      style={{
                        padding: '8px 4px',
                        border: '1px solid',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: slot.available ? 'pointer' : 'not-allowed',
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
              disabled={!selectedSlot}
              style={{ width: '100%' }}
            >
              Continue to Payment
            </button>
          </form>
        )}

        {/* STEP 2: Payment Method Selection */}
        {step === 'pay' && (
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                Secure Checkout
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}> Pay ₹{pricePerHour} to reserve slot </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="form-label" style={{ marginBottom: '12px' }}>Select Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'card' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === 'card' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: paymentMethod === 'card' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                  }}
                >
                  <CreditCard size={20} className={paymentMethod === 'card' ? 'text-gradient' : ''} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'upi' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === 'upi' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: paymentMethod === 'upi' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                  }}
                >
                  <Smartphone size={20} className={paymentMethod === 'upi' ? 'text-gradient' : ''} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'wallet' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === 'wallet' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: paymentMethod === 'wallet' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                  }}
                >
                  <Wallet size={20} className={paymentMethod === 'wallet' ? 'text-gradient' : ''} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'cash' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: paymentMethod === 'cash' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: paymentMethod === 'cash' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                  }}
                >
                  <Banknote size={20} className={paymentMethod === 'cash' ? 'text-gradient' : ''} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cash at Venue</span>
                </button>
              </div>
            </div>

            {/* CARD PAYMENT UI */}
            {paymentMethod === 'card' && (
              <>
                {/* Credit Card Interactive Flip-Mockup */}
                <div style={{ perspective: '1000px', width: '320px', height: '190px', margin: '0 auto 10px auto' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s ease',
                transform: cardFocused ? 'rotateY(180deg)' : 'rotateY(0deg)',
                borderRadius: '16px'
              }}>
                {/* Card Front */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(139, 92, 246, 0.25))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#fff',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--accent-primary)' }}>PLAYSPHERE SECURE</span>
                    <Shield size={20} className="text-gradient" />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '4px' }} />
                    <div style={{ width: '20px', height: '16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px' }} />
                  </div>

                  <div style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Card Holder</div>
                      <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#fff' }}>{cardHolder || 'FULL NAME'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expires</div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* Card Back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(6, 182, 212, 0.25))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#fff',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ width: '100%', height: '36px', background: '#090d16', marginTop: '10px' }} />
                  
                  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', paddingRight: '5px' }}>CVV</div>
                    <div style={{ display: 'flex', height: '30px', alignItems: 'center' }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.7)', color: '#000', fontSize: '0.75rem', paddingLeft: '10px', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                        Authorized Signature
                      </div>
                      <div style={{ width: '45px', background: '#fff', color: '#000', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cardCvv || '•••'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', padding: '0 20px', textAlign: 'center' }}>
                    Sandboxed processing. No real charges will apply.
                  </div>
                </div>
              </div>
            </div>

                {/* Card Input fields */}
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    maxLength="19"
                    className="form-input"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="form-input"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength="5"
                      className="form-input"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength="3"
                      className="form-input"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                      onFocus={() => setCardFocused(true)}
                      onBlur={() => setCardFocused(false)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* UPI PAYMENT UI */}
            {paymentMethod === 'upi' && (
              <>
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <QrCode size={120} className="text-gradient" style={{ margin: '0 auto 16px auto' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Scan QR Code</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Use any UPI app to scan and pay ₹{pricePerHour}</p>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=playsphere@paytm&pn=PlaySphere&am=${pricePerHour}&cu=INR`}
                      alt="UPI QR Code"
                      style={{ width: '150px', height: '150px', display: 'block' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>UPI ID: playsphere@paytm</p>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>OR</div>

                <div className="form-group">
                  <label className="form-label">Enter Your UPI ID</label>
                  <div className="input-icon-wrapper">
                    <Smartphone size={16} className="icon-left" />
                    <input
                      type="text"
                      placeholder="yourname@paytm"
                      className="form-input"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>We'll send a payment request to your UPI ID</p>
                </div>
              </>
            )}

            {/* WALLET PAYMENT UI */}
            {paymentMethod === 'wallet' && (
              <>
                <div className="form-group">
                  <label className="form-label">Select Wallet Provider</label>
                  <select 
                    className="form-select"
                    value={walletProvider}
                    onChange={(e) => setWalletProvider(e.target.value)}
                  >
                    <option value="paytm">Paytm Wallet</option>
                    <option value="phonepe">PhonePe Wallet</option>
                    <option value="googlepay">Google Pay</option>
                    <option value="amazonpay">Amazon Pay</option>
                    <option value="mobikwik">Mobikwik</option>
                  </select>
                </div>

                <div style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Wallet size={24} className="text-gradient" />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{walletProvider.charAt(0).toUpperCase() + walletProvider.slice(1)} Payment</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>You'll be redirected to complete payment</p>
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Amount to Pay</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{pricePerHour}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Wallet Cashback</span>
                      <span style={{ color: '#10b981' }}>₹{Math.floor(pricePerHour * 0.05)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CASH AT VENUE UI */}
            {paymentMethod === 'cash' && (
              <div style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <Banknote size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Pay at Venue</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Your slot will be reserved. Please pay ₹{pricePerHour} in cash when you arrive at the venue.
                    </p>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>⚠️ Important Instructions:</div>
                  <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '20px', margin: 0, lineHeight: '1.6' }}>
                    <li>Arrive 10 minutes before your slot time</li>
                    <li>Carry exact change if possible</li>
                    <li>Show your booking QR code at reception</li>
                    <li>Cancellation allowed up to 2 hours before slot</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>No advance payment required</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setStep('select')}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={bookingLoading}
                style={{ flex: 2 }}
              >
                {bookingLoading ? (
                  <>
                    <Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                  </>
                ) : paymentMethod === 'cash' ? (
                  <>
                    Confirm Booking (Pay at Venue)
                  </>
                ) : (
                  <>
                    Pay ₹{pricePerHour}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Booking Ticket Confirmation */}
        {step === 'success' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="text-center">
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 8px auto', display: 'block', filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} />
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Booking Request Submitted!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Your booking request has been sent to the venue owner.</p>
            </div>

            {/* Approval Notice */}
            <div style={{ 
              padding: '16px', 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <Clock size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>
                  ⏳ Awaiting Venue Approval
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  The venue owner will review and approve your booking request within 2-4 hours. You'll receive a confirmation notification once approved.
                </p>
              </div>
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
                🏟️ PLAYSPHERE BOOKING RECEIPT
              </div>

              {/* Ticket Details */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Venue</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '2px 0 0 0' }}>{venue.name}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>{venue.address}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Sport</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{selectedSport}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Court ID</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Court #1</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                      {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Time Slot</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{selectedSlot?.startTime} — {selectedSlot?.endTime}</div>
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
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Booking Status</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>⏳ Pending Approval</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Paid</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{pricePerHour}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                  {/* QR Code */}
                  <div style={{ background: '#fff', padding: '6px', borderRadius: '6px' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${createdBooking?.ticketNumber || 'PLAYSPHERE'}`} 
                      alt="Booking QR Code" 
                      style={{ width: '90px', height: '90px', display: 'block' }}
                    />
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Booking Reference ID</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                      {createdBooking?.ticketNumber}
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                      Save this reference ID. You'll receive your entry pass QR code once the venue approves your booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { onClose(); window.location.href = '/explore'; }}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '5px' }}
            >
              Back to Explore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
