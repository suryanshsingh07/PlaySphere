import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, SlidersHorizontal, Map, Compass, RotateCcw, AlertTriangle } from 'lucide-react';
import VenueCard from '../components/VenueCard';
import MapView from '../components/MapView';

const AREAS = [
  'Gomti Nagar', 'Hazratganj', 'Indira Nagar', 'Aliganj', 'Chinhat',
  'Jankipuram', 'Rajajipuram', 'Mahanagar', 'Alambagh', 'Vikas Nagar',
  'Eldeco', 'Sahara', 'Aashiana', 'Cantt'
];

const SPORTS = [
  'football', 'cricket', 'badminton', 'tennis', 'basketball', 'swimming', 'table-tennis', 'volleyball', 'squash', 'gym'
];

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

  // Map state
  const [selectedVenueId, setSelectedVenueId] = useState(null);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (sportFilter) params.sport = sportFilter;
      if (areaFilter) params.area = areaFilter;
      if (ratingFilter) params.minRating = ratingFilter;
      if (searchQuery) params.search = searchQuery;
      if (sortOption) params.sort = sortOption;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;

      const res = await axios.get('/api/venues', { params });
      if (res.data.success) {
        setVenues(res.data.data);
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
  }, [sportFilter, areaFilter, ratingFilter, sortOption, priceRange.min, priceRange.max]);

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
  };

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
          Explore <span className="text-gradient">Sports Arenas</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Find fields and book available courts across Lucknow city.
        </p>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', border: '1px solid var(--glass-border)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Line: Search Text */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="input-icon-wrapper" style={{ flexGrow: 1 }}>
              <Search size={18} className="icon-left" />
              <input
                type="text"
                placeholder="Search by venue name, amenities, keyword..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
              Search
            </button>
            <button 
              type="button" 
              onClick={handleResetFilters} 
              className="btn btn-ghost" 
              title="Reset Filters"
              style={{ padding: '12px' }}
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Bottom Line: Quick Dropdowns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            alignItems: 'center'
          }}>
            {/* Sport Select */}
            <div>
              <select
                className="form-select"
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="">Any Sport</option>
                {SPORTS.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Select */}
            <div>
              <select
                className="form-select"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="">Any Location</option>
                {AREAS.map((a, idx) => (
                  <option key={idx} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <select
                className="form-select"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="">Any Rating</option>
                <option value="4.5">⭐ 4.5+ Stars</option>
                <option value="4.0">⭐ 4.0+ Stars</option>
                <option value="3.5">⭐ 3.5+ Stars</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                className="form-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="rating">Top Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Budget Range Inputs */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min ₹"
                className="form-input"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'center' }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
              <input
                type="number"
                placeholder="Max ₹"
                className="form-input"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'center' }}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Main Split Layout */}
      <div className="explore-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Side: Venues list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              🏟️ Search Results ({venues.length})
            </h3>
            {venues.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', fontWeight: 500 }}>
                Click a venue to spot on map
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid-2">
              {[1, 2, 4, 5].map((i) => (
                <div key={i} className="glass" style={{ height: '300px', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
                  <div className="skeleton" style={{ height: '170px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}></div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                    <div className="skeleton" style={{ height: '20px', width: '70%' }}></div>
                    <div className="skeleton" style={{ height: '15px', width: '40%' }}></div>
                    <div className="skeleton" style={{ height: '35px', marginTop: 'auto', borderRadius: 'var(--radius-sm)' }}></div>
                  </div>
                </div>
              ))}
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
                We couldn't find any sports venues matching your exact filters. Try adjusting your location radius or search keywords.
              </p>
              <button onClick={handleResetFilters} className="btn btn-ghost btn-sm" style={{ marginTop: '16px' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid-2">
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

        {/* Right Side: Map sticky view */}
        <div className="map-sidebar" style={{
          position: 'relative',
          width: '100%',
        }}>
          <div style={{ position: 'sticky', top: '96px' }}>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h3 className="flex-center gap-sm" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                <Map size={18} className="text-gradient" /> Live Geo Map View
              </h3>
            </div>
            <MapView
              venues={venues}
              selectedVenueId={selectedVenueId}
              onVenueSelect={(id) => setSelectedVenueId(id)}
              height="500px"
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 992px) {
          .explore-layout {
            grid-template-columns: 1.1fr 0.9fr !important;
          }
        }
      `}} />
    </div>
  );
}
