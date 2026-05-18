import React from 'react';
import { 
  LayoutDashboard, Scale, UtensilsCrossed, CalendarDays, 
  ClipboardList, TrendingUp, Calculator, ScanLine, Sparkles
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'workout-plan', label: 'Workout Plan', icon: CalendarDays },
  { id: 'workout-log', label: 'Workout Log', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'calculators', label: 'Calculators', icon: Calculator },
  { id: 'inbody', label: 'InBody Scan', icon: ScanLine },
  { id: 'ai-coach', label: 'AI Coach', icon: Sparkles },
];

export default function Sidebar({ activePage, onNavigate, isOpen }) {
  const { displayName, avatarLetter } = useProfile();
  const letter = avatarLetter || displayName?.[0] || 'A';
  const name = displayName || 'Athlete';

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
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div style={{ padding: '24px 24px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
          GYM<span style={{ color: 'var(--accent)' }}>TRACKER</span>
        </div>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase' }}>
          AI Fitness System
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navItems.map(item => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
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
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} style={{ opacity: isActive ? 1 : 0.6 }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
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
            color: 'var(--accent)', fontSize: '16px', fontWeight: '800',
            textTransform: 'uppercase'
          }}>{letter}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>View Profile</div>
          </div>
        </button>
      </div>
    </aside>
  );
}