'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { formatCurrency, getSportEmoji } from '@/shared/helpers/utils';

// Haversine formula to compute distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface MapItem {
  id: string;
  name: string;
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  mapType: 'marketplace' | 'infrastructure' | 'landmark';
  sport?: string;
  imageUrl?: string;
  rating?: number;
  price?: number;
  available?: boolean;
  venueCode?: string;
  ownershipStatus?: 'pending' | 'approved' | 'rejected' | null;
  sportsRelevance?: string[];
  markerColor?: string; // Precalculated marker color
}

interface VenueMapProps {
  items: MapItem[];
}

function MapSkeleton({ message = 'Loading realtime venue mapping and infrastructure layers...' }: { message?: string }) {
  return (
    <div className="w-full h-full bg-[#080a10] relative overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
      {/* Self-contained shimmer keyframe style */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .neo-grid-bg {
          background-image: radial-gradient(circle, #ffffff 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        .animated-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
      `}</style>
      
      {/* Neo-brutalist grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none neo-grid-bg" />
      
      {/* Animated Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none animated-shimmer" />

      <div className="text-center z-10">
        {/* Animated map pin */}
        <div className="relative mb-5 flex justify-center">
          <div className="w-14 h-14 bg-cyan-950/40 border-2 border-cyan-400 rounded-full flex items-center justify-center animate-bounce">
            <MapPin className="w-7 h-7 text-cyan-400" />
          </div>
          {/* Pulse effect */}
          <div className="absolute -inset-1 border-2 border-cyan-400/30 rounded-full animate-ping opacity-45" />
        </div>
        
        <h3 className="text-white font-extrabold text-base mb-2 font-mono uppercase tracking-wider">
          Preparing Map Viewport
        </h3>
        <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Stats Skeleton Badge */}
      <div className="absolute top-3 left-3 bg-slate-900/90 border-2 border-black rounded-md px-3 py-1.5 text-xs font-bold text-slate-400 shadow-[3px_3px_0px_0px_#000] flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
        Syncing infrastructure telemetry...
      </div>
    </div>
  );
}

function ActiveVenueMap({ items }: VenueMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const center = useMemo(() => ({ lat: 26.8467, lng: 80.9462 }), []);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

  // Apply vertical and horizontal coordinate micro-offsets for overlapping pins
  // Filter out invalid coordinates to prevent crashes, and precalculate colors
  const adjustedItems = useMemo(() => {
    const coordsMap = new Map<string, number>();
    
    // Filter malformed/missing coordinates
    const validItems = items.filter(
      (item) =>
        item?.coordinates &&
        typeof item.coordinates.lat === 'number' &&
        typeof item.coordinates.lng === 'number' &&
        !isNaN(item.coordinates.lat) &&
        !isNaN(item.coordinates.lng)
    );

    return validItems.map((item) => {
      const { lat, lng } = item.coordinates;
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      const count = coordsMap.get(key) || 0;
      coordsMap.set(key, count + 1);

      // Precalculate marker color (Marketplace = Cyan, Infrastructure = Slate, Landmark = Amber)
      const markerColor =
        item.mapType === 'marketplace'
          ? '#22d3ee'
          : item.mapType === 'infrastructure'
          ? '#94a3b8'
          : '#fbbf24';

      let finalCoords = { lat, lng };

      if (count > 0) {
        // Spiral offsets based on duplicate index to spread markers out in 8 directions
        const angle = count * ((2 * Math.PI) / 8);
        const radius = 0.00008 * (1 + Math.floor(count / 8) * 0.5);
        finalCoords = {
          lat: lat + radius * Math.sin(angle),
          lng: lng + radius * Math.cos(angle),
        };
      }

      return {
        ...item,
        coordinates: finalCoords,
        markerColor,
      };
    });
  }, [items]);

  // Count nearby sports facilities within 3km of selected landmark
  const nearbySportsCount = useMemo(() => {
    if (!selectedItem || selectedItem.mapType !== 'landmark' || !selectedItem.coordinates) return 0;
    const { lat, lng } = selectedItem.coordinates;

    const nearby = adjustedItems.filter((item) => {
      if (item.mapType === 'landmark') return false;
      const dist = getDistance(lat, lng, item.coordinates.lat, item.coordinates.lng);
      return dist <= 3.0;
    });

    return nearby.length;
  }, [selectedItem, adjustedItems]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#080a10] border-2 border-black rounded-xl p-6 min-h-[400px]">
        <div className="text-center bg-[#0d111d] border-2 border-red-500/50 p-6 rounded-lg max-w-sm">
          <div className="w-12 h-12 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-red-400 text-lg">⚠️</span>
          </div>
          <h3 className="text-white font-extrabold text-sm mb-2">Google Maps failed to load</h3>
          <p className="text-slate-400 text-xs mb-4">
            Could not initialize the maps client. Please check your internet connection or API key.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-400 text-black font-black text-xs py-2 px-4 rounded border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <MapSkeleton message="Connecting to Google Maps services..." />;
  }

  // Sleek dark mode map style
  const mapStyles = [
    { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'poi.sports_complex', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  ];

  const activeMarketplaceCount = items.filter(
    (item) => item.mapType === 'marketplace' && item.available
  ).length;

  const mappedInfraCount = items.filter(
    (item) => item.mapType === 'infrastructure'
  ).length;

  return (
    <div className="w-full h-full relative min-h-[400px]">
      <GoogleMap
        zoom={12}
        center={center}
        mapContainerClassName="w-full h-full"
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: typeof google !== 'undefined' ? google.maps.ControlPosition.RIGHT_BOTTOM : undefined,
          },
          gestureHandling: 'cooperative',
        }}
      >
        {adjustedItems.map((item) => (
          <MarkerF
            key={`${item.mapType}-${item.id}`}
            position={{ lat: item.coordinates.lat, lng: item.coordinates.lng }}
            onClick={() => setSelectedItem(item)}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: item.markerColor || '#22d3ee',
              fillOpacity: 1,
              strokeWeight: 1.5,
              strokeColor: '#000000',
              scale: 1.8,
              anchor: typeof google !== 'undefined' ? new google.maps.Point(12, 24) : undefined,
            }}
          />
        ))}

        {selectedItem && selectedItem.coordinates && (
          <InfoWindowF
            position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lng }}
            onCloseClick={() => setSelectedItem(null)}
            options={{
              pixelOffset: typeof google !== 'undefined' ? new google.maps.Size(0, -36) : undefined,
              disableAutoPan: false,
            }}
          >
            {/* Custom popup UI - exact same modern cards as Mapbox v8 */}
            <div className="rounded-lg overflow-hidden bg-slate-900 border-2 border-black shadow-[4px_4px_0px_#000] min-w-[220px] max-w-[280px] text-slate-200">
              {/* Image Header (if applicable) */}
              {selectedItem.mapType !== 'landmark' && selectedItem.imageUrl && (
                <div className="relative h-28 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {selectedItem.sport && (
                    <div className="absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded border border-black bg-[#22d3ee] text-black">
                      {getSportEmoji(selectedItem.sport)} {selectedItem.sport}
                    </div>
                  )}
                  {selectedItem.mapType === 'infrastructure' ? (
                    <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded border border-black bg-slate-700 text-slate-300">
                      Mapped
                    </div>
                  ) : !selectedItem.available && (
                    <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded border border-black bg-[#f43f5e] text-black">
                      Unavailable
                    </div>
                  )}
                </div>
              )}

              {/* Popup Content */}
              <div className="p-3">
                <h4 className="font-extrabold text-sm mb-1 font-sans text-slate-200">
                  {selectedItem.name}
                </h4>
                <div className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                  <span>📍</span> {selectedItem.area}
                </div>

                {/* Layer Specific Content */}
                {selectedItem.mapType === 'marketplace' && (
                  <>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[#22d3ee] font-bold text-sm">
                        {formatCurrency(selectedItem.price || 0)}/hr
                      </span>
                      <span className="text-[#fbbf24] text-xs font-semibold">
                        ★ {selectedItem.rating || 0}
                      </span>
                    </div>
                    <a
                      href={`/venues/${selectedItem.id}`}
                      className="block text-center bg-[#22d3ee] text-black font-bold text-xs py-2 px-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] no-underline hover:bg-cyan-300 transition-colors"
                    >
                      View & Book →
                    </a>
                  </>
                )}

                {selectedItem.mapType === 'infrastructure' && (
                  <>
                    <div className="bg-slate-900 border border-slate-700/60 p-1.5 rounded text-[11px] mb-2 text-slate-300 font-mono">
                      Code: {selectedItem.venueCode || 'N/A'}
                      <br />
                      Status: {selectedItem.ownershipStatus === 'approved' ? 'Ownership Verified' : selectedItem.ownershipStatus === 'pending' ? 'Verification Pending' : 'Ownership Unverified'}
                    </div>

                    <div className="text-rose-400 font-bold text-xs bg-rose-950/40 border border-rose-500/30 px-2 py-1 rounded text-center mb-2.5">
                      Booking Unavailable
                    </div>

                    {selectedItem.ownershipStatus !== 'approved' && selectedItem.ownershipStatus !== 'pending' ? (
                      <a
                        href={`/owner?tab=verify&code=${selectedItem.venueCode}`}
                        className="block text-center bg-yellow-400 text-black font-bold text-xs py-2 px-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] no-underline hover:bg-yellow-300 transition-colors"
                      >
                        Verify Ownership →
                      </a>
                    ) : (
                      <a
                        href={`/venues/${selectedItem.id}?infra=true`}
                        className="block text-center bg-[#22d3ee] text-black font-bold text-xs py-2 px-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] no-underline hover:bg-cyan-300 transition-colors"
                      >
                        View Details →
                      </a>
                    )}
                  </>
                )}

                {selectedItem.mapType === 'landmark' && (
                  <>
                    <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded text-xs mb-2">
                      <span className="text-[#fbbf24] font-bold">★ Sports Hub Area</span>
                      <div className="text-slate-300 mt-1">
                        Nearby sports facilities: <strong className="text-slate-200">{nearbySportsCount} found</strong> within 3km.
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal mb-0">
                      Discovery Helper: Try searching &quot;near {selectedItem.name}&quot; in the AI Concierge to discover and book available slots!
                    </p>
                  </>
                )}
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Map Stats Badge */}
      <div className="absolute top-3 left-3 bg-slate-900 border-2 border-black rounded-md px-3 py-1.5 text-xs font-bold text-slate-200 shadow-[3px_3px_0px_0px_#000] pointer-events-none">
        <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-cyan-400" />
        {activeMarketplaceCount} active venues ({mappedInfraCount} mapped)
      </div>
    </div>
  );
}

export function VenueMap(props: VenueMapProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden relative border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-[#080a10]"
    >
      {shouldLoad ? (
        <ActiveVenueMap {...props} />
      ) : (
        <MapSkeleton />
      )}
    </div>
  );
}

