import React, { useState, useEffect } from 'react';
import { workoutPlanAPI, communityAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';
import DeleteButton from '../components/DeleteButton';
import { supabase } from '../utils/supabaseClient';

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

const COMMUNITY_PLANS = [
  { id: 'c1', name: 'PPL Hypertrophy', author: 'Coach Mike', exercises: 9, rating: 4.9, difficulty: 'Intermediate' },
  { id: 'c2', name: '5x5 Strength', author: 'PowerLifter7', exercises: 9, rating: 4.8, difficulty: 'Beginner' },
  { id: 'c3', name: 'Arnold Split', author: 'ClassicPhysique', exercises: 9, rating: 5.0, difficulty: 'Advanced' },
];

const COMMUNITY_PLANS_DATA = {
  c1: [ // PPL Hypertrophy
    { day_of_week: 'Monday', exercise: 'Bench Press', sets: 4, reps: 10 },
    { day_of_week: 'Monday', exercise: 'Incline Dumbbell Press', sets: 3, reps: 12 },
    { day_of_week: 'Monday', exercise: 'Lateral Raises', sets: 4, reps: 15 },
    { day_of_week: 'Tuesday', exercise: 'Pull-ups', sets: 4, reps: 10 },
    { day_of_week: 'Tuesday', exercise: 'Barbell Row', sets: 3, reps: 8 },
    { day_of_week: 'Tuesday', exercise: 'Bicep Curls', sets: 3, reps: 12 },
    { day_of_week: 'Wednesday', exercise: 'Squats', sets: 4, reps: 8 },
    { day_of_week: 'Wednesday', exercise: 'Leg Press', sets: 3, reps: 12 },
    { day_of_week: 'Wednesday', exercise: 'Leg Curls', sets: 3, reps: 15 },
  ],
  c2: [ // 5x5 Strength
    { day_of_week: 'Monday', exercise: 'Squats', sets: 5, reps: 5 },
    { day_of_week: 'Monday', exercise: 'Bench Press', sets: 5, reps: 5 },
    { day_of_week: 'Monday', exercise: 'Barbell Row', sets: 5, reps: 5 },
    { day_of_week: 'Wednesday', exercise: 'Squats', sets: 5, reps: 5 },
    { day_of_week: 'Wednesday', exercise: 'Overhead Press', sets: 5, reps: 5 },
    { day_of_week: 'Wednesday', exercise: 'Deadlift', sets: 1, reps: 5 },
    { day_of_week: 'Friday', exercise: 'Squats', sets: 5, reps: 5 },
    { day_of_week: 'Friday', exercise: 'Bench Press', sets: 5, reps: 5 },
    { day_of_week: 'Friday', exercise: 'Barbell Row', sets: 5, reps: 5 },
  ],
  c3: [ // Arnold Split
    { day_of_week: 'Monday', exercise: 'Bench Press', sets: 5, reps: 10 },
    { day_of_week: 'Monday', exercise: 'Deadlift', sets: 5, reps: 10 },
    { day_of_week: 'Monday', exercise: 'Barbell Row', sets: 5, reps: 10 },
    { day_of_week: 'Tuesday', exercise: 'Overhead Press', sets: 5, reps: 10 },
    { day_of_week: 'Tuesday', exercise: 'Lateral Raise', sets: 5, reps: 10 },
    { day_of_week: 'Tuesday', exercise: 'Bicep Curl', sets: 5, reps: 10 },
    { day_of_week: 'Wednesday', exercise: 'Squats', sets: 5, reps: 10 },
    { day_of_week: 'Wednesday', exercise: 'Leg Curl', sets: 5, reps: 10 },
    { day_of_week: 'Wednesday', exercise: 'Leg Extension', sets: 5, reps: 10 },
  ]
};

export default function WorkoutPlanner() {
  const [activeTab, setActiveTab] = useState('my-plan');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [form, setForm] = useState({ day_of_week: 'Monday', exercise: '', sets: '3', reps: '10' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Chest');
  const [editingId, setEditingId] = useState(null);
  const { showToast, ToastComponent } = useToast();

  const [communityPlans, setCommunityPlans] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [reviewPlan, setReviewPlan] = useState(null);

  const fetchPlans = async () => {
    try {
      const res = await workoutPlanAPI.get();
      setPlans(res.data);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  };

  const fetchCommunityPlans = async () => {
    setLoadingCommunity(true);
    try {
      const res = await communityAPI.plans();
      setCommunityPlans(res.data || []);
    } catch { setCommunityPlans([]); }
    finally { setLoadingCommunity(false); }
  };

  useEffect(() => { 
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUserId(session.user.id);
    };
    fetchUser();
    fetchPlans(); 
    fetchCommunityPlans();
  }, []);

  const handleDeleteCommunityPlan = async (id) => {
    try {
      await communityAPI.delete(id);
      showToast('Program deleted from community', 'success');
      fetchCommunityPlans();
    } catch (err) {
      showToast(err || 'Failed to delete program', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exercise) return showToast('Please enter an exercise name', 'error');
    setSubmitting(true);
    try {
      const payload = { ...form, sets: parseInt(form.sets), reps: parseInt(form.reps) };
      if (editingId) {
        await workoutPlanAPI.update(editingId, payload);
        showToast('Plan updated!');
        setEditingId(null);
      } else {
        await workoutPlanAPI.create(payload);
        showToast('Exercise added to plan!');
      }
      setForm(f => ({ ...f, exercise: '', sets: '3', reps: '10' }));
      fetchPlans();
    } catch (err) { showToast(err || 'Failed to save exercise', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      day_of_week: plan.day_of_week,
      exercise: plan.exercise,
      sets: String(plan.sets),
      reps: String(plan.reps)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ day_of_week: selectedDay, exercise: '', sets: '3', reps: '10' });
  };

  const handleDelete = async (id) => {
    try {
      await workoutPlanAPI.delete(id);
      showToast('Exercise removed');
      fetchPlans();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const adoptPlan = async (template) => {
    const exercises = Array.isArray(template.exercises) ? template.exercises : COMMUNITY_PLANS_DATA[template.id];
    if (!exercises || exercises.length === 0) return showToast('This plan has no exercises.', 'error');

    showToast(`Adopting ${template.name}...`, 'success');
    setLoading(true);
    try {
      // Create all exercises from the template
      for (const ex of exercises) {
        await workoutPlanAPI.create({
          day_of_week: ex.day_of_week,
          exercise: ex.exercise,
          sets: ex.sets,
          reps: ex.reps
        });
      }
      showToast('Program adopted successfully!', 'success');
      setActiveTab('my-plan');
      fetchPlans();
    } catch (err) {
      showToast('Failed to adopt program', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShareProgram = async () => {
    if (plans.length === 0) return showToast('Your program is empty.', 'error');
    
    const name = window.prompt("Enter a name for your program (e.g. 'Push Pull Legs 2.0'):");
    if (!name) return;

    const author = window.prompt("Enter your display name (e.g. 'FitnessPro'):");
    if (!author) return;

    showToast('Sharing program...', 'success');
    try {
      await communityAPI.share({
        name,
        author,
        difficulty: 'Intermediate' // Can be enhanced later to select difficulty
      });
      showToast('Program shared successfully! Check the Community tab.', 'success');
      fetchCommunityPlans();
    } catch (err) {
      showToast(err || 'Failed to share program', 'error');
    }
  };

  const dayPlans = plans.filter(p => p.day_of_week === selectedDay);

  return (
    <div className="page-enter">
      {ToastComponent}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">TRAINING PROGRAM</h1>
        <p className="section-subtitle">Architect your success one set at a time</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        <button 
          onClick={() => setActiveTab('my-plan')}
          className={`btn ${activeTab === 'my-plan' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: '100px', padding: '10px 24px' }}
        >
          MY PROGRAM
        </button>
        <button 
          onClick={() => setActiveTab('community')}
          className={`btn ${activeTab === 'community' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: '100px', padding: '10px 24px' }}
        >
          COMMUNITY DISCOVER
        </button>
      </div>

      {activeTab === 'my-plan' ? (
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
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleEdit(plan)} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }}>Edit</button>
                        <DeleteButton onDelete={() => handleDelete(plan.id)} label="✕" />
                      </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em' }}>
                {editingId ? 'EDIT EXERCISE' : 'ADD EXERCISE'}
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }}>CANCEL</button>
              )}
            </div>
            
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
                {submitting ? 'Saving...' : editingId ? 'UPDATE PLAN' : '+ ADD TO PLAN'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {[...COMMUNITY_PLANS, ...communityPlans].map(plan => (
            <div key={plan.id} className="card hover-lift">
              <div className="flex justify-between items-start" style={{ marginBottom: '16px' }}>
                <div>
                  <div className="badge badge-accent" style={{ marginBottom: '8px' }}>{(plan.difficulty || 'Intermediate').toUpperCase()}</div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-display)' }}>{plan.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {plan.user_id && plan.user_id === currentUserId && (
                    <DeleteButton onDelete={() => handleDeleteCommunityPlan(plan.id)} />
                  )}
                  <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: '700' }}>★ {plan.rating || '5.0'}</div>
                </div>
              </div>
              
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                <div style={{ marginBottom: '4px' }}>Author: <span style={{ color: 'var(--text-primary)' }}>{plan.author}</span></div>
                <div>Exercises: <span style={{ color: 'var(--text-primary)' }}>{Array.isArray(plan.exercises) ? plan.exercises.length : plan.exercises}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button 
                  onClick={() => setReviewPlan(plan)}
                  className="btn btn-ghost" 
                  style={{ flex: 1, borderRadius: '8px', fontSize: '12px' }}
                >
                  VIEW PROGRAM
                </button>
                <button 
                  onClick={() => adoptPlan(plan)}
                  className="btn btn-primary" 
                  style={{ flex: 1, borderRadius: '8px' }}
                >
                  ADOPT
                </button>
              </div>
            </div>
          ))}
          <div onClick={handleShareProgram} className="card hover-lift" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', background: 'transparent' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>SHARE YOUR PLAN</div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewPlan && (() => {
        const exercises = Array.isArray(reviewPlan.exercises) ? reviewPlan.exercises : COMMUNITY_PLANS_DATA[reviewPlan.id];
        if (!exercises) return null;
        const grouped = {};
        DAYS.forEach(d => { const e = exercises.filter(ex => ex.day_of_week === d); if (e.length) grouped[d] = e; });
        return (
          <div onClick={() => setReviewPlan(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-bright)',
                maxWidth: '600px', width: '100%', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
              }}
            >
              {/* Header */}
              <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="badge badge-accent" style={{ marginBottom: '8px', display: 'inline-block' }}>{(reviewPlan.difficulty || 'Intermediate').toUpperCase()}</span>
                    <h2 style={{ margin: '8px 0 4px', fontFamily: 'var(--font-display)', fontSize: '22px' }}>{reviewPlan.name}</h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      by <span style={{ color: 'var(--accent)' }}>{reviewPlan.author}</span>
                      <span style={{ margin: '0 8px' }}>·</span>
                      ★ {reviewPlan.rating || '5.0'}
                      <span style={{ margin: '0 8px' }}>·</span>
                      {exercises.length} exercises
                    </div>
                  </div>
                  <button onClick={() => setReviewPlan(null)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '16px' }}>✕</button>
                </div>
              </div>
              {/* Body - exercise list grouped by day */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                {Object.entries(grouped).map(([day, dayExercises]) => (
                  <div key={day} style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px',
                      fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', color: 'var(--accent)'
                    }}>
                      <span>{day.toUpperCase()}</span>
                      <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{dayExercises.length} exercises</span>
                    </div>
                    {dayExercises.map((ex, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        marginBottom: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>{i + 1}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{ex.exercise}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ex.sets} × {ex.reps}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setReviewPlan(null)} className="btn btn-ghost" style={{ borderRadius: '8px' }}>CLOSE</button>
                <button onClick={() => { adoptPlan(reviewPlan); setReviewPlan(null); }} className="btn btn-primary" style={{ borderRadius: '8px' }}>
                  ADOPT PROGRAM
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
