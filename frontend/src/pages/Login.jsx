import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabaseClient';

export default function Login() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '30vw',
        height: '30vw',
        background: 'radial-gradient(circle, rgba(46,213,255,0.05) 0%, transparent 70%)',
        zIndex: 0
      }} />

      <div className="card" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '40px',
        zIndex: 1,
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="section-title" style={{ fontSize: '42px', marginBottom: '8px' }}>GYMTRACKER AI</h1>
          <p className="section-subtitle">YOUR ELITE TRAINING COMPANION</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'var(--accent)',
                  brandAccent: 'var(--accent)',
                  inputBackground: 'var(--bg-elevated)',
                  inputText: 'var(--text-primary)',
                  inputBorder: 'var(--border)',
                  inputBorderFocus: 'var(--accent)',
                  inputPlaceholder: 'var(--text-muted)',
                },
                radii: {
                  borderRadiusButton: 'var(--radius-sm)',
                  buttonBorderRadius: 'var(--radius-sm)',
                  inputBorderRadius: 'var(--radius-sm)',
                },
                fonts: {
                  bodyFontFamily: 'var(--font-body)',
                  buttonFontFamily: 'var(--font-body)',
                  inputFontFamily: 'var(--font-body)',
                  labelFontFamily: 'var(--font-body)',
                },
              }
            },
            className: {
              button: 'btn',
              input: 'input',
              label: 'input-label',
            }
          }}
          providers={['google', 'github']}
          theme="dark"
        />

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          &copy; 2026 GYMTRACKER PRO • ELITE EDITION
        </div>
      </div>
    </div>
  );
}
