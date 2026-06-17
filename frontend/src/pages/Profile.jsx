import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../utils/supabaseClient';
import { profileAPI } from '../utils/api';
import { Flame, Trophy, Medal, Award, Dumbbell } from 'lucide-react';

export default function Profile() {
  const { session } = useAuth();
  const { setDisplayName, setAvatarLetter, updateSettings, formatWeight, weightUnit } = useProfile();
  const user = session?.user;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [stats, setStats] = useState(null);

  const [profileData, setProfileData] = useState({
    display_name: '',
    goal: '',
    bio: '',
    unit_preference: 'metric',
    privacy_public: false,
    ai_persona: 'friendly'
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        profileAPI.get().catch(() => ({ data: null })),
        profileAPI.getStats().catch(() => ({ data: null }))
      ]);

      if (profileRes.data) {
        setProfileData({
          display_name: profileRes.data.display_name || '',
          goal: profileRes.data.goal || '',
          bio: profileRes.data.bio || '',
          unit_preference: profileRes.data.unit_preference || 'metric',
          privacy_public: !!profileRes.data.privacy_public,
          ai_persona: profileRes.data.ai_persona || 'friendly'
        });
        if (profileRes.data.display_name) {
          setDisplayName(profileRes.data.display_name);
          setAvatarLetter(profileRes.data.display_name[0]);
        }
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await profileAPI.update(profileData);
      updateSettings(profileData);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading profile...</div>;
  }

  const renderIdentity = () => (
    <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px' }}>
      <div className="form-group">
        <label>Display Name</label>
        <input 
          type="text" 
          name="display_name" 
          value={profileData.display_name} 
          onChange={handleChange} 
          placeholder="e.g. Iron Crusher"
          className="input"
        />
      </div>
      <div className="form-group">
        <label>Primary Goal</label>
        <input 
          type="text" 
          name="goal" 
          value={profileData.goal} 
          onChange={handleChange} 
          placeholder="e.g. Build Muscle, Lose Fat"
          className="input"
        />
      </div>
      <div className="form-group">
        <label>Bio</label>
        <textarea 
          name="bio" 
          value={profileData.bio} 
          onChange={handleChange} 
          placeholder="Tell the community about yourself..."
          className="input"
          style={{ minHeight: '100px' }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );

  const renderStats = () => (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Workouts</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent)', marginTop: '8px' }}>{stats?.totalWorkouts || 0}</div>
        </div>
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Streak</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#ff6b6b', marginTop: '8px' }}>{stats?.currentStreak || 0} <span style={{fontSize: '16px'}}><Flame size={16} /></span></div>
        </div>
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Volume Lifted</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px' }}>{formatWeight(stats?.totalVolume || 0).value.toLocaleString()} <span style={{fontSize: '14px'}}>{weightUnit}</span></div>
        </div>
      </div>
      {renderHeatmap()}
      {renderBadges()}
    </div>
  );

  const renderHeatmap = () => {
    if (!stats?.history) return null;
    
    // Create an array of the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    return (
      <div style={{ marginTop: '32px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>ACTIVITY HEATMAP (LAST 30 DAYS)</div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(15, 1fr)', 
          gap: '6px',
          background: 'var(--bg-elevated)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}>
          {last30Days.map(date => {
            const hasWorkout = stats.history.includes(date);
            return (
              <div 
                key={date} 
                title={`${date}${hasWorkout ? ' - Workout logged' : ''}`}
                style={{
                  aspectRatio: '1',
                  background: hasWorkout ? 'var(--accent)' : 'var(--bg)',
                  borderRadius: '4px',
                  opacity: hasWorkout ? 1 : 0.3,
                  boxShadow: hasWorkout ? '0 0 10px rgba(232,255,71,0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderBadges = () => {
    if (!stats) return null;
    const badges = [];
    if (stats.totalWorkouts >= 1) badges.push({ icon: Trophy, name: 'First Step', desc: 'Logged 1 workout' });
    if (stats.totalWorkouts >= 10) badges.push({ icon: Medal, name: '10 Club', desc: 'Logged 10 workouts' });
    if (stats.totalWorkouts >= 30) badges.push({ icon: Award, name: '30 Club', desc: 'Logged 30 workouts' });
    if (stats.totalWorkouts >= 100) badges.push({ icon: Award, name: '100 Club', desc: 'Logged 100 workouts' });
    if (stats.currentStreak >= 3) badges.push({ icon: Flame, name: 'On Fire', desc: '3 day streak' });
    if (stats.totalVolume >= 1000) badges.push({ icon: Dumbbell, name: '1 Ton', desc: 'Lifted 1,000kg total' });

    if (badges.length === 0) return null;

    return (
      <div style={{ marginTop: '32px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>TROPHIES & BADGES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {badges.map((b, i) => (
            <div key={i} style={{ 
              background: 'var(--bg-elevated)', 
              padding: '20px 16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <b.icon size={40} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 15px rgba(232,255,71,0.3))' }} />
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{b.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  const renderSettings = () => (
    <form onSubmit={handleSave} style={{ display: 'grid', gap: '32px' }}>
      
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>PREFERENCES</div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="form-group">
            <label>Unit Preference</label>
            <select name="unit_preference" value={profileData.unit_preference} onChange={handleChange} className="input">
              <option value="metric">Metric (kg/cm)</option>
              <option value="imperial">Imperial (lbs/in)</option>
            </select>
          </div>
          <div className="form-group">
            <label>AI Coach Persona</label>
            <select name="ai_persona" value={profileData.ai_persona} onChange={handleChange} className="input">
              <option value="friendly">Friendly & Supportive</option>
              <option value="drill_instructor">Drill Instructor (Tough Love)</option>
              <option value="scientific">Scientific & Analytical</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              name="privacy_public" 
              id="privacy_public"
              checked={profileData.privacy_public} 
              onChange={handleChange} 
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
            />
            <label htmlFor="privacy_public" style={{ margin: 0, cursor: 'pointer' }}>Make profile public to the community</label>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>THEME</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {[
            { id: 'stone', label: 'Stone & Gold', primary: '#e8ff47', bg: '#030609' },
            { id: 'ocean', label: 'Deep Ocean', primary: '#2ed5ff', bg: '#010a13' },
            { id: 'midnight', label: 'Midnight', primary: '#a55eea', bg: '#09030c' }
          ].map(t => (
            <button 
              key={t.id}
              type="button"
              onClick={() => {
                document.body.className = `theme-${t.id}`;
                localStorage.setItem('gym-theme', t.id);
              }}
              className="btn btn-ghost" 
              style={{ 
                flexDirection: 'column', 
                gap: '8px', 
                height: 'auto', 
                padding: '16px',
                border: document.body.className === `theme-${t.id}` ? '2px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              <div style={{ width: '100%', height: '40px', background: t.bg, border: `2px solid ${t.primary}`, borderRadius: '4px' }} />
              <span style={{ fontSize: '11px' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
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
            width: '100%'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'; e.currentTarget.style.color = '#fb7185'; }}
        >
          Sign Out
        </button>
      </div>
    </form>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: 'min(32px, 8vw)', 
          fontFamily: 'var(--font-display)', 
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          marginBottom: '8px'
        }}>
          Athlete <span style={{ color: 'var(--accent)' }}>Profile</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Manage your identity, view your stats, and configure settings.
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
            boxShadow: '0 0 20px rgba(232,255,71,0.2)',
            textTransform: 'uppercase'
          }}>
            {profileData.display_name ? profileData.display_name[0] : (user?.email?.[0] || 'U')}
          </div>
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {profileData.display_name || 'Athlete'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', overflowX: 'auto' }}>
          {['identity', 'stats', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'stats' ? 'Trophy Room' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '300px' }}>
          {activeTab === 'identity' && renderIdentity()}
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
}
