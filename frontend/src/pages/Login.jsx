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
      background: '#f4f4f5' // Light theme to match GymTracker
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '30px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#18181b' }}>GymTracker AI</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#71717a' }}>Sign in to start tracking</p>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          theme="light"
        />
      </div>
    </div>
  );
}
