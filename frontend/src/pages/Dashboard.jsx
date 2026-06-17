import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { dashboardAPI, waterAPI } from '../utils/api';
import { useProfile } from '../context/ProfileContext';
import { 
  RefreshCw, Scale, Flame, Droplets, Trophy, 
  Zap, Salad, Dumbbell, Calendar, Target, Award,
  CheckCircle2
} from 'lucide-react';

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

export default function Dashboard({ onNavigate }) {
  const { formatWeight, weightUnit } = useProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waterAmount, setWaterAmount] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    dashboardAPI.get()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); fetchData(); }, 1500);
  };

  const handleWaterLog = async (e) => {
    e.preventDefault();
    if (!waterAmount) return;
    try {
      await waterAPI.log({ date: new Date().toISOString().split('T')[0], amount_ml: waterAmount });
      setWaterAmount('');
      fetchData();
    } catch {}
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div className="page-enter">
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

  const waterToday = data?.waterToday || 0;

  const macroChartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [data?.proteinToday || 0, data?.carbsToday || 0, data?.fatToday || 0],
      backgroundColor: ['#2ed5ff', '#ff9f43', '#ff4757'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">COMMAND CENTER</h1>
            <p className="section-subtitle">{today}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleSync} className={`btn btn-ghost ${isSyncing ? 'pulse' : ''}`} style={{ fontSize: '11px', gap: '8px', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              {isSyncing ? 'SYNCING...' : 'SYNC HEALTH'}
            </button>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2ed5ff' }} />
              PRO ACCOUNT
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="main-content-inner">
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <StatCard label="Body Mass" value={data?.latestWeight?.weight ? formatWeight(data.latestWeight.weight).value : '--'} unit={weightUnit} color="var(--accent)" icon={Scale} change="Trend: Stable" />
            <StatCard label="Energy Balance" value={Math.round(data?.caloriesToday || 0)} unit="kcal" color="var(--orange)" icon={Flame} change={`${Math.round((data?.caloriesToday || 0) / 2500 * 100)}% of goal`} />
            <StatCard label="Hydration" value={waterToday} unit="ml" color="#2ed5ff" icon={Droplets} change={`${Math.round(waterToday / 2500 * 100)}% of goal`} />
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em' }}>NUTRITION ENGINE</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>REAL-TIME</div>
              </div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ width: '120px', height: '120px' }}>
                  <Bar data={macroChartData} options={{ ...chartDefaults, indexAxis: 'y', scales: { x: { display: false }, y: { display: false } } }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="flex justify-between" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Protein</span>
                    <span style={{ fontWeight: '700', color: '#2ed5ff' }}>{Math.round(data?.proteinToday || 0)}g</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Carbs</span>
                    <span style={{ fontWeight: '700', color: '#ff9f43' }}>{Math.round(data?.carbsToday || 0)}g</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Fats</span>
                    <span style={{ fontWeight: '700', color: '#ff4757' }}>{Math.round(data?.fatToday || 0)}g</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em' }}>WATER INTAKE</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[250, 500].map(amt => (
                    <button key={amt} onClick={async () => {
                      await waterAPI.log({ date: new Date().toISOString().split('T')[0], amount_ml: amt });
                      fetchData();
                    }} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '10px' }}>+{amt}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '100px', height: '32px', position: 'relative', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--border)' }}>
                <div style={{ height: '100%', width: `${Math.min(waterToday / 2500 * 100, 100)}%`, background: 'linear-gradient(90deg, #2ed5ff, #1e90ff)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
              <form onSubmit={handleWaterLog} style={{ display: 'flex', gap: '8px' }}>
                <input type="number" step="50" className="input" style={{ flex: 1, height: '36px' }} placeholder="Log ml..." value={waterAmount} onChange={e => setWaterAmount(e.target.value)} />
                <button type="submit" className="btn btn-primary" style={{ height: '36px', padding: '0 16px' }}>ADD</button>
              </form>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '12px' }}>WEIGHT TREND</div>
              <div style={{ height: '180px' }}>
                {weightData.length > 0 ? <Line data={weightChartData} options={chartDefaults} /> : <EmptyChart message="Log weight to see trend" />}
              </div>
            </div>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '12px' }}>CALORIE LOG</div>
              <div style={{ height: '180px' }}>
                {calData.length > 0 ? <Bar data={calChartData} options={chartDefaults} /> : <EmptyChart message="Log meals to see data" />}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '16px' }}>ACHIEVEMENTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <Achievement icon={Flame} label={`${data?.streak || 0} Day Streak`} active={data?.streak > 0} />
                <Achievement icon={Droplets} label="Hydrated" active={waterToday >= 2500} />
                <Achievement icon={Trophy} label="PR King" active />
                <Achievement icon={Salad} label="Macro Pro" active={data?.proteinToday > 100} />
                <Achievement icon={Calendar} label="Planner" active />
                <Achievement icon={Award} label="Elite" />
              </div>
            </div>

            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '16px' }}>RECENT ACTIVITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ActivityItem icon={Zap} title="New Personal Record" desc="Bench Press: 100kg" time="2h ago" color="var(--accent)" />
                <ActivityItem icon={Salad} title="Meal Logged" desc="Protein Bowl (650kcal)" time="4h ago" color="var(--orange)" />
                <ActivityItem icon={Droplets} title="Goal Reached" desc="Hydration goal complete!" time="Today" color="#2ed5ff" />
                <ActivityItem icon={Dumbbell} title="Workout Finished" desc="Upper Body (A)" time="Yesterday" color="var(--green)" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em' }}>TODAY'S FUEL</div>
              <button onClick={() => onNavigate('meals')} className="btn btn-ghost" style={{ fontSize: '10px' }}>VIEW ALL</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data?.mealsToday?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {data.mealsToday.slice(0, 6).map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>{m.food_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.meal_type}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>{m.calories} kcal</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>No meals logged yet today</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Achievement({ icon: Icon, label, active }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      opacity: active ? 1 : 0.2, filter: active ? 'none' : 'grayscale(1)',
      transition: 'all 0.3s', cursor: 'default'
    }}>
      <div style={{ 
        width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-elevated)',
        border: active ? '1px solid var(--accent-dim)' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? '0 4px 12px var(--accent-dim)' : 'none'
      }}>
        <Icon size={22} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
      </div>
      <div style={{ fontSize: '9px', textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function ActivityItem({ icon: Icon, title, desc, time, color }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600' }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{time}</div>
    </div>
  );
}

function StatCard({ label, value, unit, color, icon: Icon, change }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-10px', right: '-10px',
        width: '60px', height: '60px', borderRadius: '50%',
        background: `${color}15`, display: 'flex', alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(36px, 8vw)', lineHeight: 1, color, marginTop: '8px' }}>
        {value} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
        {change}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
      border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '12px',
    }}>
      {message}
    </div>
  );
}