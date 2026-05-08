import React, { useState, useEffect } from 'react';
import { workoutPlanAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EXERCISES = {
  Chest: ['Bench Press', 'Incline Press', 'Cable Fly', 'Push-ups', 'Dips'],
  Back: ['Pull-ups', 'Barbell Row', 'Lat Pulldown', 'Seated Row', 'Deadlift'],
  Legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Lunges', 'Leg Curl'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Arnold Press'],
  Arms: ['Bicep Curl', 'Tricep Extension', 'Hammer Curl', 'Skull Crushers', 'Preacher Curl'],
  Core: ['Plank', 'Crunches', 'Russian Twist', 'Leg Raise', 'Cable Crunch'],
  Cardio: ['Running', 'Cycling', 'Jump Rope', 'HIIT', 'Swimming'],
};

export default function WorkoutPlanner() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [form, setForm] = useState({ day_of_week: 'Monday', exercise: '', sets: '3', reps: '10' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Chest');
  const { showToast, ToastComponent } = useToast();

  const fetchPlans = async () => {
    try {
      const res = await workoutPlanAPI.get();
      setPlans(res.data);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exercise) return showToast('Please enter an exercise name', 'error');
    setSubmitting(true);
    try {
      await workoutPlanAPI.create({ ...form, sets: parseInt(form.sets), reps: parseInt(form.reps) });
      showToast('Exercise added to plan!');
      setForm(f => ({ ...f, exercise: '', sets: '3', reps: '10' }));
      fetchPlans();
    } catch (err) { showToast(err || 'Failed to add exercise', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await workoutPlanAPI.delete(id);
      showToast('Exercise removed');
      fetchPlans();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const dayPlans = plans.filter(p => p.day_of_week === selectedDay);

  return (
    <div className="main-content">
      {ToastComponent}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">WORKOUT PLANNER</h1>
        <p className="section-subtitle">Build your weekly training program</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Day selector + plan view */}
        <div>
          {/* Day tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {DAYS.map(day => {
              const count = plans.filter(p => p.day_of_week === day).length;
              const isActive = selectedDay === day;
              return (
                <button key={day} onClick={() => setSelectedDay(day)} style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border: isActive ? '1px solid rgba(232,255,71,0.3)' : '1px solid var(--border)',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {day.slice(0, 3).toUpperCase()}
                  {count > 0 && (
                    <span style={{ background: isActive ? 'var(--accent)' : 'var(--border-bright)', color: isActive ? '#080c10' : 'var(--text-muted)', borderRadius: '100px', padding: '1px 6px', fontSize: '10px' }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day's exercises */}
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '0.06em' }}>{selectedDay.toUpperCase()}</div>
              <span className="badge badge-accent">{dayPlans.length} EXERCISES</span>
            </div>
            
            {loading ? <div className="skeleton" style={{ height: '200px' }} /> : dayPlans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowX: 'auto' }}>
                {dayPlans.map((plan, i) => (
                  <div key={plan.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    minWidth: '280px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{i + 1}</div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{plan.exercise}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{plan.sets} sets × {plan.reps} reps</div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(plan.id)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '11px' }}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                Rest day or no exercises planned
              </div>
            )}
          </div>

          {/* Weekly overview */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '12px' }}>WEEKLY OVERVIEW</div>
            {DAYS.map(day => {
              const count = plans.filter(p => p.day_of_week === day).length;
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '60px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day.slice(0,3)}</div>
                  <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(count / 8 * 100, 100)}%`, background: count > 0 ? 'var(--accent)' : 'transparent', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: count > 0 ? 'var(--accent)' : 'var(--text-muted)', width: '20px', textAlign: 'right' }}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add exercise form */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '20px' }}>ADD EXERCISE</div>
          
          {/* Exercise library */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">Exercise Library</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {Object.keys(EXERCISES).map(cat => (
                <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} style={{
                  padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                  background: selectedCategory === cat ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: selectedCategory === cat ? '#080c10' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontFamily: 'var(--font-body)',
                }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {EXERCISES[selectedCategory]?.map(ex => (
                <button key={ex} type="button" onClick={() => setForm(f => ({ ...f, exercise: ex }))} style={{
                  padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', cursor: 'pointer',
                  background: form.exercise === ex ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: form.exercise === ex ? 'var(--accent)' : 'var(--text-secondary)',
                  border: form.exercise === ex ? '1px solid rgba(232,255,71,0.3)' : '1px solid var(--border)',
                  fontFamily: 'var(--font-body)', fontWeight: '500',
                }}>{ex}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Day</label>
              <select className="input" value={form.day_of_week} onChange={e => { setForm({...form, day_of_week: e.target.value}); setSelectedDay(e.target.value); }}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Exercise Name *</label>
              <input type="text" className="input" placeholder="e.g. Bench Press" value={form.exercise} onChange={e => setForm({...form, exercise: e.target.value})} />
            </div>
            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <label className="input-label">Sets</label>
                <input type="number" className="input" min="1" max="20" value={form.sets} onChange={e => setForm({...form, sets: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Reps</label>
                <input type="number" className="input" min="1" max="100" value={form.reps} onChange={e => setForm({...form, reps: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Adding...' : '+ ADD TO PLAN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
