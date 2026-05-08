import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { weightAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#161d25', borderColor: '#1e2a36', borderWidth: 1, titleColor: '#f0f4f8', bodyColor: '#7a8fa0' } },
  scales: {
    x: { grid: { color: '#1e2a36' }, ticks: { color: '#3d5166', font: { size: 11 } } },
    y: { grid: { color: '#1e2a36' }, ticks: { color: '#3d5166', font: { size: 11 } } },
  },
};

export default function WeightTracker() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight: '', body_fat: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const fetchLogs = async () => {
    try {
      const res = await weightAPI.get({ limit: 30 });
      setLogs(res.data.reverse());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.weight) return showToast('Please enter a weight', 'error');
    setSubmitting(true);
    try {
      await weightAPI.log({ ...form, weight: parseFloat(form.weight), body_fat: form.body_fat ? parseFloat(form.body_fat) : null });
      showToast('Weight logged successfully!');
      setForm({ date: new Date().toISOString().split('T')[0], weight: '', body_fat: '' });
      fetchLogs();
    } catch (err) {
      showToast(err || 'Failed to log weight', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = {
    labels: logs.map(l => l.date.slice(5)),
    datasets: [
      {
        label: 'Weight (kg)',
        data: logs.map(l => l.weight),
        borderColor: '#e8ff47', backgroundColor: 'rgba(232,255,71,0.08)',
        borderWidth: 2, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#e8ff47',
      },
      ...(logs.some(l => l.body_fat) ? [{
        label: 'Body Fat %',
        data: logs.map(l => l.body_fat),
        borderColor: '#ff9f43', backgroundColor: 'rgba(255,159,67,0.08)',
        borderWidth: 2, tension: 0.4, fill: false, pointRadius: 4, pointBackgroundColor: '#ff9f43',
        yAxisID: 'y1',
      }] : []),
    ],
  };

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const change = latest && first ? (latest.weight - first.weight).toFixed(1) : null;

  return (
    <div>
      {ToastComponent}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">WEIGHT TRACKER</h1>
        <p className="section-subtitle">Monitor your weight and body composition</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px', alignItems: 'start' }}>
        {/* Log form */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '20px' }}>LOG WEIGHT</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Weight (kg) *</label>
              <input type="number" step="0.1" className="input" placeholder="75.5" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">Body Fat % (optional)</label>
              <input type="number" step="0.1" className="input" placeholder="18.5" value={form.body_fat} onChange={e => setForm({...form, body_fat: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Saving...' : '+ LOG WEIGHT'}
            </button>
          </form>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Current Weight', value: latest ? `${latest.weight} kg` : '—', color: 'var(--accent)' },
            { label: 'Body Fat', value: latest?.body_fat ? `${latest.body_fat}%` : '—', color: 'var(--orange)' },
            { label: 'Total Change', value: change !== null ? `${change > 0 ? '+' : ''}${change} kg` : '—', color: change < 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'Entries', value: logs.length, color: 'var(--blue)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: s.color, lineHeight: 1, marginTop: '6px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>PROGRESS CHART</div>
        {logs.length > 0 ? (
          <div style={{ height: '280px' }}>
            <Line data={chartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y1: { position: 'right', grid: { display: false }, ticks: { color: '#ff9f43' } } } }} />
          </div>
        ) : (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
            No data yet — log your first weight
          </div>
        )}
      </div>

      {/* History table */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>HISTORY</div>
        {loading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : logs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Weight</th><th>Body Fat</th><th>Change</th></tr>
              </thead>
              <tbody>
                {[...logs].reverse().map((log, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? (log.weight - prev.weight).toFixed(1) : null;
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-primary)' }}>{log.date}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>{log.weight} kg</td>
                      <td>{log.body_fat ? `${log.body_fat}%` : '—'}</td>
                      <td>
                        {diff !== null ? (
                          <span style={{ color: diff <= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, fontSize: '12px' }}>
                            {diff > 0 ? '+' : ''}{diff} kg
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No entries yet</div>
        )}
      </div>
    </div>
  );
}
