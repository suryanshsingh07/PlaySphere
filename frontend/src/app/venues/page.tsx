'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Map, LayoutGrid, Loader2, Bot } from 'lucide-react';
import { SPORTS_LIST, SPORTS_AREAS } from '@/shared/constants/venues';
import { VenueCard } from '@/components/venue/VenueCard';
import { VenueMap, MapItem } from '@/components/venue/VenueMap';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';
import { VenueDiscoveryInsights } from '@/components/ai/VenueDiscoveryInsights';
import { Venue, VenueFilters, Sport, SkillLevel, Infrastructure, Landmark } from '@/shared/types';

function VenuesContent() {
  const searchParams = useSearchParams();
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [allInfra, setAllInfra] = useState<Infrastructure[]>([]);
  const [allLandmarks, setAllLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VenueFilters>({
    sport: (searchParams.get('sport') as Sport) || '',
    area: '',
    maxPrice: 2000,
    skillLevel: '',
    searchQuery: '',
  });
  const [view, setView] = useState<'grid' | 'ai' | 'map'>(
    searchParams.get('tab') === 'map' ? 'map' : 'grid'
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubApprovedVenues: (() => void) | undefined;
    let unsubInfra: (() => void) | undefined;
    let unsubLandmarks: (() => void) | undefined;

    import('@/backend/firebase/firestore').then(({ subscribeApprovedVenues, subscribeInfrastructure, subscribeLandmarks }) => {
      if (!active) return;
      unsubApprovedVenues = subscribeApprovedVenues((data) => {
        if (active) {
          setAllVenues(data);
        }
      });
      unsubInfra = subscribeInfrastructure((infraData) => {
        if (active) {
          setAllInfra(infraData);
        }
      });
      unsubLandmarks = subscribeLandmarks((landmarkData) => {
        if (active) {
          setAllLandmarks(landmarkData);
          setLoading(false);
        }
      });
    });

    return () => {
      active = false;
      if (unsubApprovedVenues) unsubApprovedVenues();
      if (unsubInfra) unsubInfra();
      if (unsubLandmarks) unsubLandmarks();
    };
  }, []);

  const combinedItems = useMemo<Venue[]>(() => {
    const unlinkedInfra = allInfra
      .filter((i) => !i.ownerLinked)
      .map((i) => ({
        ...i,
        sport: i.sport as Sport,
        price: 0,
        rating: i.rating || 0,
        reviewCount: i.reviewCount || 0,
        amenities: i.amenities || [],
        skillLevel: 'all' as const,
        timings: { open: '00:00', close: '00:00' },
        description: i.description || '',
        imageUrl: i.imageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        category: 'infrastructure',
        available: false,
        ownerId: 'system',
        source: 'seed' as const,
        approvalStatus: 'approved' as const,
        address: `${i.name}, ${i.area}`,
        peakPricing: { morning: 0, afternoon: 0, evening: 0 },
      }));
    return [...allVenues, ...unlinkedInfra] as Venue[];
  }, [allVenues, allInfra]);

  const venues = useMemo(() => {
    let filtered = [...combinedItems];

    if (filters.sport) filtered = filtered.filter((v) => v.sport === filters.sport);
    if (filters.area) filtered = filtered.filter((v) => v.area === filters.area);
    if (filters.maxPrice) {
      filtered = filtered.filter((v) => v.category === 'infrastructure' || v.price <= filters.maxPrice!);
    }
    if (filters.skillLevel) filtered = filtered.filter((v) => v.skillLevel === filters.skillLevel || v.skillLevel === 'all');
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) => v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [filters, combinedItems]);

  const combinedRealtimeMapData = useMemo<MapItem[]>(() => {
    const mapVenues = venues
      .filter((v) => v.category !== 'infrastructure')
      .map((v) => ({
        id: v.id,
        name: v.name,
        area: v.area,
        coordinates: v.coordinates,
        mapType: 'marketplace' as const,
        sport: v.sport,
        imageUrl: v.imageUrl,
        rating: v.rating,
        price: v.price,
        available: v.available,
      }));

    const mapInfra = venues
      .filter((v) => v.category === 'infrastructure')
      .map((v) => ({
        id: v.id,
        name: v.name,
        area: v.area,
        coordinates: v.coordinates,
        mapType: 'infrastructure' as const,
        sport: v.sport,
        imageUrl: v.imageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        venueCode: v.venueCode,
        ownershipStatus: v.ownershipStatus,
      }));

    const mapLandmarks = allLandmarks.map((l) => ({
      id: l.id,
      name: l.name,
      area: l.area,
      coordinates: { lat: l.latitude, lng: l.longitude },
      mapType: 'landmark' as const,
      sportsRelevance: l.sportsRelevance,
    }));

    return [...mapVenues, ...mapInfra, ...mapLandmarks];
  }, [venues, allLandmarks]);



  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Discover <span className="gradient-text">Venues</span>
          </h1>
          <p className="text-slate-400">
            {venues.length} venues found across Lucknow
          </p>
        </div>

        <div className="mb-10">
          <VenueDiscoveryInsights />
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search venues, areas, or sports..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
              className="w-full bg-slate-900 border-2 border-black rounded-md pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-0 shadow-[2px_2px_0px_#000] transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle Filters"
            aria-label="Toggle Filters"
            className={`btn-secondary px-4 py-3 shadow-[2px_2px_0px_#000] ${showFilters ? 'bg-cyan-400 text-black' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <div className="flex bg-slate-900 rounded-md border-2 border-black overflow-hidden shadow-[2px_2px_0px_#000]">
            <button
              onClick={() => setView('grid')}
              title="Grid View"
              aria-label="Grid View"
              className={`px-4 py-3 transition-colors ${view === 'grid' ? 'bg-cyan-400 text-black font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('map')}
              title="Map View"
              aria-label="Map View"
              className={`px-4 py-3 border-l-2 border-r-2 border-black transition-colors ${view === 'map' ? 'bg-emerald-400 text-black font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('ai')}
              title="AI Concierge"
              aria-label="AI Concierge"
              className={`px-4 py-3 transition-colors ${view === 'ai' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Bot className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-slate-900 border-3 border-black rounded-lg p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shadow-[4px_4px_0px_#000]">
            {/* Sport Filter */}
            <div>
              <label htmlFor="filter-sport" className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">Sport</label>
              <select
                id="filter-sport"
                title="Filter by Sport"
                value={filters.sport || ''}
                onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value as Sport | '' }))}
                className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0px_#000]"
              >
                <option value="" className="bg-slate-900">All Sports</option>
                {SPORTS_LIST.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label htmlFor="filter-area" className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">Area</label>
              <select
                id="filter-area"
                title="Filter by Area"
                value={filters.area || ''}
                onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))}
                className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0px_#000]"
              >
                <option value="" className="bg-slate-900">All Areas</option>
                {SPORTS_AREAS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">{a}</option>
                ))}
              </select>
            </div>

            {/* Skill Level Filter */}
            <div>
              <label htmlFor="filter-skill" className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">Skill Level</label>
              <select
                id="filter-skill"
                title="Filter by Skill Level"
                value={filters.skillLevel || ''}
                onChange={(e) => setFilters((f) => ({ ...f, skillLevel: e.target.value as SkillLevel | '' }))}
                className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0px_#000]"
              >
                <option value="" className="bg-slate-900">All Levels</option>
                <option value="beginner" className="bg-slate-900">Beginner</option>
                <option value="intermediate" className="bg-slate-900">Intermediate</option>
                <option value="advanced" className="bg-slate-900">Advanced</option>
              </select>
            </div>

            {/* Max Price Filter */}
            <div>
              <label htmlFor="filter-price" className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                Max Price: <span className="text-cyan-400 font-extrabold">₹{filters.maxPrice}</span>
              </label>
              <input
                id="filter-price"
                type="range"
                min={100}
                max={2000}
                step={50}
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                placeholder="Filter by price"
                title="Filter by price"
                className="w-full accent-cyan-400 h-2 bg-slate-900 border-2 border-black rounded-md appearance-none cursor-pointer"
              />
            </div>

            {/* Reset */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={() => setFilters({ sport: '', area: '', maxPrice: 2000, skillLevel: '', searchQuery: '' })}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 border-2 border-black bg-slate-900 px-3 py-1.5 rounded-md shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Sport Quick Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setFilters((f) => ({ ...f, sport: '' }))}
            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-bold transition-all border-2 border-black shadow-[2px_2px_0px_#000] ${!filters.sport ? 'bg-cyan-400 text-black' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
          >
            All
          </button>
          {SPORTS_LIST.map((sport) => {
            const isActive = filters.sport === sport.value;
            let activeClass = '';
            if (sport.value === 'badminton') activeClass = 'bg-yellow-400 text-black';
            else if (sport.value === 'football') activeClass = 'bg-emerald-400 text-black';
            else if (sport.value === 'swimming') activeClass = 'bg-cyan-400 text-black';
            else if (sport.value === 'kabaddi') activeClass = 'bg-rose-400 text-black';

            return (
              <button
                key={sport.value}
                onClick={() => setFilters((f) => ({ ...f, sport: f.sport === sport.value ? '' : sport.value as Sport }))}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-bold transition-all border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000] ${isActive ? activeClass : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                {sport.emoji} {sport.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-lg shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">Loading Venues</h3>
            <p className="text-slate-400">Fetching the latest owner-driven sports spaces in Lucknow...</p>
          </div>
        ) : view === 'grid' ? (
          venues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : allVenues.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 border-2 border-black rounded-lg p-10 shadow-[4px_4px_0px_#000]">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="font-display text-xl font-bold text-white mb-2">No venues available yet</h3>
              <p className="text-slate-400">Be the first venue owner to list your sports facility.</p>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-xl font-bold text-white mb-2">No venues found</h3>
              <p className="text-slate-400">Try adjusting your filters or use the AI Concierge for smart recommendations</p>
              <button onClick={() => setView('ai')} className="btn-primary mt-4">
                <Bot className="w-4 h-4" /> Ask AI Concierge
              </button>
            </div>
          )
        ) : view === 'map' ? (
          <VenueMap items={combinedRealtimeMapData} />
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold mb-2">
                <span className="gradient-text">AI Concierge</span>
              </h2>
              <p className="text-slate-400 text-sm">Describe what you&apos;re looking for in natural language</p>
            </div>
            <AIConciergePreview />
          </div>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <VenuesContent />
    </Suspense>
  );
}
