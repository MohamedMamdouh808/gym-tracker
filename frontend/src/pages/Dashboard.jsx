import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { dashboardAPI } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#161d25', borderColor: '#1e2a36', borderWidth: 1, titleColor: '#f0f4f8', bodyColor: '#7a8fa0', padding: 10 } },
  scales: {
    x: { grid: { color: '#1e2a36' }, ticks: { color: '#3d5166', font: { size: 11 } } },
    y: { grid: { color: '#1e2a36' }, ticks: { color: '#3d5166', font: { size: 11 } } },
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div>
      <div className="skeleton" style={{ height: '120px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
      </div>
    </div>
  );

  const weightData = data?.weightHistory || [];
  const calData = data?.calHistory || [];

  const weightChartData = {
    labels: weightData.map(d => d.date.slice(5)),
    datasets: [{
      data: weightData.map(d => d.weight),
      borderColor: '#e8ff47',
      backgroundColor: 'rgba(232,255,71,0.08)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: '#e8ff47',
    }],
  };

  const calChartData = {
    labels: calData.map(d => d.date.slice(5)),
    datasets: [{
      data: calData.map(d => d.total_calories),
      backgroundColor: 'rgba(46,213,255,0.6)',
      borderColor: '#2ed5ff',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const latestWeight = data?.latestWeight?.weight || '—';
  const calToday = Math.round(data?.caloriesToday || 0);
  const workoutsWeek = data?.weekWorkouts || 0;
  const workoutsToday = data?.todayWorkoutCount || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">DASHBOARD</h1>
            <p className="section-subtitle">{today}</p>
          </div>
          <span className="badge badge-green">● LIVE</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <StatCard label="Current Weight" value={latestWeight !== '—' ? `${latestWeight}` : '—'} unit="kg" color="var(--accent)" icon="◈" change={data?.latestWeight ? `Last: ${data.latestWeight.date}` : 'No data yet'} />
        <StatCard label="Calories Today" value={calToday} unit="kcal" color="var(--orange)" icon="◉" change={`${Math.round(calToday / 2000 * 100)}% of goal`} />
        <StatCard label="Workouts / Week" value={workoutsWeek} unit="sessions" color="var(--blue)" icon="◫" change="Last 7 days" />
        <StatCard label="Today's Sets" value={workoutsToday * 3} unit="sets done" color="var(--green)" icon="◪" change={workoutsToday > 0 ? 'Workout complete!' : 'No workout yet'} />
      </div>

      {/* Charts row */}
      <div className="grid-2">
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em' }}>WEIGHT PROGRESS</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 30 days</div>
            </div>
            <span className="badge badge-accent">KG</span>
          </div>
          {weightData.length > 0 ? (
            <div style={{ height: '200px' }}>
              <Line data={weightChartData} options={chartDefaults} />
            </div>
          ) : (
            <EmptyChart message="Log your weight to see progress" />
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em' }}>DAILY CALORIES</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 14 days</div>
            </div>
            <span className="badge" style={{ background: 'rgba(46,213,255,0.15)', color: 'var(--blue)' }}>KCAL</span>
          </div>
          {calData.length > 0 ? (
            <div style={{ height: '200px' }}>
              <Bar data={calChartData} options={chartDefaults} />
            </div>
          ) : (
            <EmptyChart message="Log meals to track calories" />
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>QUICK ACTIONS</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Log Weight', icon: '◈', page: 'weight' },
            { label: 'Log Meal', icon: '◉', page: 'meals' },
            { label: 'Log Workout', icon: '◪', page: 'workout-log' },
            { label: 'View Progress', icon: '◬', page: 'progress' },
          ].map(a => (
            <div key={a.page} style={{
              flex: '1', minWidth: '140px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'inherit'; }}
            >
              <span style={{ fontSize: '18px' }}>{a.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color, icon, change }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-10px', right: '-10px',
        width: '60px', height: '60px', borderRadius: '50%',
        background: `${color}20`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '22px', color,
      }}>{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(42px, 10vw)', lineHeight: 1, color, marginTop: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{unit}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
        {change}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div style={{
      height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
      border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '13px',
    }}>
      {message}
    </div>
  );
}
