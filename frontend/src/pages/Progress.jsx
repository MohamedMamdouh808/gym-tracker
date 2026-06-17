import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { weightAPI, mealsAPI, workoutLogAPI, reportsAPI, prAPI } from '../utils/api';
import { useProfile } from '../context/ProfileContext';
import DeleteButton from '../components/DeleteButton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartBase = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#7a8fa0', font: { size: 11 } } }, tooltip: { backgroundColor: '#161d25', borderColor: '#1e2a36', borderWidth: 1, titleColor: '#f0f4f8', bodyColor: '#7a8fa0' } },
  scales: {
    x: { grid: { color: '#1e2a36' }, ticks: { color: '#3d5166', font: { size: 11 } } },
    y: { grid: { color: '#1e2a36' }, ticks: { color: '#3d5166', font: { size: 11 } } },
  },
};

export default function Progress() {
  const { formatWeight, weightUnit, toMetricWeight } = useProfile();
  const [weightData, setWeightData] = useState([]);
  const [calData, setCalData] = useState([]);
  const [workoutDates, setWorkoutDates] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [prs, setPrs] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState('');
  const [prForm, setPrForm] = useState({ exercise: '', weight: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = () => {
    Promise.all([
      weightAPI.get({ limit: 60 }),
      mealsAPI.get({ limit: 200 }),
      workoutLogAPI.get({ limit: 100 }),
      reportsAPI.weekly(),
      prAPI.get(),
    ]).then(([wRes, mRes, wlRes, rRes, prRes]) => {
      setWeightData([...wRes.data].reverse());
      setWorkoutLogs(wlRes.data);
      setPrs(prRes.data);
      
      const calMap = {};
      mRes.data.forEach(m => {
        calMap[m.date] = (calMap[m.date] || 0) + m.calories;
      });
      setCalData(Object.entries(calMap).sort((a,b) => a[0].localeCompare(b[0])).slice(-30));
      
      const dates = [...new Set(wlRes.data.map(l => l.date))].sort();
      setWorkoutDates(dates.slice(-30));
      setReport(rRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handlePrSubmit = async (e) => {
    e.preventDefault();
    if (!prForm.exercise || !prForm.weight) return;
    try {
      await prAPI.update(prForm);
      setPrForm({ exercise: '', weight: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch {}
  };

  const handlePrDelete = async (id) => {
    try {
      await prAPI.delete(id);
      fetchData();
    } catch {}
  };

  const weightChartData = {
    labels: weightData.map(d => d.date.slice(5)),
    datasets: [{
      label: `Weight (${weightUnit})`, data: weightData.map(d => formatWeight(d.weight).value),
      borderColor: '#e8ff47', backgroundColor: 'rgba(232,255,71,0.08)',
      borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: '#e8ff47',
    }],
  };

  const calChartData = {
    labels: calData.map(d => d[0].slice(5)),
    datasets: [{
      label: 'Calories', data: calData.map(d => d[1]),
      backgroundColor: 'rgba(255,159,67,0.7)', borderColor: '#ff9f43', borderWidth: 1, borderRadius: 4,
    }],
  };

  // Workout consistency: last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
  const consistencyData = {
    labels: last30.map(d => d.slice(5)),
    datasets: [{
      label: 'Workout', data: last30.map(d => workoutDates.includes(d) ? 1 : 0),
      backgroundColor: last30.map(d => workoutDates.includes(d) ? 'rgba(38,222,129,0.8)' : 'rgba(30,42,54,0.8)'),
      borderColor: last30.map(d => workoutDates.includes(d) ? '#26de81' : '#1e2a36'),
      borderWidth: 1, borderRadius: 4,
    }],
  };

  if (loading) return (
    <div style={{ padding: '32px' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '300px', marginBottom: '24px' }} />)}
    </div>
  );

  const weightChange = report?.weightChange;
  const startW = weightChange?.start_weight;
  const endW = weightChange?.end_weight;
  const diff = startW && endW ? (endW - startW).toFixed(1) : null;
  const latestWeight = weightData[weightData.length - 1]?.weight;

  const calculateBMI = (w, h) => {
    if (!w || !h) return null;
    const hMeter = h / 100;
    return (w / (hMeter * hMeter)).toFixed(1);
  };

  const getBMICategory = (val) => {
    const bmi = parseFloat(val);
    if (bmi < 18.5) return { label: 'Underweight', color: 'var(--blue)' };
    if (bmi < 25) return { label: 'Normal', color: 'var(--green)' };
    if (bmi < 30) return { label: 'Overweight', color: 'var(--orange)' };
    return { label: 'Obese', color: 'var(--red)' };
  };

  const muscleGroups = {
    Chest: ['bench', 'chest', 'pushup', 'fly'],
    Back: ['pullup', 'row', 'deadlift', 'lat', 'back'],
    Legs: ['squat', 'lunge', 'leg', 'deadlift', 'calf'],
    Shoulders: ['press', 'shoulder', 'lateral', 'front'],
    Arms: ['curl', 'extension', 'bicep', 'tricep', 'arm'],
    Core: ['plank', 'crunch', 'abs', 'core']
  };

  const recentLogs = workoutLogs.filter(l => {
    const d = new Date(l.date);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return d >= fourteenDaysAgo && l.completed;
  });

  const muscleIntensity = {};
  Object.keys(muscleGroups).forEach(g => muscleIntensity[g] = 0);

  recentLogs.forEach(l => {
    const ex = l.exercise.toLowerCase();
    Object.entries(muscleGroups).forEach(([group, keywords]) => {
      if (keywords.some(k => ex.includes(k))) {
        muscleIntensity[group]++;
      }
    });
  });

  const maxIntensity = Math.max(...Object.values(muscleIntensity), 1);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">PROGRESS</h1>
        <p className="section-subtitle">Your fitness journey at a glance</p>
      </div>

      {/* Weekly report cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Weight Change (7d)</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(36px, 10vw)', color: diff < 0 ? 'var(--green)' : diff > 0 ? 'var(--red)' : 'var(--accent)', marginTop: '6px' }}>
            {diff !== null ? `${diff > 0 ? '+' : ''}${formatWeight(Math.abs(diff)).value * (diff < 0 ? -1 : 1)} ${weightUnit}` : '—'}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Workouts This Week</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(36px, 10vw)', color: 'var(--blue)', marginTop: '6px' }}>
            {report?.workoutsCompleted || 0}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Avg Daily Calories</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(36px, 10vw)', color: 'var(--orange)', marginTop: '6px' }}>
            {report?.avgDailyCalories || '—'}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Consistency (30d)</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(36px, 10vw)', color: 'var(--green)', marginTop: '6px' }}>
            {Math.round(workoutDates.length / 30 * 100)}%
          </div>
        </div>
      </div>

      {/* Weight chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>WEIGHT PROGRESS</div>
        {weightData.length > 0 ? (
          <div style={{ height: '280px' }}><Line data={weightChartData} options={chartBase} /></div>
        ) : (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>No weight data yet</div>
        )}
      </div>

      <div className="grid-2">
        {/* Calories chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>DAILY CALORIES</div>
          {calData.length > 0 ? (
            <div style={{ height: '220px' }}><Bar data={calChartData} options={{ ...chartBase, plugins: { ...chartBase.plugins, legend: { display: false } } }} /></div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>No meal data yet</div>
          )}
        </div>

        {/* Workout consistency */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>WORKOUT CONSISTENCY</div>
          {workoutDates.length > 0 ? (
            <div style={{ height: '220px' }}><Bar data={consistencyData} options={{ ...chartBase, plugins: { ...chartBase.plugins, legend: { display: false } }, scales: { ...chartBase.scales, y: { ...chartBase.scales.y, max: 1.5, ticks: { ...chartBase.scales.y.ticks, callback: v => v === 1 ? '✓' : '' } } } }} /></div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>No workout data yet</div>
          )}
        </div>

              </div>

      {/* Heatmap calendar */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>WORKOUT HEATMAP — LAST 30 DAYS</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {last30.map(date => {
            const active = workoutDates.includes(date);
            return (
              <div key={date} title={date} style={{
                width: '28px', height: '28px', borderRadius: '4px',
                background: active ? 'var(--green)' : 'var(--bg-elevated)',
                border: `1px solid ${active ? 'rgba(38,222,129,0.3)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', color: active ? '#080c10' : 'var(--text-muted)', fontWeight: '700',
              }}>
                {new Date(date + 'T00:00').getDate()}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--green)', borderRadius: '2px', display: 'inline-block' }} />
            Workout day
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '2px', display: 'inline-block' }} />
            Rest day
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '24px' }}>
        {/* Muscle Focus Heatmap */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>MUSCLE FOCUS (LAST 14 DAYS)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(muscleIntensity).map(([group, val]) => (
              <div key={group}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{group.toUpperCase()}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{val} sets</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(val / maxIntensity) * 100}%`, 
                    background: `linear-gradient(90deg, #2ed5ff, ${val > 5 ? '#e8ff47' : '#2ed5ff'})`,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PR Tracker */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>PERSONAL RECORDS</div>
          <form onSubmit={handlePrSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="text" className="input" placeholder="Exercise" style={{ flex: 2 }} value={prForm.exercise} onChange={e => setPrForm({...prForm, exercise: e.target.value})} />
            <input type="number" className="input" placeholder="Weight" style={{ flex: 1 }} value={prForm.weight} onChange={e => setPrForm({...prForm, weight: e.target.value})} />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>SET</button>
          </form>
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {prs.length > 0 ? prs.map(pr => (
              <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <DeleteButton onDelete={() => handlePrDelete(pr.id)} />
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{pr.exercise}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>{formatWeight(pr.weight).value}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{weightUnit.toUpperCase()}</span>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '12px' }}>No records set yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
