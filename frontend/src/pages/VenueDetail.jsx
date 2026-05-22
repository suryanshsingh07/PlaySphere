import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { Star, MapPin, Calendar, Clock, Phone, Mail, Award, Check, MessageSquare, Plus, AlertCircle, Loader } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import MapView from '../components/MapView';

// Fallback images representing sport activities
const SPORT_IMAGES = {
  football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415080290-bc9b8998063a?auto=format&fit=crop&w=800&q=80',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  swimming: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&w=800&q=80',
  gym: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
};

const AMENITY_LABELS = {
  parking: '🚗 Free Parking',
  'changing-rooms': '👕 Changing Rooms',
  showers: '🚿 Hot Showers',
  cafeteria: '☕ Cafeteria',
  'first-aid': '🏥 First Aid Kit',
  wifi: '📶 High-Speed WiFi',
  floodlights: '💡 Night Floodlights',
  coaching: '🎓 Personal Coaching',
  'equipment-rental': '🏸 Equipment Rental',
  'drinking-water': '💧 Purified Water',
  'seating-area': '🛋️ Seating Lounge',
  ac: '❄️ Air Conditioned',
};

export default function VenueDetail() {
  const { id } = useParams();
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Booking states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  const fetchVenueDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/venues/${id}`);
      if (res.data.success) {
        setVenue(res.data.data);
        setReviews(res.data.data.reviews || []);
        if (res.data.data.sports && res.data.data.sports.length > 0) {
          setActiveTab(res.data.data.sports[0].name);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load venue details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenueDetails();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await axios.post(
        `/api/venues/${id}/reviews`,
        { rating: reviewRating, comment: reviewComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setReviews(prev => [res.data.data, ...prev]);
        setReviewComment('');
        setReviewRating(5);
        // Refresh detail to update overall rating
        const refreshedRes = await axios.get(`/api/venues/${id}`);
        if (refreshedRes.data.success) {
          setVenue(prev => ({
            ...prev,
            rating: refreshedRes.data.data.rating,
            totalReviews: refreshedRes.data.data.totalReviews
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} className="spin text-gradient" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Gathering venue coordinates and booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div className="empty-state glass" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={48} color="var(--accent-danger)" />
          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginTop: '12px' }}>Venue Unavailable</h3>
          <p style={{ maxWidth: '400px', marginTop: '8px' }}>{error || 'The requested venue was not found.'}</p>
          <Link to="/explore" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const activeSport = venue.sports.find(s => s.name === activeTab);
  const heroImage = venue.images && venue.images.length > 0 && venue.images[0]
    ? venue.images[0]
    : (SPORT_IMAGES[venue.sports[0]?.name] || SPORT_IMAGES.football);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* Back link */}
      <Link to="/explore" style={{ display: 'inline-block', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
        ← Back to Explore
      </Link>

      {/* Venue Header / Cover Banner */}
      <div className="glass-strong" style={{
        position: 'relative',
        height: '280px',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        marginBottom: '32px',
        border: '1px solid var(--glass-border)'
      }}>
        <img 
          src={heroImage} 
          alt={venue.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(10, 14, 26, 0.95), rgba(10, 14, 26, 0.4))'
        }} />

        {/* Header Details */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              {venue.name}
            </h1>
            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div className="flex-center" style={{ gap: '6px' }}>
                <div className="stars flex-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i <= Math.floor(venue.rating) ? 'star-filled' : 'star-empty'} 
                      fill="currentColor" 
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{venue.rating} ({venue.totalReviews} reviews)</span>
              </div>

              <div className="flex-center" style={{ gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <MapPin size={14} className="text-gradient" />
                <span>{venue.address}</span>
              </div>
            </div>
          </div>

          <div>
            {isAuthenticated ? (
              <button 
                onClick={() => setBookingModalOpen(true)} 
                className="btn btn-primary btn-lg"
                style={{ boxShadow: 'var(--glow-cyan)' }}
              >
                Book Court Now
              </button>
            ) : (
              <Link to="/auth" className="btn btn-primary btn-lg">
                Log In to Book
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="venue-detail-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Left Column: Details, description, tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Description */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>
              About Venue
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {venue.description || 'No description provided. This facility is fully equipped and well-maintained for active play.'}
            </p>
          </div>

          {/* Sport Tabs */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
              Sports & Pricing
            </h3>
            
            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', overflowX: 'auto' }}>
              {venue.sports.map((sport) => (
                <button
                  key={sport.name}
                  onClick={() => setActiveTab(sport.name)}
                  className={`btn btn-sm ${activeTab === sport.name ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {sport.name.charAt(0).toUpperCase() + sport.name.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeSport && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                  <div className="glass" style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price per hour</span>
                    <h4 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>₹{activeSport.pricePerHour}</h4>
                  </div>
                  <div className="glass" style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Courts</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: '#fff' }}>{activeSport.courts}</h4>
                  </div>
                  <div className="glass" style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Players / Slot</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: '#fff' }}>{activeSport.maxPlayers}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amenities & Facility Rules */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
              Amenities Available
            </h3>
            {venue.amenities && venue.amenities.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {venue.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <Check size={16} className="text-gradient" />
                    <span>{AMENITY_LABELS[amenity] || amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No amenities listed.</p>
            )}
          </div>

          {/* Reviews List */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className="flex-center gap-sm" style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
              <MessageSquare size={18} className="text-gradient" /> Customer Reviews
            </h3>

            {/* Review form (for authenticated users who are not the owner) */}
            {isAuthenticated && venue.owner?._id !== user?._id && (
              <form onSubmit={handleReviewSubmit} className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Write a Review</h4>
                {reviewError && (
                  <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                    <AlertCircle size={14} />
                    <span>{reviewError}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rating:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReviewRating(num)}
                        style={{ background: 'transparent', color: num <= reviewRating ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}
                      >
                        <Star size={16} fill={num <= reviewRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Share your experience playing here..."
                    className="form-input"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    required
                  />
                  <button type="submit" disabled={submittingReview} className="btn btn-primary btn-sm">
                    {submittingReview ? 'Sending...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px 0' }}>
                No reviews yet. Be the first to play and write a review!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((rev) => (
                  <div key={rev._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>@{rev.user?.username || 'user'}</span>
                      <div className="flex-center" style={{ gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star 
                            key={i} 
                            size={10} 
                            className={i <= rev.rating ? 'star-filled' : 'star-empty'} 
                            fill="currentColor" 
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact info, operating hours, micro-map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Operating hours & contact card */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Facility Schedule
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span className="flex-center" style={{ gap: '6px' }}><Clock size={14} /> Open Hours</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>
                  {venue.operatingHours?.open || '06:00'} — {venue.operatingHours?.close || '23:00'}
                </span>
              </div>
              
              <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <span className="flex-center" style={{ gap: '6px' }}><Phone size={14} /> Contact Phone</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>
                  {venue.contactPhone || 'N/A'}
                </span>
              </div>

              <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <span className="flex-center" style={{ gap: '6px' }}><Mail size={14} /> Email Address</span>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.8rem' }}>
                  {venue.contactEmail || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Micro Map */}
          <div>
            <h3 className="flex-center gap-sm" style={{ justifyContent: 'flex-start', fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
              <MapPin size={16} className="text-gradient" /> Map Location
            </h3>
            <MapView
              venues={[venue]}
              selectedVenueId={venue._id}
              height="260px"
            />
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <BookingModal
          venue={venue}
          onClose={() => setBookingModalOpen(false)}
          onBookingSuccess={() => {
            fetchVenueDetails();
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .venue-detail-layout {
            grid-template-columns: 1.3fr 0.7fr !important;
          }
        }
      `}} />
    </div>
  );
}
