import React from 'react';

export default function FeatureCard({ icon: Icon, title, description, badge = '' }) {
  return (
    <div 
      className="glass feature-card-wrapper"
      style={{
        padding: '32px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all var(--transition-base)',
        height: '100%'
      }}
    >
      {badge && (
        <span 
          className="badge badge-cyan" 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            fontSize: '0.65rem', 
            padding: '2px 8px' 
          }}
        >
          {badge}
        </span>
      )}

      {/* Icon */}
      <div 
        className="flex-center" 
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
          color: 'var(--accent-primary)',
          boxShadow: 'var(--glow-cyan)'
        }}
      >
        {Icon && <Icon size={22} />}
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          color: '#fff' 
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)', 
          lineHeight: '1.5' 
        }}>
          {description}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .feature-card-wrapper::after {
          content: '';
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(6, 182, 212, 0.05);
          filter: blur(20px);
          border-radius: 50%;
          bottom: -40px;
          right: -40px;
          transition: all var(--transition-base);
        }
        .feature-card-wrapper:hover {
          transform: translateY(-5px);
          border-color: var(--glass-border-hover);
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.15);
        }
        .feature-card-wrapper:hover::after {
          background: rgba(6, 182, 212, 0.12);
          width: 120px;
          height: 120px;
        }
      `}} />
    </div>
  );
}
