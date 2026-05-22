import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Map, TrendingUp, Users, Award, ShieldCheck, Activity, ArrowRight, Play } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import FeatureCard from '../components/FeatureCard';

export default function Home() {
  const [stats, setStats] = useState({
    totalVenues: 15,
    totalBookings: 30,
    totalUsers: 5,
    totalSports: 5
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/analytics/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="hero-bg" style={{
        padding: '120px 0 100px 0',
        background: 'var(--gradient-hero)',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Animated ambient glow circles in hero background */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'rgba(6, 182, 212, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          width: '280px',
          height: '280px',
          background: 'rgba(139, 92, 246, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          animation: 'float 6s ease-in-out infinite 2s'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Tagline Badge */}
            <div className="flex-center animate-fade-in" style={{ justifyContent: 'center' }}>
              <div className="glass flex-center gap-sm" style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: 'var(--glow-cyan)'
              }}>
                <Sparkles size={14} className="animate-float" />
                <span>AI-Powered Venue Booking Platform</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="animate-fade-in delay-1" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#fff'
            }}>
              Your Intelligent <span className="text-gradient">Sports Copilot</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in delay-2" style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'var(--text-secondary)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Discover premium fields, turfs, and courts. Check real-time availability on interactive maps, get smart recommendations, and book instantly in seconds.
            </p>

            {/* CTAs */}
            <div className="flex-center gap-md animate-fade-in delay-3" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
              <Link to="/explore" className="btn btn-primary btn-lg">
                Explore Venues <ArrowRight size={18} />
              </Link>
              <Link to="/auth" className="btn btn-ghost btn-lg">
                Join PlaySphere
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{
        padding: '60px 0',
        background: 'rgba(5, 7, 13, 0.95)',
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div className="container">
          <div className="grid-4">
            <StatsCard icon={Map} value={`${stats.totalVenues}`} label="Venues Available" description="Top-rated arenas in Lucknow" />
            <StatsCard icon={Award} value={`${stats.totalSports}`} label="Sports Supported" description="Cricket, football, badminton & more" />
            <StatsCard icon={TrendingUp} value={`${stats.totalBookings}`} label="Court Bookings" description="Seamless slot reservations" />
            <StatsCard icon={Users} value={`${stats.totalUsers}`} label="Active Athletes" description="Vibrant sports community" />
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="section" style={{ background: 'var(--bg-secondary)', position: 'relative' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title">Revolutionizing Sports Booking</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              We combine geospatial intelligence with natural language processing to make finding games friction-free.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid-3">
            <FeatureCard 
              icon={Sparkles} 
              title="AI Sports Copilot" 
              description="A conversational AI assistant that understands natural language queries, performs smart context-aware slot lookup, and books courts instantly."
              badge="Agentic"
            />
            <FeatureCard 
              icon={Map} 
              title="Interactive Map Discovery" 
              description="Browse sports arenas on a custom dark mode map with active density overlays, precise area-wise tagging, and one-click slot calendars."
              badge="Geospatial"
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Smart Demand Adjustments" 
              description="Suggests dynamic peak hour pricing, rainy day discounts, and venue-wise predictions using aggregated analytics for court optimization."
              badge="Predictive"
            />
          </div>
        </div>
      </section>

      {/* Info Guide Section */}
      <section className="section" style={{ background: 'var(--bg-primary)', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Left Image Block */}
            <div className="glass" style={{
              height: '350px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--glow-cyan)'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80" 
                alt="Badminton court interior" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(10, 14, 26, 0.95), transparent)'
              }} />
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
                <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Hackathon Launch</span>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff' }}>
                  Built for Lucknow Sports
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Seeded with 15+ real locations across Hazratganj, Gomti Nagar, Indira Nagar, and Aliganj.
                </p>
              </div>
            </div>

            {/* Right Text Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <ShieldCheck size={18} /> TRUSTED BY VENUE MANAGERS
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                Premium Venue Dashboard For Business Owners
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Are you a sports club manager or turf owner? Join PlaySphere as a Venue Owner to unlock state-of-the-art administrative portals, dynamic revenue tracking charts, automated peak hour demand predictions, and customer review dashboards.
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <Link to="/auth" className="btn btn-secondary">
                  Register as Manager
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderTop: '1px solid var(--glass-border)',
        textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>Ready to Enter the Arena?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Join thousands of players matching, discovery, and booking courts seamlessly every day. Try out our AI Sports Copilot today!
            </p>
            <div className="flex-center" style={{ justifyContent: 'center', marginTop: '10px' }}>
              <Link to="/explore" className="btn btn-primary btn-lg">
                Find Nearby Courts <Play size={14} style={{ fill: 'currentColor' }} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
