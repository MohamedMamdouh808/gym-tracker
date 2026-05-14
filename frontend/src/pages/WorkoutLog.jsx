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
  const [editingId, setEditingId] = useState(null);
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
      const payload = { ...form, sets: parseInt(form.sets), reps: parseInt(form.reps), weight: parseFloat(form.weight) || 0 };
      if (editingId) {
        await workoutLogAPI.update(editingId, payload);
        showToast('Log updated!');
        setEditingId(null);
      } else {
        await workoutLogAPI.log(payload);
        showToast('Exercise logged!');
      }
      setForm(f => ({ ...f, exercise: '', sets: '3', reps: '10', weight: '' }));
      fetchData();
    } catch (err) { showToast(err || 'Failed to save exercise', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setForm({
      date: log.date,
      exercise: log.exercise,
      sets: String(log.sets),
      reps: String(log.reps),
      weight: String(log.weight)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log?')) return;
    try {
      await workoutLogAPI.delete(id);
      showToast('Log deleted');
      fetchData();
    } catch (err) {
      showToast(err || 'Failed to delete', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split('T')[0], exercise: '', sets: '3', reps: '10', weight: '' });
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em' }}>
              {editingId ? 'EDIT SET' : 'LOG SET'}
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
              {submitting ? 'Saving...' : editingId ? 'UPDATE LOG' : '+ LOG EXERCISE'}
            </button>
          </form>

          {/* Utilities Row */}
          <div className="grid-2" style={{ marginTop: '24px', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '10px', color: 'var(--text-muted)' }}>1RM CALCULATOR</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="number" placeholder="Wt" className="input" style={{ height: '32px', fontSize: '12px' }} id="orm-w" />
                <input type="number" placeholder="Rps" className="input" style={{ height: '32px', fontSize: '12px' }} id="orm-r" />
              </div>
              <button onClick={() => {
                const w = parseFloat(document.getElementById('orm-w').value);
                const r = parseInt(document.getElementById('orm-r').value);
                if (w && r) {
                  const orm = Math.round(w * (1 + r/30));
                  showToast(`Estimated 1RM: ${orm}kg`);
                }
              }} className="btn btn-ghost" style={{ width: '100%', fontSize: '10px', height: '28px' }}>CALCULATE</button>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '10px', color: 'var(--text-muted)' }}>REST TIMER</div>
              <RestTimer />
            </div>
          </div>
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
                            <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  <button onClick={() => handleEdit(log)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '9px', opacity: 0.8 }}>Edit</button>
                                  <button onClick={() => handleDelete(log.id)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '9px', opacity: 0.8, color: 'var(--red)' }}>Del</button>
                                </div>
                                {log.exercise}
                              </div>
                            </td>
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

function RestTimer() {
  const [seconds, setSeconds] = useState(60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: seconds < 10 ? 'var(--red)' : 'var(--accent)', marginBottom: '8px' }}>
        0:{seconds.toString().padStart(2, '0')}
      </div>
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button onClick={() => setIsActive(!isActive)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '10px' }}>
          {isActive ? 'PAUSE' : 'START'}
        </button>
        <button onClick={() => { setIsActive(false); setSeconds(60); }} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '10px' }}>RESET</button>
      </div>
    </div>
  );
}

