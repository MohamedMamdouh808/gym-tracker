import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'weight', label: 'Weight', icon: '◈' },
  { id: 'meals', label: 'Meals', icon: '◉' },
  { id: 'workout-plan', label: 'Workout Plan', icon: '◫' },
  { id: 'workout-log', label: 'Workout Log', icon: '◪' },
  { id: 'progress', label: 'Progress', icon: '◬' },
  { id: 'calculators', label: 'Calculators', icon: '⚡' },
  { id: 'inbody', label: 'InBody Scan', icon: '📷' },
  { id: 'ai-coach', label: 'AI Coach', icon: '✨' },
];

export default function Sidebar({ activePage, onNavigate, isOpen }) {
  return (
    <aside 
      className={`sidebar ${isOpen ? 'active' : ''}`}
      style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 24px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
          GYM<span style={{ color: 'var(--accent)' }}>TRACKER</span>
        </div>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase' }}>
          AI Fitness System
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '4px',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: isActive ? '1px solid rgba(232,255,71,0.2)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
                transition: 'all 0.15s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <span style={{ fontSize: '16px', opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => onNavigate('profile')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: activePage === 'profile' ? 'var(--accent-dim)' : 'transparent',
            border: activePage === 'profile' ? '1px solid rgba(232,255,71,0.2)' : '1px solid transparent',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (activePage !== 'profile') e.currentTarget.style.background = 'var(--bg-elevated)'; }}
          onMouseLeave={e => { if (activePage !== 'profile') e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontSize: '16px', fontWeight: '800'
          }}>A</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Athlete</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>View Profile</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
