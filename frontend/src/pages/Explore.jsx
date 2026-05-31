import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, SlidersHorizontal, Map, Compass, RotateCcw, AlertTriangle, X, MapPin, TrendingUp } from 'lucide-react';
import VenueCard from '../components/VenueCard';
import MapView from '../components/MapView';

// Haversine formula to compute distance in km between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Explore() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [sportFilter, setSportFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('rating');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Map state
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);

  // Dynamic sport/area lists from venues
  const [availableSports, setAvailableSports] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);

  const activeFilterCount = [sportFilter, areaFilter, ratingFilter, priceRange.min, priceRange.max].filter(Boolean).length;

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (sportFilter) params.sport = sportFilter;
      if (areaFilter) params.area = areaFilter;
      if (ratingFilter) params.minRating = ratingFilter;
      if (searchQuery) params.search = searchQuery;
      if (sortOption && sortOption !== 'distance') params.sort = sortOption;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;

      const res = await axios.get('/api/venues', { params });
      if (res.data.success) {
        let venueList = res.data.data;

        // Extract unique sports & areas for dynamic filter options
        const sportsSet = new Set();
        const areasSet = new Set();
        venueList.forEach(v => {
          v.sports?.forEach(s => sportsSet.add(s.name));
          if (v.area) areasSet.add(v.area);
        });
        setAvailableSports([...sportsSet].sort());
        setAvailableAreas([...areasSet].sort());

        // Calculate distances if pinned location exists
        if (pinnedLocation) {
          venueList = venueList.map((v) => {
            if (v.location?.coordinates) {
              const [lng, lat] = v.location.coordinates;
              const dist = getDistance(pinnedLocation[0], pinnedLocation[1], lat, lng);
              return { ...v, distance: dist };
            }
            return v;
          });

          if (sortOption === 'distance') {
            venueList.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
          }
        }

        setVenues(venueList);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve sports venues. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [sportFilter, areaFilter, ratingFilter, sortOption, priceRange.min, priceRange.max, pinnedLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVenues();
  };

  const handleResetFilters = () => {
    setSportFilter('');
    setAreaFilter('');
    setRatingFilter('');
    setSearchQuery('');
    setSortOption('rating');
    setPriceRange({ min: '', max: '' });
    setSelectedVenueId(null);
    setPinnedLocation(null);
  };

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      {/* Hero Header */}
      <div className="explore-hero">
        <h1 className="explore-hero-title">
          Explore <span className="text-gradient">Sports Arenas</span>
        </h1>
        <p className="explore-hero-sub">
          Discover venues, compare prices, and book courts near you — all in one place.
        </p>
      </div>

      {/* ── Search & Filter Section ─── */}
      <div className="explore-search-section">
        {/* Row 1: Search Bar */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by venue name, sport, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); fetchVenues(); }}
                className="search-clear-btn"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button onClick={handleSearchSubmit} className="search-submit-btn">
            <Search size={16} />
            <span className="hide-mobile">Search</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle-btn ${showFilters ? 'filter-toggle-active' : ''}`}
            title="Toggle Filters"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="filter-badge-count">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Row 2: Collapsible Filters */}
        {showFilters && (
          <div className="quick-filters" style={{ animation: 'slideDown 0.25s ease' }}>
            {/* Sport */}
            <div className="filter-group">
              <label className="filter-label">Sport</label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Sports</option>
                {availableSports.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div className="filter-group">
              <label className="filter-label">Area</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Areas</option>
                {availableAreas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="filter-group">
              <label className="filter-label">Min Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ ⭐</option>
                <option value="4.0">4.0+ ⭐</option>
                <option value="3.5">3.5+ ⭐</option>
                <option value="3.0">3.0+ ⭐</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label className="filter-label">Price (₹/hr)</label>
              <div className="price-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="price-input"
                />
                <span className="price-separator">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="price-input"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select
                value={sortOption}
                onChange={(e) => {
                  if (e.target.value === 'distance' && !pinnedLocation) {
                    alert('📍 Pin a location on the map first to sort by distance!');
                    return;
                  }
                  setSortOption(e.target.value);
                }}
                className="filter-select"
              >
                <option value="rating">Top Rated</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="name">Name A–Z</option>
                <option value="distance">📍 Nearest First</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <label className="filter-label" style={{ visibility: 'hidden' }}>Reset</label>
              <button onClick={handleResetFilters} className="reset-filters-btn">
                <RotateCcw size={14} />
                Reset All
              </button>
            </div>
          </div>
        )}

        {/* Row 3: Active Filter Tags */}
        {(sportFilter || areaFilter || ratingFilter || priceRange.min || priceRange.max) && (
          <div className="active-filters">
            <span className="active-filters-label">Active Filters:</span>
            <div className="filter-tags">
              {sportFilter && (
                <span className="filter-tag">
                  🏅 {sportFilter}
                  <button className="filter-tag-remove" onClick={() => setSportFilter('')}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {areaFilter && (
                <span className="filter-tag">
                  📍 {areaFilter}
                  <button className="filter-tag-remove" onClick={() => setAreaFilter('')}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {ratingFilter && (
                <span className="filter-tag">
                  ⭐ {ratingFilter}+
                  <button className="filter-tag-remove" onClick={() => setRatingFilter('')}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="filter-tag">
                  💰 ₹{priceRange.min || '0'} – ₹{priceRange.max || '∞'}
                  <button className="filter-tag-remove" onClick={() => setPriceRange({ min: '', max: '' })}>
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Split Layout ─── */}
      <div className="explore-layout">
        {/* Left Side: Venues list */}
        <div className="explore-venues-col">
          <div className="explore-results-header">
            <h3 className="explore-results-title">
              🏟️ Results
              <span className="explore-results-count">{venues.length}</span>
            </h3>
            {venues.length > 0 && (
              <span className="explore-results-hint">
                <MapPin size={12} /> Click venue for map focus
              </span>
            )}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="uiverse-loader">
                <svg viewBox="0 0 120 120">
                  <circle className="dash" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-primary)" strokeWidth="8" strokeLinecap="round" />
                  <circle className="spin" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-secondary)" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <p>Loading PlaySphere venues...</p>
            </div>
          ) : error ? (
            <div className="empty-state glass" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={48} color="var(--accent-danger)" />
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginTop: '12px' }}>Connection Error</h4>
              <p style={{ maxWidth: '400px', marginTop: '8px' }}>{error}</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="empty-state glass">
              <Compass size={48} />
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginTop: '12px' }}>No Arenas Found</h4>
              <p style={{ maxWidth: '400px', marginTop: '8px' }}>
                We couldn't find any sports venues matching your filters. Try adjusting your search or clearing filters.
              </p>
              <button onClick={handleResetFilters} className="btn btn-ghost btn-sm" style={{ marginTop: '16px' }}>
                <RotateCcw size={16} />
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="explore-venue-grid">
              {venues.map((venue) => (
                <div
                  key={venue._id}
                  onClick={() => setSelectedVenueId(venue._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <VenueCard
                    venue={venue}
                    highlight={venue._id === selectedVenueId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Sticky Map */}
        <div className="explore-map-col">
          <div className="explore-map-sticky">
            <div className="explore-map-header">
              <h3 className="explore-map-title">
                <Map size={18} className="text-gradient" /> Live Map
              </h3>
              {pinnedLocation && (
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => { setPinnedLocation(null); setSortOption('rating'); }}
                  style={{ fontSize: '0.72rem' }}
                >
                  <X size={12} /> Clear Pin
                </button>
              )}
            </div>
            <MapView
              venues={venues}
              selectedVenueId={selectedVenueId}
              onVenueSelect={(id) => setSelectedVenueId(id)}
              height="clamp(300px, 60vh, 500px)"
              pinnedLocation={pinnedLocation}
              onLocationPin={(coords) => {
                setPinnedLocation(coords);
                setSortOption('distance');
              }}
            />
            <p className="explore-map-hint">
              📍 Click anywhere on the map to pin a location and sort venues by distance
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* ── Explore Hero ── */
        .explore-hero {
          margin-bottom: 28px;
        }
        .explore-hero-title {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 5vw, 2.2rem);
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
        }
        .explore-hero-sub {
          color: var(--text-secondary);
          font-size: clamp(0.85rem, 2vw, 0.95rem);
          max-width: 600px;
        }

        /* ── Filter Toggle Button ── */
        .filter-toggle-btn {
          position: relative;
          height: 48px;
          width: 48px;
          min-width: 48px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .filter-toggle-btn:hover {
          border-color: rgba(6, 182, 212, 0.3);
          color: var(--accent-primary);
          background: rgba(6, 182, 212, 0.06);
        }
        .filter-toggle-active {
          background: rgba(6, 182, 212, 0.12) !important;
          border-color: var(--accent-primary) !important;
          color: var(--accent-primary) !important;
          box-shadow: 0 0 16px rgba(6, 182, 212, 0.15);
        }
        .filter-badge-count {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);
        }

        /* ── Results Header ── */
        .explore-results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .explore-results-title {
          font-family: var(--font-display);
          font-size: clamp(1rem, 3vw, 1.25rem);
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .explore-results-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 24px;
          padding: 0 8px;
          border-radius: var(--radius-full);
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--accent-primary);
          font-size: 0.78rem;
          font-weight: 700;
        }
        .explore-results-hint {
          font-size: 0.78rem;
          color: var(--text-accent);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.8;
        }

        /* ── Venue Grid ── */
        .explore-venue-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 640px) {
          .explore-venue-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* ── Map Column ── */
        .explore-map-col {
          position: relative;
          width: 100%;
        }
        .explore-map-sticky {
          position: sticky;
          top: 96px;
        }
        .explore-map-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .explore-map-title {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .explore-map-hint {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 10px;
          opacity: 0.7;
        }

        /* ── Two-column Layout ── */
        .explore-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (min-width: 992px) {
          .explore-layout {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }

        /* ── Mobile: hide search text ── */
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
      `}} />
    </div>
  );
}
