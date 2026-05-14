import React, { useState } from 'react';

export default function HealthCalculators() {
  const [weight, setWeight] = useState('80');
  const [height, setHeight] = useState('180');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('1.55'); // Moderate

  const bmi = (parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1);
  
  // Mifflin-St Jeor Equation
  const bmr = gender === 'male' 
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  
  const tdee = Math.round(bmr * parseFloat(activity));

  const getBMICategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: '#2ed5ff' };
    if (val < 25) return { label: 'Healthy', color: 'var(--green)' };
    if (val < 30) return { label: 'Overweight', color: 'var(--orange)' };
    return { label: 'Obese', color: '#ff4757' };
  };

  const bmiCat = getBMICategory(bmi);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">HEALTH CALCULATORS</h1>
        <p className="section-subtitle">Science-based metrics for your physique</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '0.06em', marginBottom: '24px' }}>INPUT METRICS</div>
          
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label className="input-label">Weight (kg)</label>
              <input type="number" className="input" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Height (cm)</label>
              <input type="number" className="input" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label className="input-label">Age</label>
              <input type="number" className="input" value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Gender</label>
              <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Activity Level</label>
            <select className="input" value={activity} onChange={e => setActivity(e.target.value)}>
              <option value="1.2">Sedentary (Little/no exercise)</option>
              <option value="1.375">Light (1-3 days/week)</option>
              <option value="1.55">Moderate (3-5 days/week)</option>
              <option value="1.725">Active (6-7 days/week)</option>
              <option value="1.9">Extra Active (Elite athlete)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* BMI Result */}
          <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${bmiCat.color}` }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>BODY MASS INDEX (BMI)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: bmiCat.color, lineHeight: 1 }}>{bmi}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px', color: bmiCat.color }}>{bmiCat.label.toUpperCase()}</div>
            <div style={{ marginTop: '16px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', height: '12px', width: '2px', background: 'white', top: '-4px', 
                left: `${Math.min(Math.max((bmi - 15) / 20 * 100, 0), 100)}%`, transition: 'left 0.5s' 
              }} />
            </div>
          </div>

          {/* TDEE Result */}
          <div className="card" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>DAILY ENERGY EXPENDITURE (TDEE)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--accent)', lineHeight: 1 }}>{tdee}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Calories needed per day</div>
            
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CUT (-500)</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{tdee - 500}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BULK (+300)</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{tdee + 300}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
