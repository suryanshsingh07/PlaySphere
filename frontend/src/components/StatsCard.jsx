import React from 'react';

export default function StatsCard({ icon: Icon, value, label, description }) {
  return (
    <div 
      className="glass stats-card-wrapper"
      style={{
        padding: 'clamp(16px, 4vw, 24px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        transition: 'transform var(--transition-base), border-color var(--transition-base)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Icon Wrapper */}
      <div 
        className="flex-center"
        style={{
          width: 'clamp(44px, 8vw, 56px)',
          height: 'clamp(44px, 8vw, 56px)',
          minWidth: '44px',
          minHeight: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(6, 182, 212, 0.08)',
          color: 'var(--accent-primary)',
          boxShadow: 'inset 0 0 12px rgba(6, 182, 212, 0.1)',
          marginBottom: '4px'
        }}
      >
        {Icon && <Icon size={24} />}
      </div>

      {/* Value */}
      <div 
        className="text-gradient"
        style={{
          fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          animation: 'countUp 0.8s ease'
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
          {label}
        </h4>
        {description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            {description}
          </p>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .stats-card-wrapper:hover {
          transform: translateY(-4px);
          border-color: var(--glass-border-hover);
        }
      `}} />
    </div>
  );
}
