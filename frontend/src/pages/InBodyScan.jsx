import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { inbodyAPI } from '../utils/api';
import DeleteButton from '../components/DeleteButton';
import { 
  Scale, BicepsFlexed, Zap, Droplet, Activity, Timer, 
  Flame, Beef, TrendingUp, Ruler, Calendar, User,
  Search, CheckCircle, FileText, Camera, Loader2, Pencil
} from 'lucide-react';

const METRIC_GROUPS = [
  {
    title: 'BODY COMPOSITION',
    color: 'var(--accent)',
    metrics: [
      { key: 'weight', label: 'Weight', unit: 'kg', icon: Scale },
      { key: 'lean_body_mass', label: 'Lean Body Mass', unit: 'kg', icon: BicepsFlexed },
      { key: 'body_fat_mass', label: 'Body Fat Mass', unit: 'kg', icon: Activity },
      { key: 'skeletal_muscle_mass', label: 'Skeletal Muscle', unit: 'kg', icon: Zap },
      { key: 'total_body_water', label: 'Total Body Water', unit: 'L', icon: Droplet },
    ]
  },
  {
    title: 'BODY INDEXES',
    color: '#2ed5ff',
    metrics: [
      { key: 'bmi', label: 'BMI', unit: '', icon: TrendingUp },
      { key: 'body_fat_percent', label: 'Body Fat %', unit: '%', icon: Activity },
      { key: 'visceral_fat_level', label: 'Visceral Fat Level', unit: '', icon: Flame },
      { key: 'metabolic_age', label: 'Metabolic Age', unit: 'yrs', icon: Timer },
    ]
  },
  {
    title: 'ENERGY & NUTRITION',
    color: '#ff9f43',
    metrics: [
      { key: 'bmr', label: 'Basal Metabolic Rate', unit: 'kcal', icon: Flame },
      { key: 'protein', label: 'Protein Mass', unit: 'kg', icon: Beef },
      { key: 'minerals', label: 'Minerals', unit: 'kg', icon: Activity },
    ]
  },
  {
    title: 'SEGMENT ANALYSIS',
    color: 'var(--green)',
    metrics: [
      { key: 'right_arm_muscle', label: 'R. Arm Muscle', unit: 'kg', icon: BicepsFlexed },
      { key: 'left_arm_muscle', label: 'L. Arm Muscle', unit: 'kg', icon: BicepsFlexed },
      { key: 'trunk_muscle', label: 'Trunk Muscle', unit: 'kg', icon: BicepsFlexed },
      { key: 'right_leg_muscle', label: 'R. Leg Muscle', unit: 'kg', icon: BicepsFlexed },
      { key: 'left_leg_muscle', label: 'L. Leg Muscle', unit: 'kg', icon: BicepsFlexed },
    ]
  },
];

function MetricCard({ label, value, unit, icon: Icon, color }) {
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
      }}><Icon size={18} /></div>
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

  const allMetrics = [
    { key: 'weight', label: 'Weight', unit: 'kg' },
    { key: 'lean_body_mass', label: 'Lean Body Mass', unit: 'kg' },
    { key: 'body_fat_mass', label: 'Body Fat Mass', unit: 'kg' },
    { key: 'skeletal_muscle_mass', label: 'Skeletal Muscle', unit: 'kg' },
    { key: 'total_body_water', label: 'Total Body Water', unit: 'L' },
    { key: 'bmi', label: 'BMI', unit: '' },
    { key: 'body_fat_percent', label: 'Body Fat %', unit: '%' },
    { key: 'visceral_fat_level', label: 'Visceral Fat', unit: '' },
    { key: 'metabolic_age', label: 'Metabolic Age', unit: 'yrs' },
    { key: 'bmr', label: 'BMR', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'kg' },
    { key: 'minerals', label: 'Minerals', unit: 'kg' },
    { key: 'height', label: 'Height', unit: 'cm' },
    { key: 'age', label: 'Age', unit: 'yrs' },
  ];

  const segmentMuscleMetrics = [
    { key: 'right_arm_muscle', label: 'R. Arm Muscle', unit: 'kg' },
    { key: 'left_arm_muscle', label: 'L. Arm Muscle', unit: 'kg' },
    { key: 'trunk_muscle', label: 'Trunk Muscle', unit: 'kg' },
    { key: 'right_leg_muscle', label: 'R. Leg Muscle', unit: 'kg' },
    { key: 'left_leg_muscle', label: 'L. Leg Muscle', unit: 'kg' },
  ];

  const segmentFatMetrics = [
    { key: 'right_arm_fat', label: 'R. Arm Fat', unit: 'kg' },
    { key: 'left_arm_fat', label: 'L. Arm Fat', unit: 'kg' },
    { key: 'trunk_fat', label: 'Trunk Fat', unit: 'kg' },
    { key: 'right_leg_fat', label: 'R. Leg Fat', unit: 'kg' },
    { key: 'left_leg_fat', label: 'L. Leg Fat', unit: 'kg' },
  ];

  const getValue = (key) => isEditing ? editForm[key] : scan[key];
  const getSegmentValue = (key) => {
    if (isEditing) return editForm.segment_data?.[key];
    return scan.segment_data?.[key];
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${expanded ? 'rgba(232,255,71,0.4)' : 'var(--border)'}`,
      background: 'var(--bg-card)',
      overflow: 'hidden',
      transition: 'all 0.25s',
      marginBottom: '12px',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer',
          background: expanded ? 'var(--bg-elevated)' : 'transparent',
        }}
        onClick={onExpand}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <input 
                type="date" 
                value={editForm.date} 
                onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))} 
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '13px' }}
              />
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  value={editForm.weight} 
                  onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))} 
                  placeholder="Weight"
                  style={{ width: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '6px 10px 6px 30px', borderRadius: '6px', fontSize: '13px' }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
              </div>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{scan.date}</span>
              {scan.weight !== null && <span style={{ fontSize: '13px', fontWeight: '600' }}><Scale size={14} /> {scan.weight} kg</span>}
              {scan.body_fat_percent !== null && <span style={{ fontSize: '13px', color: '#ff9f43' }}><Flame size={14} /> {scan.body_fat_percent}%</span>}
              {scan.skeletal_muscle_mass !== null && <span style={{ fontSize: '13px', color: 'var(--green)' }}><BicepsFlexed size={14} /> {scan.skeletal_muscle_mass} kg</span>}
              {scan.bmi !== null && <span style={{ fontSize: '13px', color: '#2ed5ff' }}><TrendingUp size={14} /> {scan.bmi}</span>}
              {scan.bmr !== null && <span style={{ fontSize: '13px', color: '#ff6b81' }}><Flame size={14} /> {scan.bmr} kcal</span>}
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn-accent" style={{ padding: '6px 14px', fontSize: '12px', height: '32px' }}>SAVE</button>
              <button onClick={handleCancel} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '12px', height: '32px' }}>CANCEL</button>
            </>
          ) : (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                title="Edit scan"
              ><Pencil size={16} /></button>
              <DeleteButton onDelete={() => onDelete(scan.id)} />
              <span style={{ 
                width: '32px', height: '32px', borderRadius: '50%',
                background: expanded ? 'var(--accent)' : 'var(--bg-elevated)',
                color: expanded ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', transition: 'all 0.2s',
                border: '1px solid var(--border)'
              }}>
                {expanded ? '▲' : '▼'}
              </span>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          {isEditing && (
            <div style={{ margin: '16px 0 0', padding: '12px 16px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px' }}>
              Click on any value below to edit · Press SAVE when done
            </div>
          )}
          
          {/* BODY COMPOSITION */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '12px', background: 'var(--accent)', borderRadius: '2px' }}></span>
              BODY COMPOSITION
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {allMetrics.filter(m => m.key !== 'height' && m.key !== 'age').map(({ key, label, unit }) => {
                const val = getValue(key);
                if (!isEditing && (val === null || val === undefined || String(val) === 'null')) return null;
                return (
                  <div key={key} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                    {isEditing ? (
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          step="0.1"
                          value={val || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '6px 8px', borderRadius: '4px', fontSize: '14px' }}
                        />
                        {unit && <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-muted)' }}>{unit}</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                        {val} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEGMENT MUSCLE ANALYSIS */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '12px', background: 'var(--green)', borderRadius: '2px' }}></span>
              SEGMENT MUSCLE ANALYSIS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {segmentMuscleMetrics.map(({ key, label, unit }) => {
                const val = getSegmentValue(key);
                if (!isEditing && (val === null || val === undefined || String(val) === 'null')) return null;
                return (
                  <div key={key} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        step="0.1"
                        value={val || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, segment_data: { ...prev.segment_data, [key]: e.target.value } }))}
                        style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '6px 8px', borderRadius: '4px', fontSize: '14px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                        {val} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEGMENT FAT ANALYSIS */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.1em', color: '#ff9f43', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '12px', background: '#ff9f43', borderRadius: '2px' }}></span>
              SEGMENT FAT ANALYSIS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {segmentFatMetrics.map(({ key, label, unit }) => {
                const val = getSegmentValue(key);
                if (!isEditing && (val === null || val === undefined || String(val) === 'null')) return null;
                return (
                  <div key={key} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        step="0.1"
                        value={val || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, segment_data: { ...prev.segment_data, [key]: e.target.value } }))}
                        style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '6px 8px', borderRadius: '4px', fontSize: '14px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff9f43', fontFamily: 'var(--font-display)' }}>
                        {val} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PERSONAL INFO */}
          {(getValue('height') || getValue('age') || getValue('gender')) && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.1em', color: '#2ed5ff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '3px', height: '12px', background: '#2ed5ff', borderRadius: '2px' }}></span>
                PERSONAL INFO
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {getValue('height') && (
                  <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Height</div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={getValue('height') || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, height: e.target.value }))}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#2ed5ff', fontFamily: 'var(--font-display)' }}>{getValue('height')} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>cm</span></div>
                    )}
                  </div>
                )}
                {getValue('age') && (
                  <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Age</div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={getValue('age') || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#2ed5ff', fontFamily: 'var(--font-display)' }}>{getValue('age')} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>yrs</span></div>
                    )}
                  </div>
                )}
                {getValue('gender') && (
                  <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Gender</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#2ed5ff', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>{getValue('gender')}</div>
                  </div>
                )}
              </div>
            </div>
          )}
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
        {[{ id: 'scan', label: 'New Scan', Icon: Camera }, { id: 'history', label: 'History', Icon: FileText }].map(tab => (
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
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >{tab.Icon && <tab.Icon size={14} />}{tab.label}</button>
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
                <div style={{ opacity: dragOver ? 1 : 0.5 }}><Camera size={48} /></div>
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
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      AI SCANNING...
                    </span>
                  ) : <><Search size={16} /> ANALYZE WITH AI</>}
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
                      <CheckCircle size={20} style={{ marginRight: '8px' }} />{metricCount} Metrics Extracted
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
                      page: 'Weight Tracker',
                      Icon: Scale,
                      items: [
                        extracted.weight ? `Weight: ${extracted.weight} kg ✓` : null,
                        extracted.body_fat_percent ? `Body Fat: ${extracted.body_fat_percent}% ✓` : null,
                      ].filter(Boolean),
                      saved: result.weightLogged,
                    },
                    {
                      page: 'Calculators',
                      Icon: Activity,
                      items: [
                        extracted.height ? `Height: ${extracted.height} cm ✓` : null,
                        extracted.age ? `Age: ${extracted.age} ✓` : null,
                        extracted.bmr ? `BMR: ${extracted.bmr} kcal ✓` : null,
                        extracted.gender ? `Gender: ${extracted.gender} ✓` : null,
                      ].filter(Boolean),
                      saved: !!(extracted.height || extracted.bmr),
                    },
                    {
                      page: 'AI Coach',
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
                      <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: route.saved ? 'var(--accent)' : '#ff4757', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {route.Icon && <route.Icon size={14} />}
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
                    {extracted.height && <div style={{ fontSize: '14px' }}><Ruler size={14} /> Height: <strong>{extracted.height} cm</strong></div>}
                    {extracted.age && <div style={{ fontSize: '14px' }}><Timer size={14} /> Age: <strong>{extracted.age} yrs</strong></div>}
                    {extracted.gender && <div style={{ fontSize: '14px' }}><User size={14} /> Gender: <strong style={{ textTransform: 'capitalize' }}>{extracted.gender}</strong></div>}
                    {extracted.date && <div style={{ fontSize: '14px' }}><Calendar size={14} /> Scan Date: <strong>{extracted.date}</strong></div>}
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
              <div style={{ marginBottom: '12px', opacity: 0.4 }}><FileText size={40} /></div>
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
