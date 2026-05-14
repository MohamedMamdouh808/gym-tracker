import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, dashboardAPI, inbodyAPI } from '../utils/api';

export default function AICoach() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your GymTracker Pro Coach. I have full access to your body composition data from InBody scans, weight logs, meals, and workouts. Ask me anything for personalized advice based on your actual numbers!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [latestScan, setLatestScan] = useState(null);
  const chatEndRef = useRef(null);

  const suggestions = [
    "How is my progress this week?",
    "Give me a 5-day split plan",
    "How much protein do I need?",
    "Show my latest records"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    dashboardAPI.get().then(res => setStats(res.data)).catch(() => {});
    inbodyAPI.latest().then(res => setLatestScan(res.data)).catch(() => {});
  }, []);

  const handleSend = async (msg = null) => {
    const userMsg = typeof msg === 'string' ? msg : input.trim();
    if (!userMsg || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    if (typeof msg !== 'string') setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.coach({ message: userMsg, context: stats });
      setMessages(prev => [...prev, { role: 'ai', text: res.advice }]);
    } catch (err) {
      console.error('Coach API Error:', err);
      const errorMsg = typeof err === 'string' ? err : (err.message || "Connection failed");
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Error: ${errorMsg}. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'ai', text: "Chat cleared. How else can I help you today?" }]);
  };

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="section-title">AI PERFORMANCE COACH</h1>
          <p className="section-subtitle">Real-time guidance based on your progress</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {stats && <div className="badge-live">LIVE CONTEXT ACTIVE</div>}
          <button onClick={clearChat} className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>CLEAR CHAT</button>
        </div>
      </div>

      <div className="ai-layout-grid">
        {/* Context Sidebar */}
        <div className="card desktop-only">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '16px' }}>ACTIVE CONTEXT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats ? (
              <>
                <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Latest Weight</span>
                  <span style={{ fontWeight: '600' }}>{stats.latestWeight?.weight || '—'} kg</span>
                </div>
                <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Calories Today</span>
                  <span style={{ fontWeight: '600' }}>{stats.caloriesToday || 0} kcal</span>
                </div>
                <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Workouts / Week</span>
                  <span style={{ fontWeight: '600' }}>{stats.weekWorkouts || 0}</span>
                </div>
                {latestScan && (
                  <>
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px' }} />
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '4px' }}>📷 INBODY SCAN · {latestScan.date}</div>
                    <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Body Fat %</span>
                      <span style={{ fontWeight: '600', color: '#ff9f43' }}>{latestScan.body_fat_percent}%</span>
                    </div>
                    <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Muscle Mass</span>
                      <span style={{ fontWeight: '600', color: 'var(--green)' }}>{latestScan.skeletal_muscle_mass} kg</span>
                    </div>
                    <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>BMR</span>
                      <span style={{ fontWeight: '600' }}>{latestScan.bmr} kcal</span>
                    </div>
                    <div className="flex justify-between items-center" style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Visceral Fat</span>
                      <span style={{ fontWeight: '600', color: latestScan.visceral_fat_level > 10 ? '#ff4757' : 'var(--green)' }}>
                        Lvl {latestScan.visceral_fat_level} {latestScan.visceral_fat_level > 10 ? '⚠️' : '✓'}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : <div className="skeleton" style={{ height: '80px' }} />}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.06em', marginBottom: '16px', marginTop: '24px' }}>POWER-UPS</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <button onClick={() => handleSend("Based on my muscle focus and PRs, what should I train today?")} className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px', textAlign: 'left' }}>
              🎯 Smart Workout Suggestion
            </button>
            <button onClick={() => handleSend("Analyze my weight trends and predict when I will hit my goal weight.")} className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px', textAlign: 'left' }}>
              📈 Predictive Progress
            </button>
            <button onClick={() => handleSend("Review my nutrition logs from this week. Am I hitting my macros effectively?")} className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px', textAlign: 'left' }}>
              🥗 Macro Optimization
            </button>
            {latestScan && (
              <button onClick={() => handleSend(`Analyze my InBody scan from ${latestScan.date}. My body fat is ${latestScan.body_fat_percent}%, muscle mass is ${latestScan.skeletal_muscle_mass}kg, BMR is ${latestScan.bmr}kcal, and visceral fat level is ${latestScan.visceral_fat_level}. Give me a complete action plan to improve my body composition.`)} className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px', textAlign: 'left', borderColor: 'rgba(232,255,71,0.2)' }}>
                📷 Analyze My InBody Results
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="card ai-chat-container">
          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{ 
                  padding: '14px 18px',
                  borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: m.role === 'user' ? '#080c10' : 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  boxShadow: m.role === 'user' ? '0 4px 12px var(--accent-dim)' : 'none',
                  border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {m.role === 'user' ? 'You' : 'Coach'}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', padding: '10px' }}>
                <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '0 20px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', maskImage: 'linear-gradient(to right, black 80%, transparent)' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => handleSend(s)} className="btn btn-ghost" style={{ fontSize: '11px', whiteSpace: 'nowrap', borderRadius: '100px', padding: '6px 14px' }}>
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="ai-chat-input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="input"
              style={{ flex: 1, borderRadius: '100px', paddingLeft: '24px', height: '48px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ borderRadius: '100px', width: '48px', height: '48px', padding: '0', justifyContent: 'center', flexShrink: 0 }}>
              {loading ? '...' : '→'}
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ai-layout-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          align-items: start;
        }

        .ai-chat-container {
          height: 650px;
          display: flex;
          flex-direction: column;
          padding: 0 !important;
          overflow: hidden;
          background: rgba(13, 17, 23, 0.4);
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ai-chat-input-form {
          padding: 16px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 12px;
          background: rgba(255,255,255,0.03);
        }

        @media (max-width: 1024px) {
          .ai-layout-grid {
            grid-template-columns: 1fr;
          }
          .ai-chat-container {
            height: calc(100vh - 350px);
            min-height: 500px;
          }
        }

        @media (max-width: 768px) {
          .ai-chat-container {
            height: calc(100vh - 320px);
            min-height: 400px;
          }
          .ai-chat-messages {
            padding: 16px;
            gap: 16px;
          }
          .ai-chat-input-form {
            padding: 12px;
          }
        }
      `}} />
    </div>
  );
}
