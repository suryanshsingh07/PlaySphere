import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Star, MapPin, Activity } from 'lucide-react';

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

// Custom Leaflet DivIcon factory
const createVenueMarker = (isActive) => {
  return L.divIcon({
    className: `venue-marker ${isActive ? 'venue-marker-active' : ''}`,
    html: `<div style="
      width: ${isActive ? '18px' : '12px'}; 
      height: ${isActive ? '18px' : '12px'}; 
      border-radius: 50%; 
      background: ${isActive ? 'var(--accent-primary)' : 'var(--accent-tertiary)'}; 
      border: 2px solid #fff;
      box-shadow: 0 0 ${isActive ? '15px var(--accent-primary)' : '6px var(--accent-tertiary)'};
    "></div>`,
    iconSize: isActive ? [18, 18] : [12, 12],
    iconAnchor: isActive ? [9, 9] : [6, 6],
  });
};

export default function MapView({ venues = [], selectedVenueId = null, onVenueSelect = null, height = '450px' }) {
  // Lucknow coordinates default center
  const defaultCenter = [26.8554, 80.9933]; 
  const defaultZoom = 12;

  // Find selected venue's location to center on
  const selectedVenue = venues.find(v => v._id === selectedVenueId);
  const centerCoords = selectedVenue && selectedVenue.location?.coordinates
    ? [selectedVenue.location.coordinates[1], selectedVenue.location.coordinates[0]]
    : defaultCenter;

  const zoomLevel = selectedVenueId ? 14 : defaultZoom;

  return (
    <div className="glass" style={{ height, overflow: 'hidden', position: 'relative', border: '1px solid var(--glass-border)' }}>
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

        {venues.map((venue) => {
          if (!venue.location?.coordinates) return null;
          const [lng, lat] = venue.location.coordinates;
          const isActive = venue._id === selectedVenueId;

          return (
            <Marker
              key={venue._id}
              position={[lat, lng]}
              icon={createVenueMarker(isActive)}
              eventHandlers={{
                click: () => {
                  if (onVenueSelect) onVenueSelect(venue._id);
                },
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-primary)', width: '200px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    {venue.name}
                  </h4>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px', margin: '0 0 6px 0' }}>
                    <Star size={12} className="star-filled" fill="currentColor" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-accent)' }}>
                      {venue.rating}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      ({venue.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <MapPin size={12} />
                    <span>{venue.area}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    {venue.sports.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/venue/${venue._id}`}
                    className="btn btn-primary btn-sm flex-center"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', width: '100%', borderRadius: '4px', color: '#fff' }}
                  >
                    View Slots
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
