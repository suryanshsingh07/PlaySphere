import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import {
  BarChart3, TrendingUp, Calendar, DollarSign, Star, Sparkles,
  Loader, RefreshCw, Layers, Activity, Users, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Trophy, Target, PieChart, Eye,
  Plus, Trash2, ShieldCheck, Mail, Phone, MapPin
} from 'lucide-react';

/* ── SVG Bar Chart ───────────────────────────────────────── */
function BarChartSVG({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No data available.</p>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const W = 560, H = 220, PADX = 40, PADY = 20, BAR_GAP = 8;
  const barW = (W - PADX * 2 - BAR_GAP * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="1" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PADY + (H - PADY * 2) * (1 - pct / 100);
        return (
          <g key={pct}>
            <line x1={PADX} y1={y} x2={W - PADX} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4,4" />
            {pct > 0 && (
              <text x={PADX - 6} y={y + 4} textAnchor="end"
                fill="rgba(100,116,139,0.8)" fontSize="9">
                {Math.round(maxRevenue * pct / 100 / 1000)}k
              </text>
            )}
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(((d.revenue / maxRevenue) * (H - PADY * 2)), 4);
        const x = PADX + i * (barW + BAR_GAP);
        const y = PADY + (H - PADY * 2) - barH;

        return (
          <g key={i} style={{ cursor: 'pointer' }}>
            {/* Bar background */}
            <rect x={x} y={PADY} width={barW} height={H - PADY * 2}
              fill="rgba(255,255,255,0.02)" rx="4" />
            {/* Actual bar */}
            <rect x={x} y={y} width={barW} height={barH}
              fill="url(#barGrad)" rx="4" filter="url(#glow)"
              style={{ transition: 'all 0.3s ease' }} />
            {/* Value label */}
            <text x={x + barW / 2} y={y - 6} textAnchor="middle"
              fill="rgba(103,232,249,0.9)" fontSize="9" fontWeight="700">
              {d.revenue >= 1000 ? `₹${Math.round(d.revenue / 1000)}k` : `₹${d.revenue}`}
            </text>
            {/* Month label */}
            <text x={x + barW / 2} y={H + 15} textAnchor="middle"
              fill="rgba(148,163,184,0.9)" fontSize="10" fontWeight="600">
              {d.month}
            </text>
            {/* Booking count */}
            <text x={x + barW / 2} y={H + 28} textAnchor="middle"
              fill="rgba(100,116,139,0.7)" fontSize="8">
              {d.bookings} bkgs
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG Donut Chart ─────────────────────────────────────── */
function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No data available.</p>;
  }

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const R = 70, CX = 90, CY = 90, strokeW = 22;
  const circumference = 2 * Math.PI * R;
  let accumulated = 0;

  const segments = data.slice(0, 6).map((d, i) => {
    const pct = d.count / total;
    const offset = circumference * (1 - accumulated);
    const dash = circumference * pct;
    accumulated += pct;
    return { ...d, pct, offset, dash, color: COLORS[i] };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 180 180" width="160" height="160" style={{ flexShrink: 0 }}>
        <defs>
          {segments.map((s, i) => (
            <filter key={i} id={`glow-${i}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>
        {/* Background circle */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} />
        {/* Segments */}
        {segments.map((s, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={s.offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            filter={`url(#glow-${i})`}
            style={{ transition: 'all 0.5s ease' }}
          />
        ))}
        {/* Center text */}
        <text x={CX} y={CY - 8} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="9">bookings</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}` }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1, textTransform: 'capitalize' }}>{s._id || 'Unknown'}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{s.count}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '36px', textAlign: 'right' }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SVG Sparkline ───────────────────────────────────────── */
function SparkLine({ data, color = '#06b6d4' }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.revenue);
  const min = Math.min(...values);
  const max = Math.max(...values, 1);
  const W = 120, H = 36;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(' ');

  const trend = values[values.length - 1] > values[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke="url(#sparkGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {trend
        ? <ArrowUpRight size={14} color="#10b981" />
        : <ArrowDownRight size={14} color="#ef4444" />}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color, bgColor, trend, sparkData }) {
  return (
    <div className="glass" style={{
      padding: '20px',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${color}22`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: `radial-gradient(circle at top right, ${color}15, transparent)`, borderRadius: '0 var(--radius-lg) 0 80px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={20} />
        </div>
        {sparkData && sparkData.length > 1 && <SparkLine data={sparkData} color={color} />}
      </div>
      <div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginTop: '4px' }}>{value}</h3>
        {sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{sub}</span>}
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            {trend > 0
              ? <ArrowUpRight size={12} color="#10b981" />
              : <ArrowDownRight size={12} color="#ef4444" />}
            <span style={{ fontSize: '0.72rem', color: trend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {Math.abs(trend)}% vs last month
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AI Insight Card ─────────────────────────────────────── */
function AIInsight({ icon, title, desc, badge, color }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      background: `rgba(${color === 'cyan' ? '6,182,212' : color === 'violet' ? '139,92,246' : color === 'emerald' ? '16,185,129' : '245,158,11'},0.07)`,
      border: `1px solid rgba(${color === 'cyan' ? '6,182,212' : color === 'violet' ? '139,92,246' : color === 'emerald' ? '16,185,129' : '245,158,11'},0.2)`,
      display: 'flex', alignItems: 'flex-start', gap: '12px'
    }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{title}</span>
          {badge && <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{badge}</span>}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Main Dashboard Component ─────────────────────────────── */
export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [pricingSuggestions, setPricingSuggestions] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Add Venue Form state
  const [venueName, setVenueName] = useState('');
  const [venueDesc, setVenueDesc] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueArea, setVenueArea] = useState('Gomti Nagar');
  const [areaOptions, setAreaOptions] = useState([]);
  useEffect(() => {
    axios.get('/api/venues/meta').then(res => {
      if (res.data.success) setAreaOptions(res.data.data.areas);
    }).catch(() => {});
  }, []);
  const [venueLng, setVenueLng] = useState(80.9933);
  const [venueLat, setVenueLat] = useState(26.8554);
  const [venueOpen, setVenueOpen] = useState('06:00');
  const [venueClose, setVenueClose] = useState('23:00');
  const [venuePhone, setVenuePhone] = useState('');
  const [venueEmail, setVenueEmail] = useState('');
  const [venueImagesText, setVenueImagesText] = useState('');
  
  // Selected amenities
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  // Sports configuration list
  const [venueSports, setVenueSports] = useState([
    { name: 'badminton', courts: 2, pricePerHour: 300, maxPlayers: 4 }
  ]);
  
  const [newSportName, setNewSportName] = useState('badminton');
  const [newSportCourts, setNewSportCourts] = useState(1);
  const [newSportPrice, setNewSportPrice] = useState(300);
  const [newSportPlayers, setNewSportPlayers] = useState(4);
  
  const [submittingVenue, setSubmittingVenue] = useState(false);
  const [venueSuccessMsg, setVenueSuccessMsg] = useState(null);
  const [venueErrorMsg, setVenueErrorMsg] = useState(null);

  const handleAddSportConfig = () => {
    if (venueSports.some(s => s.name === newSportName)) {
      alert('This sport configuration is already added.');
      return;
    }
    setVenueSports([...venueSports, {
      name: newSportName,
      courts: newSportCourts,
      pricePerHour: newSportPrice,
      maxPlayers: newSportPlayers
    }]);
  };

  const handleRemoveSportConfig = (name) => {
    setVenueSports(venueSports.filter(s => s.name !== name));
  };

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddVenueSubmit = async (e) => {
    e.preventDefault();
    if (venueSports.length === 0) {
      setVenueErrorMsg('Please add at least one sport configuration to your venue.');
      return;
    }
    
    setSubmittingVenue(true);
    setVenueErrorMsg(null);
    setVenueSuccessMsg(null);
    
    const imageUrls = venueImagesText.split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);
      
    const payload = {
      name: venueName,
      description: venueDesc,
      address: venueAddress,
      area: venueArea,
      city: 'Lucknow',
      location: {
        type: 'Point',
        coordinates: [parseFloat(venueLng), parseFloat(venueLat)]
      },
      sports: venueSports,
      amenities: selectedAmenities,
      operatingHours: {
        open: venueOpen,
        close: venueClose
      },
      contactPhone: venuePhone,
      contactEmail: venueEmail,
      images: imageUrls
    };
    
    try {
      const res = await axios.post('/api/venues', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setVenueSuccessMsg('Venue added successfully! It will now appear on the explore map.');
        setVenueName('');
        setVenueDesc('');
        setVenueAddress('');
        setVenueArea('Gomti Nagar');
        setVenueLng(80.9933);
        setVenueLat(26.8554);
        setVenueOpen('06:00');
        setVenueClose('23:00');
        setVenuePhone('');
        setVenueEmail('');
        setVenueImagesText('');
        setSelectedAmenities([]);
        setVenueSports([{ name: 'badminton', courts: 2, pricePerHour: 300, maxPlayers: 4 }]);
        
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setVenueErrorMsg(err.response?.data?.message || 'Failed to create venue.');
    } finally {
      setSubmittingVenue(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data.recentBookings && res.data.data.recentBookings.length > 0) {
          const firstVenueId = res.data.data.recentBookings[0].venue?._id;
          if (firstVenueId) {
            setSelectedVenue(res.data.data.recentBookings[0].venue);
            fetchPricingSuggestions(firstVenueId);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Are you logged in as a Venue Owner?');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingSuggestions = async (venueId) => {
    setLoadingPricing(true);
    try {
      const res = await axios.get(`/api/ai/dynamic-pricing/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setPricingSuggestions(res.data.data);
    } catch (err) {
      console.error('Pricing error:', err);
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    const actionLabel = newStatus === 'confirmed' ? 'APPROVE' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this booking?`)) return;

    try {
      const res = await axios.put(
        `/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Refresh dashboard data to show correct revenues and status
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);


  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="uiverse-loader" style={{ marginBottom: '20px' }}>
            <svg viewBox="0 0 120 120">
              <circle className="dash" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-primary)" strokeWidth="8" strokeLinecap="round" />
              <circle className="spin" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-secondary)" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Aggregating revenue & booking analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div className="empty-state glass" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <BarChart3 size={48} color="var(--accent-danger)" />
          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginTop: '12px' }}>Access Restricted</h3>
          <p style={{ maxWidth: '400px', marginTop: '8px' }}>
            {error || 'This dashboard is reserved for verified venue managers and administrators.'}
          </p>
        </div>
      </div>
    );
  }

  const { overview, monthlyRevenue, sportBreakdown, recentBookings } = data;

  // Compute revenue growth trend
  const revTrend = monthlyRevenue.length >= 2
    ? Math.round(((monthlyRevenue[monthlyRevenue.length - 1]?.revenue - monthlyRevenue[monthlyRevenue.length - 2]?.revenue) /
      Math.max(monthlyRevenue[monthlyRevenue.length - 2]?.revenue, 1)) * 100)
    : 0;

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: BarChart3 },
    { id: 'revenue', label: '💰 Revenue', icon: TrendingUp },
    { id: 'sports', label: '🏅 Sports', icon: PieChart },
    { id: 'pricing', label: '🤖 AI Pricing', icon: Sparkles },
    { id: 'add_venue', label: '➕ Add Venue', icon: Plus },
  ];

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex-between" style={{ marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
            Owner <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Welcome back, <strong style={{ color: '#fff' }}>{user?.username}</strong> · Real-time venue analytics & AI-powered insights
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchDashboardData} className="btn btn-ghost flex-center gap-sm" style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            Live
          </span>
        </div>
      </div>

      {/* ── KPI Cards Grid ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 20vw, 220px), 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginBottom: '28px' }}>
        <StatCard icon={Layers} label="My Arenas" value={overview.totalVenues}
          sub="Active venues registered" color="#06b6d4" bgColor="rgba(6,182,212,0.1)" />
        <StatCard icon={DollarSign} label="Total Revenue"
          value={`₹${overview.totalRevenue >= 1000 ? (overview.totalRevenue / 1000).toFixed(1) + 'k' : overview.totalRevenue}`}
          sub="Confirmed + completed" color="#10b981" bgColor="rgba(16,185,129,0.1)"
          trend={revTrend} sparkData={monthlyRevenue} />
        <StatCard icon={Calendar} label="Total Bookings" value={overview.totalBookings}
          sub={`${overview.todayBookings} bookings today`} color="#8b5cf6" bgColor="rgba(139,92,246,0.1)" />
        <StatCard icon={Sparkles} label="AI Booked" value={`${overview.aiBookingPercentage}%`}
          sub={`${overview.aiBookings} via AI Copilot`} color="#ec4899" bgColor="rgba(236,72,153,0.1)" />
        <StatCard icon={Star} label="Avg Rating" value={overview.avgRating || '—'}
          sub="Across all venues" color="#f59e0b" bgColor="rgba(245,158,11,0.1)" />
        <StatCard icon={Activity} label="Today's Bookings" value={overview.todayBookings}
          sub="Pending + confirmed" color="#06b6d4" bgColor="rgba(6,182,212,0.08)" />
      </div>

      {/* ── Tab Navigation ────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '28px', overflowX: 'auto', paddingBottom: '1px' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
            padding: '10px 18px', fontSize: '0.85rem', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 40vw, 500px), 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: '28px' }}>
          {/* Quick Stats */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', gridColumn: '1 / -1' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: 'var(--accent-primary)' }} /> Platform Health
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 18vw, 160px), 1fr))', gap: 'clamp(12px, 2vw, 16px)' }}>
              {[
                { label: 'Booking Rate', value: `${overview.totalBookings > 0 ? Math.round((overview.totalBookings / (overview.totalVenues * 30)) * 100) : 0}%`, desc: 'Of capacity used', color: '#06b6d4' },
                { label: 'AI Efficiency', value: `${overview.aiBookingPercentage}%`, desc: 'Bookings via AI', color: '#8b5cf6' },
                { label: 'Avg Revenue/Venue', value: `₹${overview.totalVenues > 0 ? Math.round(overview.totalRevenue / overview.totalVenues) : 0}`, desc: 'Per venue', color: '#10b981' },
                { label: 'Avg Booking Value', value: `₹${overview.totalBookings > 0 ? Math.round(overview.totalRevenue / overview.totalBookings) : 0}`, desc: 'Per booking', color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: `1px solid ${item.color}22` }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sport Breakdown preview */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={16} style={{ color: 'var(--accent-tertiary)' }} /> Sport Mix
            </h3>
            <DonutChart data={sportBreakdown} />
          </div>

          {/* AI Insights */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-pink)' }} /> AI Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AIInsight icon="📈" title="Weekend Surge" badge="AI" color="cyan"
                desc={`Bookings typically spike 40% on weekends. Enable dynamic pricing to capture ${overview.aiBookingPercentage < 50 ? 'more' : 'maximum'} revenue.`} />
              <AIInsight icon="⚡" title="Peak Hours Alert" color="violet"
                desc="Your 5–9 PM slots have the highest demand. Consider raising peak prices by 20–30% to maximize yield." />
              <AIInsight icon="🌙" title="Off-Peak Opportunity" color="emerald"
                desc="Morning slots (6–10 AM) have low utilization. A 15% discount could boost bookings by 35%." />
              {overview.aiBookingPercentage < 40 && (
                <AIInsight icon="🤖" title="AI Adoption Gap" badge="Action" color="amber"
                  desc="Only a fraction of bookings come from AI. Promote your venue's AI copilot link to customers." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Revenue Tab ───────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
          <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} style={{ color: 'var(--accent-secondary)' }} /> Monthly Revenue — Last 6 Months
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>Confirmed + completed bookings only</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{overview.totalRevenue >= 1000 ? (overview.totalRevenue / 1000).toFixed(1) + 'k' : overview.totalRevenue}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total all-time revenue</div>
                {revTrend !== 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    {revTrend > 0 ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
                    <span style={{ fontSize: '0.78rem', color: revTrend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{Math.abs(revTrend)}% MoM</span>
                  </div>
                )}
              </div>
            </div>
            <BarChartSVG data={monthlyRevenue} />
          </div>

          {/* Monthly breakdown table */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Monthly Breakdown</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Month', 'Revenue', 'Bookings', 'Avg/Booking', 'Share'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyRevenue.map((m, i) => {
                    const totalRev = monthlyRevenue.reduce((s, r) => s + r.revenue, 0) || 1;
                    const share = Math.round((m.revenue / totalRev) * 100);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#fff' }}>{m.month}</td>
                        <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 700 }}>₹{m.revenue.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{m.bookings}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>₹{m.bookings > 0 ? Math.round(m.revenue / m.bookings) : 0}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${share}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '30px' }}>{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Sports Tab ────────────────────────────────── */}
      {activeTab === 'sports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 40vw, 500px), 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={16} style={{ color: 'var(--accent-tertiary)' }} /> Sport Distribution
              </h3>
              <DonutChart data={sportBreakdown} />
            </div>
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>🏆 Top Performing Sports</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {sportBreakdown.slice(0, 6).map((s, i) => {
                  const maxCount = sportBreakdown[0]?.count || 1;
                  const pct = Math.round((s.count / maxCount) * 100);
                  const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>
                          {i === 0 && '🥇 '}{i === 1 && '🥈 '}{i === 2 && '🥉 '}{s._id}
                        </span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.count} bkgs</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: colors[i] }}>₹{s.revenue?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: '4px', boxShadow: `0 0 8px ${colors[i]}60`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Pricing Tab ────────────────────────────── */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-pink)' }} /> AI Dynamic Pricing Recommendations
              </h3>
              {loadingPricing && <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />}
            </div>

            <div style={{ padding: '14px 16px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                🤖 <strong style={{ color: '#fff' }}>AI Pricing Engine</strong>: Demand analysis shows weekend peaks. Implementing dynamic pricing can increase revenue by up to <strong style={{ color: '#10b981' }}>25%</strong> while maintaining {'>'}85% occupancy.
              </p>
            </div>

            {!selectedVenue ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>No active venues found.</p>
            ) : pricingSuggestions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>Loading pricing suggestions...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {pricingSuggestions.map((suggestion, idx) => (
                  <div key={idx} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', textTransform: 'uppercase' }}>{suggestion.sport}</span>
                        <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base: ₹{suggestion.basePrice}/hr</span>
                      </div>
                      <span className={`badge badge-${suggestion.demandLevel === 'high' ? 'emerald' : suggestion.demandLevel === 'medium' ? 'cyan' : 'ghost'}`}>
                        {suggestion.demandLevel} demand
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 18vw, 140px), 1fr))', gap: '12px' }}>
                      {[
                        { label: '🌅 Peak Hours', sub: '5–9 PM', price: suggestion.suggestedPricing?.peakHours?.price, color: '#f59e0b' },
                        { label: '🌙 Off-Peak', sub: '6 AM–12 PM', price: suggestion.suggestedPricing?.offPeakHours?.price, color: '#10b981' },
                        { label: '🎉 Weekend', sub: 'Sat & Sun', price: suggestion.suggestedPricing?.weekendSurcharge?.price, color: '#ec4899' },
                        { label: '☔ Rainy Day', sub: 'Weather disc.', price: suggestion.suggestedPricing?.rainyDay?.price, color: '#8b5cf6' },
                      ].map((item, j) => (
                        <div key={j} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${item.color}22`, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.label}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.sub}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>₹{item.price || '—'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/hr</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Venue Tab ──────────────────────────────── */}
      {activeTab === 'add_venue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
          <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--accent-primary)' }} /> Register New Sports Venue
            </h3>

            {venueSuccessMsg && (
              <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem' }}>
                {venueSuccessMsg}
              </div>
            )}

            {venueErrorMsg && (
              <div className="alert alert-danger" style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem' }}>
                {venueErrorMsg}
              </div>
            )}

            <form onSubmit={handleAddVenueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Row 1: Venue Name & Area */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 25vw, 240px), 1fr))', gap: 'clamp(16px, 2vw, 20px)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Venue Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gomti Arena Turf"
                    className="form-input"
                    value={venueName}
                    onChange={e => setVenueName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lucknow Area</label>
                  <select
                    className="form-select"
                    value={venueArea}
                    onChange={e => setVenueArea(e.target.value)}
                  >
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Address */}
              <div className="form-group">
                <label className="form-label">Full Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 8, Near Central Park, Gomti Nagar"
                  className="form-input"
                  value={venueAddress}
                  onChange={e => setVenueAddress(e.target.value)}
                />
              </div>

              {/* Row 3: Description */}
              <div className="form-group">
                <label className="form-label">Description / Bio</label>
                <textarea
                  placeholder="Tell athletes about your courts, pitch condition, features..."
                  className="form-input"
                  rows="3"
                  value={venueDesc}
                  onChange={e => setVenueDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Row 4: Coordinates (Longitude & Latitude) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 40vw, 500px), 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Latitude (e.g. 26.8554)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    placeholder="26.8554"
                    className="form-input"
                    value={venueLat}
                    onChange={e => setVenueLat(parseFloat(e.target.value) || '')}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Longitude (e.g. 80.9933)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    placeholder="80.9933"
                    className="form-input"
                    value={venueLng}
                    onChange={e => setVenueLng(parseFloat(e.target.value) || '')}
                  />
                </div>
              </div>

              {/* Row 5: Dynamic Sports Configuration Panel */}
              <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>🏅 Configure Sports Fields</h4>
                
                {/* Sports List preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {venueSports.map((sport) => (
                    <div key={sport.name} className="flex-between" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <strong style={{ textTransform: 'capitalize', color: 'var(--accent-primary)' }}>{sport.name}</strong> · {sport.courts} Court(s) · ₹{sport.pricePerHour}/hr · Max {sport.maxPlayers} players
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSportConfig(sport.name)}
                        className="btn btn-ghost btn-xs"
                        style={{ color: 'var(--accent-danger)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add dynamic sport form row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'clamp(auto, 1fr, 2fr) clamp(auto, 1fr, 1fr) clamp(auto, 1fr, 1fr) clamp(auto, 1fr, 1fr) auto', gap: 'clamp(8px, 2vw, 10px)', alignItems: 'end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sport</label>
                    <select
                      className="form-select"
                      value={newSportName}
                      onChange={e => setNewSportName(e.target.value)}
                      style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                    >
                      {['football', 'cricket', 'badminton', 'tennis', 'basketball', 'swimming', 'table-tennis', 'volleyball', 'squash', 'gym'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Courts</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={newSportCourts}
                      onChange={e => setNewSportCourts(parseInt(e.target.value) || 1)}
                      style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Price/hr</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={newSportPrice}
                      onChange={e => setNewSportPrice(parseInt(e.target.value) || 0)}
                      style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Max Players</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={newSportPlayers}
                      onChange={e => setNewSportPlayers(parseInt(e.target.value) || 1)}
                      style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSportConfig}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '10px 14px' }}
                  >
                    Add Sport
                  </button>
                </div>
              </div>

              {/* Row 6: Amenities Checklist */}
              <div className="form-group">
                <label className="form-label">Available Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '6px' }}>
                  {[
                    { id: 'parking', label: '🚗 Free Parking' },
                    { id: 'changing-rooms', label: '👕 Changing Rooms' },
                    { id: 'showers', label: '🚿 Hot Showers' },
                    { id: 'cafeteria', label: '☕ Cafeteria' },
                    { id: 'first-aid', label: '🏥 First Aid Kit' },
                    { id: 'wifi', label: '📶 High-Speed WiFi' },
                    { id: 'floodlights', label: '💡 Night Floodlights' },
                    { id: 'coaching', label: '🎓 Personal Coaching' },
                    { id: 'equipment-rental', label: '🏸 Equipment Rental' },
                    { id: 'drinking-water', label: '💧 Purified Water' },
                    { id: 'seating-area', label: '🛋️ Seating Lounge' },
                    { id: 'ac', label: '❄️ Air Conditioned' },
                  ].map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity.id);
                    return (
                      <label
                        key={amenity.id}
                        className="flex-center"
                        style={{
                          justifyContent: 'flex-start',
                          gap: '8px',
                          padding: '10px',
                          background: isChecked ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.01)',
                          border: isChecked ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(255,255,255,0.04)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: isChecked ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAmenityToggle(amenity.id)}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        <span>{amenity.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Row 7: Schedule Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Operating Hours Open (e.g. 06:00)</label>
                  <input
                    type="text"
                    required
                    placeholder="06:00"
                    className="form-input"
                    value={venueOpen}
                    onChange={e => setVenueOpen(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Operating Hours Close (e.g. 23:00)</label>
                  <input
                    type="text"
                    required
                    placeholder="23:00"
                    className="form-input"
                    value={venueClose}
                    onChange={e => setVenueClose(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 8: Contact Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876540001"
                    className="form-input"
                    value={venuePhone}
                    onChange={e => setVenuePhone(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. gomtisports@playsphere.in"
                    className="form-input"
                    value={venueEmail}
                    onChange={e => setVenueEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 9: Image URLs */}
              <div className="form-group">
                <label className="form-label">Image URLs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. https://image1.jpg, https://image2.jpg"
                  className="form-input"
                  value={venueImagesText}
                  onChange={e => setVenueImagesText(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Provide absolute image links. Leave empty to auto-assign a professional sport graphic fallback.</span>
              </div>

              <button
                type="submit"
                disabled={submittingVenue}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
              >
                {submittingVenue ? 'Registering Venue...' : 'Register Venue'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ── Recent Bookings Table ─────────────────────── */}
      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--accent-primary)' }} /> Recent Bookings
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{recentBookings.length} of latest</span>
        </div>

        {recentBookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px 0' }}>No bookings received yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['User', 'Venue', 'Sport', 'Date & Time', 'Status', 'Amount', 'Source', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const bDate = new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)', fontSize: '0.84rem', transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '13px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>@{booking.user?.username || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{booking.user?.email}</div>
                      </td>
                      <td style={{ padding: '13px 12px', color: 'var(--text-secondary)', maxWidth: '140px' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{booking.venue?.name || '—'}</span>
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{booking.sport}</span>
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        <div style={{ color: '#fff' }}>{bDate}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{booking.startTime} — {booking.endTime}</div>
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        <span className={`badge ${booking.status === 'confirmed' ? 'badge-emerald' : booking.status === 'completed' ? 'badge-cyan' : booking.status === 'cancelled' ? 'badge-red' : 'badge-ghost'}`} style={{ fontSize: '0.68rem' }}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 12px', fontWeight: 700, color: '#fff' }}>₹{booking.totalPrice}</td>
                      <td style={{ padding: '13px 12px' }}>
                        {booking.isAgentBooked
                          ? <span style={{ fontSize: '0.72rem', color: '#ec4899', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} /> AI</span>
                          : <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manual</span>}
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking._id, 'confirmed'); }}
                                className="btn btn-emerald btn-xs"
                                style={{ cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking._id, 'cancelled'); }}
                                className="btn btn-danger btn-xs"
                                style={{ cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>Approved</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking._id, 'cancelled'); }}
                                className="btn btn-danger btn-xs"
                                style={{ cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {booking.status === 'cancelled' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rejected</span>
                          )}
                          {booking.status === 'completed' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      ` }} />
    </div>
  );
}
