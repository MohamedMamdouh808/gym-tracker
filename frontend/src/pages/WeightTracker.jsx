import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { weightAPI } from '../utils/api';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../hooks/useToast';
import DeleteButton from '../components/DeleteButton';

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
  const { formatWeight, weightUnit, toMetricWeight, isImperial } = useProfile();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight: '', body_fat: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [height, setHeight] = useState('');
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
      const weightInKg = toMetricWeight(parseFloat(form.weight));
      const payload = { ...form, weight: weightInKg, body_fat: form.body_fat ? parseFloat(form.body_fat) : null };
      if (editingId) {
        await weightAPI.update(editingId, payload);
        showToast('Weight updated successfully!');
        setEditingId(null);
      } else {
        await weightAPI.log(payload);
        showToast('Weight logged successfully!');
      }
      setForm({ date: new Date().toISOString().split('T')[0], weight: '', body_fat: '' });
      fetchLogs();
    } catch (err) {
      showToast(err || 'Failed to save weight', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setForm({
      date: log.date,
      weight: String(formatWeight(log.weight).value),
      body_fat: log.body_fat ? String(log.body_fat) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await weightAPI.delete(id);
      showToast('Entry deleted');
      fetchLogs();
    } catch (err) {
      showToast(err || 'Failed to delete', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split('T')[0], weight: '', body_fat: '' });
  };

  const chartData = {
    labels: logs.map(l => l.date.slice(5)),
    datasets: [
      {
        label: `Weight (${weightUnit})`,
        data: logs.map(l => formatWeight(l.weight).value),
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

  return (
    <div className="page-enter">
      {ToastComponent}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">WEIGHT TRACKER</h1>
        <p className="section-subtitle">Monitor your weight and body composition</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px', alignItems: 'start' }}>
        {/* Log form */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em' }}>
              {editingId ? 'EDIT WEIGHT' : 'LOG WEIGHT'}
            </div>
            {editingId && (
              <button onClick={cancelEdit} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }}>CANCEL</button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Weight ({weightUnit}) *</label>
              <input type="number" step="0.1" className="input" placeholder="75.5" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">Body Fat % (optional)</label>
              <input type="number" step="0.1" className="input" placeholder="18.5" value={form.body_fat} onChange={e => setForm({...form, body_fat: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'UPDATE WEIGHT' : '+ LOG WEIGHT'}
            </button>
          </form>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Current Weight', value: latest ? `${formatWeight(latest.weight).value} ${weightUnit}` : '—', color: 'var(--accent)' },
            { label: 'Body Fat', value: latest?.body_fat ? `${latest.body_fat}%` : '—', color: 'var(--orange)' },
            { label: 'Total Change', value: change !== null ? `${change > 0 ? '+' : ''}${formatWeight(Math.abs(change)).value * (change < 0 ? -1 : 1)} ${weightUnit}` : '—', color: change < 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'Entries', value: logs.length, color: 'var(--blue)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: s.color, lineHeight: 1, marginTop: '6px' }}>{s.value}</div>
            </div>
          ))}
          {latest && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>BMI CALCULATOR</div>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Your Height (cm)</label>
                <input type="number" className="input" placeholder="e.g. 175" value={height} onChange={e => setHeight(e.target.value)} />
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Using latest weight: {formatWeight(latest.weight).value}{weightUnit}</p>
              </div>
              {height && (
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current BMI</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent)' }}>
                      {calculateBMI(latest.weight, height)}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: getBMICategory(calculateBMI(latest.weight, height)).color }}>
                      {getBMICategory(calculateBMI(latest.weight, height)).label.toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
                      <td style={{ color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button onClick={() => handleEdit(log)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '9px', opacity: 0.8 }}>Edit</button>
                            <DeleteButton onDelete={() => handleDelete(log.id)} />
                          </div>
                          {log.date}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>{formatWeight(log.weight).value} {weightUnit}</td>
                      <td>{log.body_fat ? `${log.body_fat}%` : '—'}</td>
                      <td>
                        {diff !== null ? (
                          <span style={{ color: diff <= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, fontSize: '12px' }}>
                            {diff > 0 ? '+' : ''}{formatWeight(Math.abs(diff)).value * (diff < 0 ? -1 : 1)} {weightUnit}
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
