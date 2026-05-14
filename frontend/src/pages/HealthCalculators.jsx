import React, { useState, useEffect } from 'react';
import { inbodyAPI } from '../utils/api';

export default function HealthCalculators() {
  const [weight, setWeight] = useState('80');
  const [height, setHeight] = useState('180');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('1.55');
  const [latestScan, setLatestScan] = useState(null);
  const [scanLoaded, setScanLoaded] = useState(false);

  // Auto-fill from latest InBody scan
  useEffect(() => {
    inbodyAPI.latest()
      .then(res => {
        const scan = res.data;
        if (scan) {
          setLatestScan(scan);
          if (scan.weight) setWeight(String(scan.weight));
          if (scan.height) setHeight(String(scan.height));
          if (scan.age) setAge(String(scan.age));
          if (scan.gender) setGender(scan.gender.toLowerCase() === 'female' ? 'female' : 'male');
          setScanLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  const bmi = (parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1);
  
  // Mifflin-St Jeor Equation
  const bmr = gender === 'male' 
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  
  const tdee = Math.round(bmr * parseFloat(activity));

  // Use InBody's measured BMR if available (more accurate than formula)
  const measuredBMR = latestScan?.bmr;
  const measuredTDEE = measuredBMR ? Math.round(measuredBMR * parseFloat(activity)) : null;

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

      {/* InBody Banner */}
      {scanLoaded && latestScan && (
        <div style={{
          padding: '12px 20px', marginBottom: '20px',
          background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(232,255,71,0.25)',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '16px' }}>📷</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>
              Auto-filled from InBody Scan · {latestScan.date}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Weight, height, age and gender imported from your latest body scan
            </div>
          </div>
          <button
            onClick={() => { setWeight('80'); setHeight('180'); setAge('25'); setGender('male'); setScanLoaded(false); }}
            className="btn btn-ghost"
            style={{ fontSize: '10px', padding: '4px 10px' }}
          >RESET</button>
        </div>
      )}

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

          {/* InBody extras */}
          {latestScan && (
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>From InBody Scan</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Body Fat %', val: latestScan.body_fat_percent ? `${latestScan.body_fat_percent}%` : '—' },
                  { label: 'Muscle Mass', val: latestScan.skeletal_muscle_mass ? `${latestScan.skeletal_muscle_mass} kg` : '—' },
                  { label: 'Lean Mass', val: latestScan.lean_body_mass ? `${latestScan.lean_body_mass} kg` : '—' },
                  { label: 'Visceral Fat', val: latestScan.visceral_fat_level || '—' },
                  { label: 'Metabolic Age', val: latestScan.metabolic_age ? `${latestScan.metabolic_age} yrs` : '—' },
                  { label: 'Measured BMR', val: latestScan.bmr ? `${latestScan.bmr} kcal` : '—' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* BMI Result */}
          <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${bmiCat.color}` }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>BODY MASS INDEX (BMI)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: bmiCat.color, lineHeight: 1 }}>
              {latestScan?.bmi || bmi}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px', color: bmiCat.color }}>{bmiCat.label.toUpperCase()}</div>
            {latestScan?.bmi && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>📷 From InBody scan</div>
            )}
            <div style={{ marginTop: '16px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', height: '12px', width: '2px', background: 'white', top: '-4px', 
                left: `${Math.min(Math.max((bmi - 15) / 20 * 100, 0), 100)}%`, transition: 'left 0.5s' 
              }} />
            </div>
          </div>

          {/* TDEE Result — shows both measured and calculated */}
          <div className="card" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>DAILY ENERGY EXPENDITURE (TDEE)</div>
            
            {measuredTDEE ? (
              <>
                <div style={{ fontSize: '10px', color: 'var(--accent)', marginBottom: '4px' }}>📷 InBody Measured (more accurate)</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--accent)', lineHeight: 1 }}>{measuredTDEE}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Based on your measured BMR: {measuredBMR} kcal</div>
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Formula estimate: {tdee} kcal/day (Mifflin-St Jeor)
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--accent)', lineHeight: 1 }}>{tdee}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Calories needed per day</div>
              </>
            )}
            
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CUT (-500)</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{(measuredTDEE || tdee) - 500}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BULK (+300)</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{(measuredTDEE || tdee) + 300}</div>
              </div>
            </div>
          </div>

          {/* Lean Mass Protein Target */}
          {latestScan?.lean_body_mass && (
            <div className="card" style={{ border: '1px solid rgba(46,213,255,0.2)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#2ed5ff', marginBottom: '8px' }}>PROTEIN TARGET (Based on Lean Mass)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MAINTENANCE (1.6g/kg LBM)</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#2ed5ff' }}>
                    {Math.round(latestScan.lean_body_mass * 1.6)}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BUILDING (2.2g/kg LBM)</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#ff9f43' }}>
                    {Math.round(latestScan.lean_body_mass * 2.2)}g
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                📷 Based on your lean body mass: {latestScan.lean_body_mass} kg
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
