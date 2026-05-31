import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Linkedin, Mail, Heart, ExternalLink, Shield, Zap, Globe } from 'lucide-react';

const SPORTS = ['⚽ Football', '🏏 Cricket', '🏸 Badminton', '🎾 Tennis', '🏀 Basketball', '🏊 Swimming', '🏋️ Gym'];

const LINKS = {
  platform: [
    { label: 'Explore Venues', to: '/explore' },
    { label: 'Book a Court', to: '/explore' },
    { label: 'AI Copilot', to: '/explore' },
    { label: 'Venue Dashboard', to: '/dashboard' },
    { label: 'My Bookings', to: '/bookings' },
  ],
  company: [
    { label: 'About PlaySphere', href: '#' },
    { label: 'How It Works', href: '#' },
    { label: 'Partner With Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press Kit', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ],
};

const STATS = [
  { value: '15+', label: 'Venues', color: '#06b6d4' },
  { value: '5+', label: 'Sports', color: '#8b5cf6' },
  { value: '100%', label: 'AI Powered', color: '#10b981' },
  { value: '0ms', label: 'Booking Lag', color: '#f59e0b' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(180deg, var(--bg-primary) 0%, #060912 100%)',
      borderTop: '1px solid rgba(99,179,237,0.1)',
      marginTop: 'auto',
    }}>
      {/* ── Top Stats Banner ─────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(6,182,212,0.03)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: 'clamp(14px, 3vh, 20px) clamp(16px, 4vw, 24px)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(80px, 20vw, 150px), 1fr))', gap: 'clamp(12px, 2vw, 16px)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Footer Content ───────────────────── */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: 'clamp(32px, 8vh, 52px) clamp(16px, 4vw, 24px) clamp(24px, 5vh, 36px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 30vw, 280px), 1fr))',
        gap: 'clamp(32px, 6vw, 48px)',
      }}>
        {/* Brand Column */}
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: 'clamp(32px, 6vw, 38px)', height: 'clamp(32px, 6vw, 38px)',
              minWidth: '32px',
              minHeight: '32px',
              background: 'var(--gradient-primary)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-cyan)',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 800, color: '#fff' }}>
              Play<span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sphere</span>
            </span>
          </Link>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 1.5vw, 0.88rem)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '280px' }}>
            India's first <strong style={{ color: '#fff' }}>Agentic AI</strong> sports infrastructure discovery and booking platform. Find, compare, and book courts with one natural language command.
          </p>

          {/* Sports tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
            {SPORTS.map((s, i) => (
              <span key={i} style={{
                fontSize: 'clamp(0.65rem, 1vw, 0.72rem)', padding: '3px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 'var(--radius-full)', color: 'var(--text-muted)',
              }}>{s}</span>
            ))}
          </div>

          {/* Social Icons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { Icon: Github, href: 'https://github.com', label: 'GitHub' },
              { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
              { Icon: Mail, href: 'mailto:hello@playsphere.in', label: 'Email' },
            ].map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                aria-label={label}
                style={{
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(6,182,212,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)';
                  e.currentTarget.style.color = '#06b6d4';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Platform Links */}
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>
            Platform
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {LINKS.platform.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} style={{
                  fontSize: '0.87rem', color: 'var(--text-secondary)',
                  transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>
            Company
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {LINKS.company.map(({ label, href }) => (
              <li key={label}>
                <a href={href} style={{
                  fontSize: '0.87rem', color: 'var(--text-secondary)',
                  transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal + Contact */}
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>
            Legal
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {LINKS.legal.map(({ label, href }) => (
              <li key={label}>
                <a href={href} style={{
                  fontSize: '0.87rem', color: 'var(--text-secondary)',
                  transition: 'color 0.2s ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Contact card */}
          <div style={{
            padding: '14px 16px',
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.15)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} /> Contact Us
            </div>
            <a href="mailto:hello@playsphere.in" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              hello@playsphere.in
            </a>
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={11} /> Lucknow, India 🇮🇳
            </div>
          </div>
        </div>
      </div>

      {/* ── Features Bar ─────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '16px 24px',
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '28px',
        }}>
          {[
            { Icon: Zap, text: 'Real-Time Booking', color: '#f59e0b' },
            { Icon: Shield, text: 'JWT Secured Auth', color: '#10b981' },
            { Icon: Sparkles, text: 'AI Copilot Powered', color: '#8b5cf6' },
            { Icon: Globe, text: 'Geospatial Search', color: '#06b6d4' },
          ].map(({ Icon, text, color }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <Icon size={14} style={{ color }} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            © {year} <strong style={{ color: 'var(--text-secondary)' }}>PlaySphere</strong>. All rights reserved.
            Built for the <strong style={{ color: 'var(--accent-primary)' }}>Agentic Premier League</strong> Hackathon.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Made with <Heart size={12} style={{ color: '#ec4899', fill: '#ec4899' }} /> in India · Where AI Meets the Arena 🏟️
          </p>
        </div>
      </div>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          footer > div:nth-child(2) > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          footer > div:nth-child(2) > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      ` }} />
    </footer>
  );
}
