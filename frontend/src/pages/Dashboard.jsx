import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { BarChart3, TrendingUp, Calendar, ShieldCheck, DollarSign, Star, Sparkles, HelpCircle, Loader, RefreshCw, Layers } from 'lucide-react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic Pricing Recommendation States
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [pricingSuggestions, setPricingSuggestions] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
        // Set first venue for dynamic pricing suggestions
        if (res.data.data.recentBookings && res.data.data.recentBookings.length > 0) {
          // If we have recent bookings, retrieve venue IDs
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
      if (res.data.success) {
        setPricingSuggestions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching pricing suggestions:', err);
    } finally {
      setLoadingPricing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} className="spin text-gradient" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Aggregating business revenue & booking statistics...</p>
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

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* Title */}
      <div className="flex-between" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
            Owner <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Track bookings, revenue charts, and AI pricing optimizations for your club.
          </p>
        </div>

        <button onClick={fetchDashboardData} className="btn btn-ghost flex-center gap-sm">
          <RefreshCw size={16} /> Refresh Stats
        </button>
      </div>

      {/* Grid of Stats */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        {/* Venues */}
        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-primary)' }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>My Arenas</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{overview.totalVenues}</h3>
          </div>
        </div>

        {/* Revenue */}
        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-secondary)' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Earnings</span>
            <h3 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{overview.totalRevenue}</h3>
          </div>
        </div>

        {/* Bookings */}
        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-tertiary)' }}>
            <Calendar size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Bookings</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{overview.totalBookings}</h3>
          </div>
        </div>

        {/* AI Booking conversion */}
        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Booked Share</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{overview.aiBookingPercentage}%</h3>
          </div>
        </div>
      </div>

      {/* Main Charts & Pricing Section split */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* Left Card: Monthly Revenue chart mock */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="flex-center gap-sm" style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>
            <TrendingUp size={18} className="text-gradient" /> Monthly Revenue Trend (Last 6 Months)
          </h3>

          {monthlyRevenue.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>No transaction history found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {monthlyRevenue.map((m, idx) => {
                // Find percentage for css width bar
                const maxRevenue = Math.max(...monthlyRevenue.map(r => r.revenue)) || 1;
                const percent = Math.round((m.revenue / maxRevenue) * 100);

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ width: '40px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{m.month}</span>
                    <div style={{ flexGrow: 1, height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '7px', boxShadow: 'var(--glow-cyan)' }}></div>
                    </div>
                    <span style={{ width: '70px', textAlign: 'right', fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>₹{m.revenue}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Card: AI Pricing Agent Suggestions */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 className="flex-center gap-sm" style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
              <Sparkles size={18} className="text-gradient" /> AI Dynamic Pricing Recommendations
            </h3>
            {loadingPricing && <Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
          </div>

          {!selectedVenue ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>No active venues registered.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass" style={{ padding: '12px 16px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  🤖 **AI Suggestion Engine**: Bookings are projected to peak this weekend. Adjusting to dynamic pricing maximizes court occupancy and increases yields by up to 25%.
                </p>
              </div>

              {pricingSuggestions.map((suggestion, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-accent)' }}>
                      {suggestion.sport.toUpperCase()} (Base: ₹{suggestion.basePrice}/hr)
                    </span>
                    <span className="badge badge-cyan">Demand: {suggestion.demandLevel}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Peak Hours (5-9 PM)</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-warning)', marginTop: '2px' }}>₹{suggestion.suggestedPricing.peakHours.price}/hr</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Off Peak (6-12 AM)</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '2px' }}>₹{suggestion.suggestedPricing.offPeakHours.price}/hr</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Weekend Price</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-pink)', marginTop: '2px' }}>₹{suggestion.suggestedPricing.weekendSurcharge.price}/hr</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Grid list */}
      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
          📅 Recent Venue Bookings
        </h3>

        {recentBookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px 0' }}>No bookings received yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>USER</th>
                  <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENUE</th>
                  <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SPORT</th>
                  <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE & TIME</th>
                  <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const bDate = new Date(booking.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }} className="table-row-hover">
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>@{booking.user?.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.user?.email}</div>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{booking.venue?.name}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{booking.sport}</span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div>{bDate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.startTime} — {booking.endTime}</div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className={`badge ${
                          booking.status === 'confirmed' 
                            ? 'badge-emerald' 
                            : booking.status === 'completed' 
                              ? 'badge-cyan' 
                              : 'badge-red'
                        }`} style={{ fontSize: '0.7rem' }}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: 700, color: '#fff' }}>₹{booking.totalPrice}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.01);
        }
      `}} />
    </div>
  );
}
