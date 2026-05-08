import React from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

export default function Profile() {
  const { session } = useAuth();
  const user = session?.user;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
  };

  return (
    <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: 'min(32px, 8vw)', 
          fontFamily: 'var(--font-display)', 
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          marginBottom: '8px'
        }}>
          User <span style={{ color: 'var(--accent)' }}>Profile</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Manage your account settings and preferences.
        </p>
      </header>

      <div className="card" style={{ padding: 'min(32px, 5vw)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'var(--accent-dim)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: '800',
            color: 'var(--accent)',
            boxShadow: '0 0 20px rgba(232,255,71,0.2)'
          }}>
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Athlete
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {user?.email}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Account ID</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{user?.id}</div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Member Since</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{new Date(user?.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSignOut}
            style={{
              padding: '12px 24px',
              background: 'rgba(225, 29, 72, 0.1)',
              border: '1px solid #e11d48',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              flex: '1 1 150px'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'; e.currentTarget.style.color = '#fb7185'; }}
          >
            Sign Out
          </button>
          
          <button
            disabled
            style={{
              padding: '12px 24px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'not-allowed',
              flex: '1 1 150px'
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
