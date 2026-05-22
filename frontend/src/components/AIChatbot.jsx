import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { Sparkles, Send, X, MessageSquare, Loader, Calendar, Compass, HelpCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUGGESTED_PROMPTS = [
  'Book badminton tomorrow 7 PM near Gomti Nagar',
  'Find football turf under ₹1200 near Chinhat',
  'Suggest the best cricket ground in Hazratganj',
  'Any swimming pools in Aliganj?'
];

export default function AIChatbot() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm your **PlaySphere Sports Copilot**. \n\nI can help you **find venues**, **suggest recommendations**, or even **book courts** directly using natural language. \n\nWhat are you looking to play today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        '/api/ai/chat',
        { message: textToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const { response, type, venues } = res.data.data;
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: response,
          type,
          venues,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error(err);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "⚠️ Sorry, I encountered an issue processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Helper to parse markdown-like bold/emoji text from the mock AI responses
  const formatMessageText = (text) => {
    if (!text) return '';
    // Bold formatting parser
    return text.split('\n').map((line, idx) => {
      let formatted = line;
      // Handle bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={{ color: '#fff', fontWeight: 700 }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      return (
        <div key={idx} style={{ minHeight: line.trim() === '' ? '10px' : 'auto', marginBottom: '4px' }}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1050 }}>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn animate-float"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--glow-cyan), 0 8px 24px rgba(0,0,0,0.4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <Sparkles size={24} style={{ animation: 'pulse 2s infinite' }} />
        </button>
      )}

      {/* Expanded Chatbot Panel */}
      {isOpen && (
        <div className="glass-strong animate-slide-up" style={{
          width: '380px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div className="flex-between" style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
          }}>
            <div className="flex-center gap-sm">
              <div className="flex-center" style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient-primary)'
              }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Sports Copilot</h3>
                <span className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
                  <span className="pulse-dot"></span> Online Agent
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', color: 'var(--text-secondary)' }}
              className="btn-ghost"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {/* Chat Bubble */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: msg.sender === 'user' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  {formatMessageText(msg.text)}
                </div>

                {/* Inline Venues Suggestions Card rendering */}
                {msg.sender === 'bot' && msg.venues && msg.venues.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', width: '100%' }}>
                    {msg.venues.map((venue) => (
                      <div key={venue._id} className="glass" style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                      }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>🏟️ {venue.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📍 {venue.area}</div>
                        <div className="flex-between" style={{ marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>₹{venue.sports[0]?.pricePerHour || 400}/hr</span>
                          <Link 
                            to={`/venue/${venue._id}`} 
                            onClick={() => setIsOpen(false)}
                            className="btn btn-primary" 
                            style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px' }}
                          >
                            Book now
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Time Indicator */}
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginTop: '4px',
                  padding: '0 4px'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '16px 16px 16px 2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', animation: 'typing 1s infinite' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', animation: 'typing 1s infinite 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', animation: 'typing 1s infinite 0.4s' }}></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <HelpCircle size={12} /> Suggestion Prompts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    className="btn-ghost"
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'normal',
                      lineHeight: '1.2'
                    }}
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input */}
          <form onSubmit={handleSubmit} style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Ask anything or book a slot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !input.trim()}
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-md)', flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
