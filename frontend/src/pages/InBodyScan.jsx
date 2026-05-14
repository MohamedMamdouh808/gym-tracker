import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { inbodyAPI } from '../utils/api';
import DeleteButton from '../components/DeleteButton';

const METRIC_GROUPS = [
  {
    title: 'BODY COMPOSITION',
    color: 'var(--accent)',
    metrics: [
      { key: 'weight', label: 'Weight', unit: 'kg', icon: '◈' },
      { key: 'lean_body_mass', label: 'Lean Body Mass', unit: 'kg', icon: '💪' },
      { key: 'body_fat_mass', label: 'Body Fat Mass', unit: 'kg', icon: '⊕' },
      { key: 'skeletal_muscle_mass', label: 'Skeletal Muscle', unit: 'kg', icon: '⚡' },
      { key: 'total_body_water', label: 'Total Body Water', unit: 'L', icon: '💧' },
    ]
  },
  {
    title: 'BODY INDEXES',
    color: '#2ed5ff',
    metrics: [
      { key: 'bmi', label: 'BMI', unit: '', icon: '⬡' },
      { key: 'body_fat_percent', label: 'Body Fat %', unit: '%', icon: '%' },
      { key: 'visceral_fat_level', label: 'Visceral Fat Level', unit: '', icon: '◉' },
      { key: 'metabolic_age', label: 'Metabolic Age', unit: 'yrs', icon: '⏱' },
    ]
  },
  {
    title: 'ENERGY & NUTRITION',
    color: '#ff9f43',
    metrics: [
      { key: 'bmr', label: 'Basal Metabolic Rate', unit: 'kcal', icon: '🔥' },
      { key: 'protein', label: 'Protein Mass', unit: 'kg', icon: '🥩' },
      { key: 'minerals', label: 'Minerals', unit: 'kg', icon: '⬢' },
    ]
  },
  {
    title: 'SEGMENT ANALYSIS',
    color: 'var(--green)',
    metrics: [
      { key: 'right_arm_muscle', label: 'R. Arm Muscle', unit: 'kg', icon: '◑' },
      { key: 'left_arm_muscle', label: 'L. Arm Muscle', unit: 'kg', icon: '◐' },
      { key: 'trunk_muscle', label: 'Trunk Muscle', unit: 'kg', icon: '▣' },
      { key: 'right_leg_muscle', label: 'R. Leg Muscle', unit: 'kg', icon: '◗' },
      { key: 'left_leg_muscle', label: 'L. Leg Muscle', unit: 'kg', icon: '◖' },
    ]
  },
];

function MetricCard({ label, value, unit, icon, color }) {
  if (value === null || value === undefined) return null;
  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '700', flexShrink: 0
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color, lineHeight: 1 }}>
          {value} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ scan, onExpand, expanded, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...scan });

  const handleSave = (e) => {
    e.stopPropagation();
    const payload = { ...editForm };
    // Convert numerical strings to numbers
    Object.keys(payload).forEach(key => {
      if (key !== 'date' && key !== 'gender' && key !== 'id' && key !== 'user_id' && key !== 'segment_data' && payload[key] !== null) {
        payload[key] = parseFloat(payload[key]);
      }
    });
    onUpdate(scan.id, payload);
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditForm({ ...scan });
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${expanded ? 'rgba(232,255,71,0.3)' : 'var(--border)'}`,
      background: expanded ? 'var(--bg-elevated)' : 'transparent',
      overflow: 'hidden',
      transition: 'all 0.2s',
      marginBottom: '8px',
    }}>
      <div
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flex: 1, cursor: 'pointer' }} onClick={onExpand}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <input 
                type="date" 
                value={editForm.date} 
                onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))} 
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
              />
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  value={editForm.weight} 
                  onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))} 
                  placeholder="Weight"
                  style={{ width: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                />
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-muted)' }}>kg</span>
              </div>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{scan.date}</span>
              {scan.weight !== null && <span style={{ fontSize: '13px', fontWeight: '500' }}>⚖️ {scan.weight} kg</span>}
              {scan.body_fat_percent !== null && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔥 {scan.body_fat_percent}% fat</span>}
              {scan.skeletal_muscle_mass !== null && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>💪 {scan.skeletal_muscle_mass} kg muscle</span>}
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn-accent" style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}>SAVE</button>
              <button onClick={handleCancel} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}>CANCEL</button>
            </>
          ) : (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                title="Edit scan"
              >✏️</button>
              <DeleteButton onDelete={() => onDelete(scan.id)} />
              <button 
                onClick={onExpand} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', marginLeft: '4px', padding: '4px' }}
              >
                {expanded ? '▲' : '▼'}
              </button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {[
            { label: 'Weight', key: 'weight', unit: 'kg' },
            { label: 'Body Fat %', key: 'body_fat_percent', unit: '%' },
            { label: 'Muscle Mass', key: 'skeletal_muscle_mass', unit: 'kg' },
            { label: 'Lean Mass', key: 'lean_body_mass', unit: 'kg' },
            { label: 'BMI', key: 'bmi', unit: '' },
            { label: 'BMR', key: 'bmr', unit: 'kcal' },
            { label: 'Visceral Fat', key: 'visceral_fat_level', unit: 'Lvl' },
            { label: 'Metabolic Age', key: 'metabolic_age', unit: 'yrs' },
            { label: 'Protein', key: 'protein', unit: 'kg' },
            { label: 'Minerals', key: 'minerals', unit: 'kg' },
            { label: 'Body Water', key: 'total_body_water', unit: 'L' },
            
            // Segment Muscle
            { label: 'R. Arm Muscle', key: 'right_arm_muscle', unit: 'kg' },
            { label: 'L. Arm Muscle', key: 'left_arm_muscle', unit: 'kg' },
            { label: 'Trunk Muscle', key: 'trunk_muscle', unit: 'kg' },
            { label: 'R. Leg Muscle', key: 'right_leg_muscle', unit: 'kg' },
            { label: 'L. Leg Muscle', key: 'left_leg_muscle', unit: 'kg' },

            // Personal
            { label: 'Height', key: 'height', unit: 'cm' },
            { label: 'Age', key: 'age', unit: 'yrs' },
          ].map(({ label, key, unit }) => {
            const val = isEditing ? editForm[key] : scan[key];
            if (!isEditing && (val === null || val === undefined || String(val) === 'null')) return null;
            return (
              <div key={label} style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                {isEditing ? (
                  <div style={{ position: 'relative', marginTop: '4px' }}>
                    <input 
                      type="number" 
                      step="0.1"
                      value={val || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-muted)' }}>{unit}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginTop: '2px' }}>
                    {val} <span style={{ fontSize: '10px', fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InBodyScan() {
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history'
  const fileInputRef = useRef();
  const { showToast, ToastComponent } = useToast();

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await inbodyAPI.history();
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id) => {
    try {
      await inbodyAPI.delete(id);
      showToast('Scan deleted successfully', 'success');
      fetchHistory();
    } catch (err) {
      showToast(err || 'Failed to delete scan', 'error');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await inbodyAPI.update(id, data);
      showToast('Scan updated successfully', 'success');
      fetchHistory();
    } catch (err) {
      showToast(err || 'Failed to update scan', 'error');
    }
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPG, PNG, WEBP)', 'error');
      return;
    }
    setImageFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setScanning(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const json = await inbodyAPI.scan(formData);
      if (!json.success) throw new Error(json.error || 'Extraction failed');

      setResult(json);
      showToast(json.message || 'Scan complete!', 'success');
      if (json.weightLogged) {
        showToast('✅ Weight auto-logged to Weight Tracker', 'success');
      }
      fetchHistory();
    } catch (err) {
      showToast(err.toString() || 'Failed to analyze image', 'error');
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
  };

  const extracted = result?.extracted || {};
  const metricCount = Object.values(extracted).filter(v => v !== null && v !== undefined).length;

  return (
    <div>
      {ToastComponent}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">INBODY SCAN</h1>
        <p className="section-subtitle">Upload your InBody report — AI extracts all metrics automatically</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {[{ id: 'scan', label: '📷 New Scan' }, { id: 'history', label: '📋 History' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#000' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? '700' : '400',
              cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ===== SCAN TAB ===== */}
      {activeTab === 'scan' && (
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.8fr' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Upload Panel */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em', marginBottom: '20px' }}>
              UPLOAD SCAN
            </div>

            {!imagePreview ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  transition: 'all 0.2s',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '48px', opacity: dragOver ? 1 : 0.5 }}>📷</div>
                <div style={{ fontSize: '14px', color: dragOver ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '600' }}>
                  {dragOver ? 'Drop your InBody scan here' : 'Drag & drop or click to upload'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JPG, PNG, WEBP • Max 10MB</div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img
                    src={imagePreview}
                    alt="InBody scan preview"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', maxHeight: '300px', objectFit: 'contain', background: '#000' }}
                  />
                  <button
                    onClick={resetScan}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid var(--border)',
                      color: 'white', cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {imageFile?.name} ({(imageFile?.size / 1024).toFixed(0)} KB)
                </div>
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="btn btn-primary"
                  style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
                >
                  {scanning ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                      AI SCANNING...
                    </span>
                  ) : '🔍 ANALYZE WITH AI'}
                </button>
                {scanning && (
                  <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Reading metrics from your InBody report...
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            {!imagePreview && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>How It Works</div>
                {['Upload your InBody scan photo', 'AI extracts all body composition data', 'Weight & body fat auto-saved to tracker', 'Full scan stored in your history'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{step}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Panel */}
          {result && (
            <div>
              {/* Success header */}
              <div className="card" style={{ marginBottom: '16px', background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--accent)' }}>
                      ✅ {metricCount} Metrics Extracted
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Full scan saved to history · Data distributed to all pages
                    </div>
                  </div>
                  <button onClick={resetScan} className="btn btn-ghost" style={{ fontSize: '11px' }}>↑ UPLOAD NEW</button>
                </div>

                {/* Data routing status */}
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {[
                    {
                      page: '⚖️ Weight Tracker',
                      items: [
                        extracted.weight ? `Weight: ${extracted.weight} kg ✓` : null,
                        extracted.body_fat_percent ? `Body Fat: ${extracted.body_fat_percent}% ✓` : null,
                      ].filter(Boolean),
                      saved: result.weightLogged,
                    },
                    {
                      page: '⚡ Calculators',
                      items: [
                        extracted.height ? `Height: ${extracted.height} cm ✓` : null,
                        extracted.age ? `Age: ${extracted.age} ✓` : null,
                        extracted.bmr ? `BMR: ${extracted.bmr} kcal ✓` : null,
                        extracted.gender ? `Gender: ${extracted.gender} ✓` : null,
                      ].filter(Boolean),
                      saved: !!(extracted.height || extracted.bmr),
                    },
                    {
                      page: '✨ AI Coach',
                      items: [
                        'Body composition ✓',
                        'BMR & metabolism ✓',
                        'Visceral fat level ✓',
                      ],
                      saved: true,
                    },
                  ].map(route => (
                    <div key={route.page} style={{
                      padding: '12px', borderRadius: 'var(--radius-sm)',
                      background: route.saved ? 'rgba(0,0,0,0.3)' : 'rgba(255,71,87,0.08)',
                      border: `1px solid ${route.saved ? 'rgba(232,255,71,0.15)' : 'rgba(255,71,87,0.2)'}`,
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: route.saved ? 'var(--accent)' : '#ff4757' }}>
                        {route.page}
                      </div>
                      {route.items.length > 0 ? route.items.map(item => (
                        <div key={item} style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{item}</div>
                      )) : (
                        <div style={{ fontSize: '10px', color: '#ff4757' }}>No data found</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric Groups */}
              {METRIC_GROUPS.map(group => {
                const visibleMetrics = group.metrics.filter(m => {
                  const val = extracted[m.key] ?? extracted.segment_data?.[m.key];
                  return val !== null && val !== undefined;
                });
                if (visibleMetrics.length === 0) return null;
                return (
                  <div key={group.title} className="card" style={{ marginBottom: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '0.08em', color: group.color, marginBottom: '14px', borderBottom: `1px solid ${group.color}30`, paddingBottom: '8px' }}>
                      {group.title}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                      {visibleMetrics.map(m => {
                        const val = extracted[m.key] ?? extracted.segment_data?.[m.key];
                        return <MetricCard key={m.key} label={m.label} value={val} unit={m.unit} icon={m.icon} color={group.color} />;
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Extra info */}
              {(extracted.height || extracted.age || extracted.gender) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>PERSONAL INFO</div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {extracted.height && <div style={{ fontSize: '14px' }}>📏 Height: <strong>{extracted.height} cm</strong></div>}
                    {extracted.age && <div style={{ fontSize: '14px' }}>🎂 Age: <strong>{extracted.age} yrs</strong></div>}
                    {extracted.gender && <div style={{ fontSize: '14px' }}>👤 Gender: <strong style={{ textTransform: 'capitalize' }}>{extracted.gender}</strong></div>}
                    {extracted.date && <div style={{ fontSize: '14px' }}>📅 Scan Date: <strong>{extracted.date}</strong></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.06em' }}>SCAN HISTORY</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{history.length} scan{history.length !== 1 ? 's' : ''}</span>
          </div>

          {historyLoading ? (
            <div className="skeleton" style={{ height: '200px' }} />
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>📋</div>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>No scans yet</div>
              <div style={{ fontSize: '12px' }}>Upload your first InBody scan to see history here</div>
            </div>
          ) : (
            <div>
              {/* Trend summary */}
              {history.length >= 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {[
                    { label: 'Weight Change', val: history[0]?.weight && history[history.length-1]?.weight ? `${((history[0].weight - history[history.length-1].weight) * -1).toFixed(1)} kg` : '—', color: 'var(--accent)' },
                    { label: 'Fat % Change', val: history[0]?.body_fat_percent && history[history.length-1]?.body_fat_percent ? `${((history[0].body_fat_percent - history[history.length-1].body_fat_percent) * -1).toFixed(1)}%` : '—', color: '#ff9f43' },
                    { label: 'Muscle Change', val: history[0]?.skeletal_muscle_mass && history[history.length-1]?.skeletal_muscle_mass ? `${(history[0].skeletal_muscle_mass - history[history.length-1].skeletal_muscle_mass).toFixed(1)} kg` : '—', color: 'var(--green)' },
                    { label: 'Total Scans', val: history.length, color: '#2ed5ff' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: s.color, lineHeight: 1, marginTop: '4px' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              )}
              {history.map(scan => (
                <HistoryRow
                  key={scan.id}
                  scan={scan}
                  expanded={expandedId === scan.id}
                  onExpand={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
