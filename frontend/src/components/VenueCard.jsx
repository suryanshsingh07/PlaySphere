import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Activity, ShieldCheck } from 'lucide-react';

const SPORT_COLORS = {
  football: 'badge-emerald',
  cricket: 'badge-amber',
  badminton: 'badge-cyan',
  tennis: 'badge-violet',
  basketball: 'badge-pink',
  swimming: 'badge-cyan',
  'table-tennis': 'badge-violet',
  volleyball: 'badge-amber',
  squash: 'badge-pink',
  gym: 'badge-cyan',
};

// Fallback images representing sport activities
const SPORT_IMAGES = {
  football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415080290-bc9b8998063a?auto=format&fit=crop&w=500&q=80',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=500&q=80',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=500&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80',
  swimming: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&w=500&q=80',
  gym: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=500&q=80',
};

export default function VenueCard({ venue, highlight = false }) {
  const { _id, name, area, rating, totalReviews, sports, images, amenities } = venue;

  // Get lowest price
  const prices = sports.map((s) => s.pricePerHour);
  const minPrice = Math.min(...prices);

  // Select image
  const imageSrc = images && images.length > 0 && images[0]
    ? images[0]
    : (SPORT_IMAGES[sports[0]?.name] || 'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=500&q=80');

  // Render rating stars
  const renderStars = (ratingVal) => {
    const stars = [];
    const floor = Math.floor(ratingVal);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} size={14} className="star-filled" fill="currentColor" />);
      } else {
        stars.push(<Star key={i} size={14} className="star-empty" />);
      }
    }
    return stars;
  };

  return (
    <div 
      className={`glass venue-card-wrapper ${highlight ? 'highlight-border' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
        border: highlight ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
        boxShadow: highlight ? 'var(--glow-cyan)' : 'var(--shadow-md)',
      }}
    >
      {/* Card Header Image */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', minHeight: '140px' }}>
        <img 
          src={imageSrc} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
          className="card-image"
        />
        {/* Price Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(8px, 2vw, 12px)',
          right: 'clamp(8px, 2vw, 12px)',
          background: 'rgba(10, 14, 26, 0.85)',
          padding: 'clamp(3px, 1vw, 6px) clamp(8px, 2vw, 12px)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)',
          fontWeight: 700,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          From <span className="text-gradient">₹{minPrice}/hr</span>
        </div>

        {/* Operating Hours indicator */}
        <div style={{
          position: 'absolute',
          top: 'clamp(8px, 2vw, 12px)',
          left: 'clamp(8px, 2vw, 12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: 'clamp(3px, 1vw, 6px) clamp(6px, 1.5vw, 10px)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'clamp(0.65rem, 1vw, 0.75rem)',
          backdropFilter: 'blur(4px)',
        }}>
          <span className="pulse-dot"></span>
          <span style={{ fontWeight: 500, fontSize: '0.7rem' }}>Open</span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: 'clamp(12px, 3vw, 16px)', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 'clamp(8px, 2vw, 12px)' }}>
        {/* Name and Rating */}
        <div>
          <h3 style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', fontWeight: 700, lineHeight: 1.3, color: '#fff', marginBottom: '4px' }}>
            {name}
          </h3>
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <div className="stars flex-center">{renderStars(rating)}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ({totalReviews})
            </span>
          </div>
        </div>

        {/* Address Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <MapPin size={14} className="text-gradient" />
            <span>{area || 'Lucknow'}</span>
          </div>
          {venue.distance !== undefined && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              ⚡ {venue.distance.toFixed(1)} km away
            </div>
          )}
        </div>

        {/* Sports Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {sports.map((sport, idx) => (
            <span key={idx} className={`badge ${SPORT_COLORS[sport.name] || 'badge-cyan'}`}>
              <Activity size={10} style={{ marginRight: '3px' }} />
              {sport.name}
            </span>
          ))}
        </div>

        {/* Posted by owner details */}
        {venue.owner?.username && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px' }}>
            <span>👤 Posted by:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>@{venue.owner.username}</span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <Link 
            to={`/venue/${_id}`} 
            className="btn btn-ghost btn-sm flex-center"
            style={{ width: '100%', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Check Slots & Book
          </Link>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .venue-card-wrapper:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg), 0 4px 20px rgba(6, 182, 212, 0.15) !important;
          border-color: var(--glass-border-hover) !important;
        }
        .venue-card-wrapper:hover .card-image {
          transform: scale(1.05);
        }
        .highlight-border {
          animation: borderGlow 2s infinite alternate;
        }
        @keyframes borderGlow {
          from { border-color: rgba(6, 182, 212, 0.4); }
          to { border-color: rgba(139, 92, 246, 0.8); }
        }
      `}} />
    </div>
  );
}
