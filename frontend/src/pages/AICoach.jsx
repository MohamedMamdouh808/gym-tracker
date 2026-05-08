import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';

export default function AICoach() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your AI Fitness Coach. How can I help you reach your goals today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.coach({ message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: res.advice }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 0.5rem' }}>
      <div className="card" style={{ 
        height: 'calc(100vh - 8rem)', 
        display: 'flex', 
        flexDirection: 'column', 
        margin: '1rem auto',
        maxWidth: '1000px',
        maxHeight: '800px'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
          }}>
            🤖
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 'min(1.1rem, 5vw)' }}>AI Fitness Coach</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Powered by Gemini</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ 
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.75rem 1rem',
              borderRadius: '16px',
              background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: m.role === 'user' ? 'white' : 'inherit',
              border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
              boxShadow: 'var(--shadow)',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
              <span className="pulse" style={{ fontSize: '0.8rem' }}>Thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              color: 'white',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.6rem 1.2rem', minWidth: '70px' }}>
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
