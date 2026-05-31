import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Star, MapPin, Activity, Navigation } from 'lucide-react';

// Custom component to handle centering/recentering the map when selected coordinates change
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map events component to listen to user map clicks
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Custom Leaflet DivIcon factory for user location (blue marker)
const createUserMarker = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Custom Leaflet DivIcon factory for venues with location pin + sport emoji
const createVenueMarker = (isActive, primarySport, hasBookings = false) => {
  const sportEmoji = {
    football: '⚽',
    cricket: '🏏',
    badminton: '🏸',
    tennis: '🎾',
    basketball: '🏀',
    swimming: '🏊',
    'table-tennis': '🏓',
    volleyball: '🏐',
    squash: '🎾',
    gym: '💪'
  }[primarySport] || '🏟️';

  // Color based on booking status
  const pinColor = hasBookings ? '#10b981' : '#fff'; // Green if has bookings, white otherwise
  const pinShadow = hasBookings ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.3)';
  const activeGlow = isActive ? 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))' : '';

  return L.divIcon({
    className: `venue-location-marker ${isActive ? 'venue-marker-active' : ''}`,
    html: `
      <div style="
        position: relative;
        width: ${isActive ? '48px' : '40px'};
        height: ${isActive ? '58px' : '50px'};
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: ${activeGlow};
        transition: all 0.3s ease;
      ">
        <!-- Location Pin -->
        <svg width="${isActive ? '40' : '32'}" height="${isActive ? '48' : '40'}" viewBox="0 0 32 40" style="filter: drop-shadow(0 4px 8px ${pinShadow});">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" 
                fill="${pinColor}" 
                stroke="#0891b2" 
                stroke-width="2"/>
          <circle cx="16" cy="15" r="8" fill="#0891b2"/>
        </svg>
        <!-- Sport Emoji Badge -->
        <div style="
          position: absolute;
          top: ${isActive ? '8px' : '6px'};
          left: 50%;
          transform: translateX(-50%);
          font-size: ${isActive ? '18px' : '16px'};
          z-index: 10;
        ">${sportEmoji}</div>
      </div>
    `,
    iconSize: isActive ? [48, 58] : [40, 50],
    iconAnchor: isActive ? [24, 58] : [20, 50],
    popupAnchor: [0, isActive ? -58 : -50],
  });
};

export default function MapView({ 
  venues = [], 
  selectedVenueId = null, 
  onVenueSelect = null, 
  height = '450px',
  pinnedLocation = null,
  onLocationPin = null
}) {
  // Lucknow coordinates default center
  const defaultCenter = [26.8554, 80.9933]; 
  const defaultZoom = 12;

  // Center coordinates fallback
  // Center on selected venue, then pinned location, then default Lucknow center
  const selectedVenue = venues.find(v => v._id === selectedVenueId);
  const centerCoords = selectedVenue && selectedVenue.location?.coordinates
    ? [selectedVenue.location.coordinates[1], selectedVenue.location.coordinates[0]]
    : pinnedLocation
      ? pinnedLocation
      : defaultCenter;

  const zoomLevel = selectedVenueId ? 14 : pinnedLocation ? 13 : defaultZoom;

  const handleLocateMe = (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (onLocationPin) {
          onLocationPin([latitude, longitude]);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve location. Please check browser permission settings.');
      }
    );
  };

  return (
    <div className="glass" style={{ height, overflow: 'hidden', position: 'relative', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
      {/* Locate Me Floating Overlay Button */}
      <button
        onClick={handleLocateMe}
        className="btn btn-ghost flex-center gap-xs"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.75rem',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.95)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)'}
      >
        <Navigation size={12} className="text-gradient" /> Track My Location
      </button>

      <MapContainer
        center={centerCoords}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Dark style tile layer from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Dynamic click-to-pin listener */}
        <MapEvents onMapClick={onLocationPin} />

        {/* User's Pinned Location Marker */}
        {pinnedLocation && (
          <Marker position={pinnedLocation} icon={createUserMarker()}>
            <Popup>
              <div style={{ fontFamily: 'var(--font-primary)', width: '160px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                  📍 Pinned Location
                </h4>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Lat: {pinnedLocation[0].toFixed(4)}<br/>
                  Lng: {pinnedLocation[1].toFixed(4)}
                </p>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '6px' }}>
                  Venues sorted by distance
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Venues Markers with Professional Location Pins */}
        {venues.map((venue) => {
          if (!venue.location?.coordinates) return null;
          const [lng, lat] = venue.location.coordinates;
          const isActive = venue._id === selectedVenueId;
          const primarySport = venue.sports[0]?.name || 'gym';
          const hasBookings = venue.totalBookings > 0; // Assuming this field exists

          return (
            <Marker
              key={venue._id}
              position={[lat, lng]}
              icon={createVenueMarker(isActive, primarySport, hasBookings)}
              eventHandlers={{
                click: () => {
                  if (onVenueSelect) onVenueSelect(venue._id);
                },
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-primary)', width: '220px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    {venue.name}
                  </h4>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px', margin: '0 0 8px 0' }}>
                    <Star size={12} className="star-filled" fill="currentColor" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-accent)' }}>
                      {venue.rating}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      ({venue.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    <MapPin size={12} />
                    <span>{venue.area}</span>
                  </div>
                  
                  {venue.distance !== undefined && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '10px' }}>
                      ⚡ {venue.distance.toFixed(1)} km away
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {venue.sports.slice(0, 4).map((s, idx) => {
                      const sportEmoji = {
                        football: '⚽',
                        cricket: '🏏',
                        badminton: '🏸',
                        tennis: '🎾',
                        basketball: '🏀',
                        swimming: '🏊',
                        'table-tennis': '🏓',
                        volleyball: '🏐',
                        squash: '🎾',
                        gym: '💪'
                      }[s.name] || '🏟️';
                      return (
                        <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                          {sportEmoji} {s.name}
                        </span>
                      );
                    })}
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm flex-center"
                    style={{ fontSize: '0.7rem', padding: '6px 10px', width: '100%', borderRadius: '4px', marginBottom: '6px', gap: '4px' }}
                  >
                    <MapPin size={12} /> Open in Google Maps
                  </a>

                  <Link
                    to={`/venue/${venue._id}`}
                    className="btn btn-primary btn-sm flex-center"
                    style={{ fontSize: '0.75rem', padding: '6px 10px', width: '100%', borderRadius: '4px', color: '#fff' }}
                  >
                    View Slots & Book
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapController center={centerCoords} zoom={zoomLevel} />
      </MapContainer>
    </div>
  );
}
