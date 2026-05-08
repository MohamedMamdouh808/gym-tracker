import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { mealsAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';

ChartJS.register(ArcElement, Tooltip, Legend);

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'];

const COMMON_FOODS = [
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Brown Rice (100g)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: 'Eggs (1 large)', calories: 72, protein: 6, carbs: 0.4, fat: 5 },
  { name: 'Oats (100g)', calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Banana (1 medium)', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Almonds (30g)', calories: 174, protein: 6, carbs: 6, fat: 15 },
  { name: 'Greek Yogurt (200g)', calories: 130, protein: 22, carbs: 7, fat: 0.7 },
  { name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fat: 13 },
];

export default function MealTracker() {
  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], meal_type: 'Breakfast', food_name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const fetchMeals = async () => {
    try {
      const res = await mealsAPI.today();
      setMeals(res.data.meals);
      setTotals(res.data.totals);
    } catch { setMeals([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeals(); }, []);

  const fillFromPreset = (food) => {
    setForm(f => ({ ...f, food_name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.food_name) return showToast('Please enter a food name', 'error');
    setSubmitting(true);
    try {
      await mealsAPI.log({ ...form, calories: parseFloat(form.calories) || 0, protein: parseFloat(form.protein) || 0, carbs: parseFloat(form.carbs) || 0, fat: parseFloat(form.fat) || 0 });
      showToast('Meal logged!');
      setForm({ date: new Date().toISOString().split('T')[0], meal_type: 'Breakfast', food_name: '', calories: '', protein: '', carbs: '', fat: '' });
      fetchMeals();
    } catch (err) { showToast(err || 'Failed to log meal', 'error'); }
    finally { setSubmitting(false); }
  };

  const macroChart = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [totals.protein * 4, totals.carbs * 4, totals.fat * 9],
      backgroundColor: ['rgba(46,213,255,0.8)', 'rgba(255,159,67,0.8)', 'rgba(255,71,87,0.8)'],
      borderColor: ['#2ed5ff', '#ff9f43', '#ff4757'],
      borderWidth: 1,
    }],
  };

  const mealsByType = MEAL_TYPES.map(type => ({
    type,
    meals: meals.filter(m => m.meal_type === type),
  })).filter(g => g.meals.length > 0);

  return (
    <div className="main-content">
      {ToastComponent}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">MEAL TRACKER</h1>
        <p className="section-subtitle">Track your nutrition and macros</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '16px' }}>LOG MEAL</div>
          
          {/* Quick fill */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">Quick Fill</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COMMON_FOODS.map(f => (
                <button key={f.name} type="button" onClick={() => fillFromPreset(f)} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }}>
                  {f.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ marginBottom: '14px' }}>
              <div>
                <label className="input-label">Date</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Meal Type</label>
                <select className="input" value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
                  {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Food Name *</label>
              <input type="text" className="input" placeholder="e.g. Chicken breast" value={form.food_name} onChange={e => setForm({...form, food_name: e.target.value})} />
            </div>
            <div className="grid-2" style={{ marginBottom: '14px' }}>
              <div>
                <label className="input-label">Calories</label>
                <input type="number" className="input" placeholder="165" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Protein (g)</label>
                <input type="number" step="0.1" className="input" placeholder="31" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} />
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <label className="input-label">Carbs (g)</label>
                <input type="number" step="0.1" className="input" placeholder="0" value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Fat (g)</label>
                <input type="number" step="0.1" className="input" placeholder="3.6" value={form.fat} onChange={e => setForm({...form, fat: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Saving...' : '+ LOG MEAL'}
            </button>
          </form>
        </div>

        {/* Daily totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>TODAY'S TOTALS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Calories', value: Math.round(totals.calories), unit: 'kcal', color: 'var(--accent)' },
                { label: 'Protein', value: Math.round(totals.protein), unit: 'g', color: 'var(--blue)' },
                { label: 'Carbs', value: Math.round(totals.carbs), unit: 'g', color: 'var(--orange)' },
                { label: 'Fat', value: Math.round(totals.fat), unit: 'g', color: 'var(--red)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'min(26px, 6vw)', color: s.color }}>{s.value} <span style={{ fontSize: '14px' }}>{s.unit}</span></div>
                </div>
              ))}
            </div>
            {totals.calories > 0 && (
              <div style={{ height: '160px' }}>
                <Doughnut data={macroChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#7a8fa0', font: { size: 11 } } } } }} />
              </div>
            )}
          </div>
          
          {/* Calorie goal progress */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '12px' }}>CALORIE GOAL (2000 kcal)</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(totals.calories / 2000 * 100, 100)}%`, background: totals.calories > 2000 ? 'var(--red)' : 'var(--accent)', transition: 'width 0.5s', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>{Math.round(totals.calories)} consumed</span>
              <span>{Math.max(0, 2000 - totals.calories)} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meals list */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '16px' }}>TODAY'S MEALS</div>
        {loading ? <div className="skeleton" style={{ height: '200px' }} /> : mealsByType.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
            {mealsByType.map(group => (
              <div key={group.type}>
                <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>{group.type}</div>
                {group.meals.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '13px' }}>{m.food_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{m.calories} kcal</span>
                      <span style={{ color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>P: {m.protein}g</span>
                      <span style={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>C: {m.carbs}g</span>
                      <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>F: {m.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '13px' }}>No meals logged today</div>
        )}
      </div>
    </div>
  );
}
