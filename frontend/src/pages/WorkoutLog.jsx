import React, { useState, useEffect } from 'react';
import { workoutLogAPI, workoutPlanAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';

const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutLog() {
  const [logs, setLogs] = useState([]);
  const [todayPlan, setTodayPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], exercise: '', sets: '3', reps: '10', weight: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const todayDayName = DAYS_MAP[new Date().getDay()];

  const fetchData = async () => {
    try {
      const [logsRes, planRes] = await Promise.all([
        workoutLogAPI.get({ limit: 50 }),
        workoutPlanAPI.get({ day_of_week: todayDayName }),
      ]);
      setLogs(logsRes.data);
      setTodayPlan(planRes.data);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fillFromPlan = (planItem) => {
    setForm(f => ({ ...f, exercise: planItem.exercise, sets: String(planItem.sets), reps: String(planItem.reps) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exercise) return showToast('Please enter an exercise', 'error');
    setSubmitting(true);
    try {
      await workoutLogAPI.log({ ...form, sets: parseInt(form.sets), reps: parseInt(form.reps), weight: parseFloat(form.weight) || 0 });
      showToast('Exercise logged!');
      setForm(f => ({ ...f, exercise: '', sets: '3', reps: '10', weight: '' }));
      fetchData();
    } catch (err) { showToast(err || 'Failed to log exercise', 'error'); }
    finally { setSubmitting(false); }
  };

  const todayLogs = logs.filter(l => l.date === today);
  const completedExercises = new Set(todayLogs.map(l => l.exercise));
  const volume = todayLogs.reduce((sum, l) => sum + (l.sets * l.reps * l.weight), 0);

  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  return (
    <div>
      {ToastComponent}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">WORKOUT LOG</h1>
        <p className="section-subtitle">{todayDayName} — {today}</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px', alignItems: 'start' }}>
        {/* Today's plan */}
        <div>
          {todayPlan.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '12px' }}>
                TODAY'S PLAN — {todayDayName.toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Click to auto-fill form</div>
              <div style={{ overflowX: 'auto' }}>
                {todayPlan.map(plan => {
                  const done = completedExercises.has(plan.exercise);
                  return (
                    <div key={plan.id} onClick={() => fillFromPlan(plan)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: done ? 'rgba(38,222,129,0.05)' : 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)', border: done ? '1px solid rgba(38,222,129,0.2)' : '1px solid var(--border)',
                      cursor: 'pointer', marginBottom: '6px', transition: 'all 0.15s',
                      minWidth: '240px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: done ? 'var(--green)' : 'var(--bg-card)', border: done ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                          {done ? '✓' : ''}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '500', textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{plan.exercise}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{plan.sets}×{plan.reps}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                {completedExercises.size}/{todayPlan.length} exercises done
              </div>
            </div>
          )}

          {/* Today's stats */}
          <div className="grid-2">
            {[
              { label: 'Sets Done', value: todayLogs.reduce((s, l) => s + l.sets, 0), color: 'var(--accent)' },
              { label: 'Total Volume', value: `${Math.round(volume)}kg`, color: 'var(--blue)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(28px, 8vw)', color: s.color, marginTop: '4px' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Log form */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '20px' }}>LOG SET</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Exercise *</label>
              <input type="text" className="input" placeholder="e.g. Bench Press" value={form.exercise} onChange={e => setForm({...form, exercise: e.target.value})} />
            </div>
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div>
                <label className="input-label">Sets</label>
                <input type="number" className="input" min="1" value={form.sets} onChange={e => setForm({...form, sets: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Reps</label>
                <input type="number" className="input" min="1" value={form.reps} onChange={e => setForm({...form, reps: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Weight (kg)</label>
                <input type="number" step="0.5" className="input" placeholder="60" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Saving...' : '+ LOG EXERCISE'}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>WORKOUT HISTORY</div>
        {loading ? <div className="skeleton" style={{ height: '200px' }} /> :
          Object.keys(logsByDate).length > 0 ? (
            Object.keys(logsByDate).sort((a,b) => b.localeCompare(a)).slice(0, 10).map(date => {
              const dayLogs = logsByDate[date];
              const dayVolume = dayLogs.reduce((s, l) => s + (l.sets * l.reps * l.weight), 0);
              return (
                <div key={date} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>{date}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Vol: {Math.round(dayVolume)}kg</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ minWidth: '400px' }}>
                      <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Volume</th></tr></thead>
                      <tbody>
                        {dayLogs.map(log => (
                          <tr key={log.id}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{log.exercise}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{log.sets}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{log.reps}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{log.weight}kg</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>{log.sets * log.reps * log.weight}kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No workouts logged yet</div>
          )
        }
      </div>
    </div>
  );
}
