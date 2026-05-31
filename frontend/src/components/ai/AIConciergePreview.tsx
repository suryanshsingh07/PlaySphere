'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Send, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

interface ConciergeCard {
  venueId: string;
  title: string;
  sport: string;
  area: string;
  imageUrl?: string;
  rating?: number;
  price?: number;
  venueType: 'marketplace' | 'infrastructure';
  venueCode?: string;
  action: 'book' | 'view' | 'verify';
}

interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  action?: {
    type: 'book';
    venueId: string;
    venueName: string;
    date: string;
    slot: string;
  };
  cards?: ConciergeCard[];
}

const DISCOVERY_GREETING = "Hi! I'm PlaySphere AI (Discovery Mode) 🏆 I can help you find and compare sports venues in Lucknow. Ask me something like:\n\n• \"Beginner badminton near Gomti Nagar under ₹300\"\n• \"Football turf for 10 friends this weekend\"\n• \"Cheapest swimming pool near Hazratganj\"";

const GUIDANCE_GREETING = "Hi! I'm PlaySphere AI (Guidance Mode) 🏸 I'm here to provide light sports tips, basic rules, workout timing advice, and beginner suggestions. Ask me something like:\n\n• \"What are the basic rules of badminton?\"\n• \"Affordable slot timings for beginner practice\"\n• \"Simple guidelines to choose a football size\"";

export function AIConciergePreview() {
  const [mode, setMode] = useState<'discovery' | 'guidance'>('discovery');
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'assistant',
      content: DISCOVERY_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // When mode changes, reset chat with the appropriate greeting
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: mode === 'discovery' ? DISCOVERY_GREETING : GUIDANCE_GREETING,
        timestamp: new Date(),
      },
    ]);
  }, [mode]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    // If it's a retry of the last message, don't duplicate user message in list if already there
    const isRetry = !!text && messages[messages.length - 1]?.isError;
    
    const userMessage: ChatMessageItem = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    if (isRetry) {
      // Remove the last error assistant message
      setMessages((prev) => prev.slice(0, -1));
    } else if (!text || !messages.some(m => m.role === 'user' && m.content === messageText && Date.now() - m.timestamp.getTime() < 5000)) {
      setMessages((prev) => [...prev, userMessage]);
    }
    
    setInput('');
    setLoading(true);

    try {
      // Get conversation history excluding initial greeting
      const history = messages
        .filter((_, idx) => idx > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history, mode }),
      });

      if (!res.ok) {
        // Read the actual error from the server response body
        let serverError = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          serverError = errBody.error || serverError;
        } catch {}
        throw new Error(serverError);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: ChatMessageItem = {
        role: 'assistant',
        content: data.text || data.response || 'Something went wrong. Please try again.',
        timestamp: new Date(),
        action: data.action,
        cards: data.cards || [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Concierge request error:', err);
      const errorMsg = 'AI Concierge temporarily unavailable.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg, timestamp: new Date(), isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    // Find the last user message to retry
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length > 0) {
      const lastUserMsg = userMsgs[userMsgs.length - 1];
      sendMessage(lastUserMsg.content);
    }
  };

  const QUICK_PROMPTS = mode === 'discovery' 
    ? [
        'Beginner badminton near Gomti Nagar',
        'Football turf under ₹1000',
        'Cheapest swimming pool Hazratganj',
      ]
    : [
        'Beginner badminton tips',
        'Affordable time slots advice',
        'Basic football guidelines',
      ];

  return (
    <div className="bg-card border-3 border-black overflow-hidden shadow-[6px_6px_0px_#000]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-black bg-purple-600 text-white">
        <div className="w-9 h-9 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
          <Bot className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-display font-black text-white uppercase tracking-wider text-sm [text-shadow:1.5px_1.5px_0px_#000]">PlaySphere AI Concierge</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
            <span className="text-xs text-white/95 font-semibold">Online • Powered by Llama 3.1</span>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-400 ml-auto fill-yellow-400" />
      </div>

      {/* Mode Selector Toggle */}
      <div className="flex border-b-2 border-black p-2 bg-card-nested gap-2">
        <button
          suppressHydrationWarning={true}
          onClick={() => setMode('discovery')}
          className={cn(
            "flex-1 text-center py-1.5 text-xs font-black border-2 border-black transition-all shadow-[2px_2px_0px_#000] cursor-pointer",
            mode === 'discovery' ? "bg-purple-600 text-white shadow-[1px_1px_0px_#000] translate-x-0.5 translate-y-0.5" : "bg-card text-muted-theme hover:text-primary"
          )}
        >
          🔍 Discovery Mode
        </button>
        <button
          suppressHydrationWarning={true}
          onClick={() => setMode('guidance')}
          className={cn(
            "flex-1 text-center py-1.5 text-xs font-black border-2 border-black transition-all shadow-[2px_2px_0px_#000] cursor-pointer",
            mode === 'guidance' ? "bg-emerald-400 text-black shadow-[1px_1px_0px_#000] translate-x-0.5 translate-y-0.5" : "bg-card text-muted-theme hover:text-primary"
          )}
        >
          🏸 Guidance Mode
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-hide scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
                msg.role === 'user'
                  ? 'bg-cyan-400 text-black rounded-br-none border-2 border-black rounded-md shadow-[2px_2px_0px_#000]'
                  : msg.isError
                  ? 'bg-rose-950/40 text-rose-300 border-rose-500 shadow-[2px_2px_0px_rgba(239,68,68,0.2)] border-2 rounded-md rounded-bl-none'
                  : 'glass text-primary rounded-bl-none'
              )}
            >
              <pre className="font-sans whitespace-pre-wrap">{msg.content}</pre>
              {msg.action && msg.action.type === 'book' && (
                <div className="mt-3 pt-3 border-t border-black/20">
                  <span className="text-[10px] text-slate-400 block mb-1.5 leading-normal">
                    Note: PlaySphere AI does not charge cards or reserve slots automatically. This pre-fills the booking details for your confirmation.
                  </span>
                  <Link
                    href={`/venues/${msg.action.venueId}?date=${msg.action.date}&slot=${encodeURIComponent(msg.action.slot)}`}
                    className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-4 py-2.5 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all no-underline"
                  >
                    ⚡ Continue Booking
                  </Link>
                </div>
              )}
              {msg.isError && (
                <button
                  suppressHydrationWarning={true}
                  onClick={handleRetry}
                  disabled={loading}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold bg-rose-500 text-black border border-black px-2 py-1 rounded shadow-[1px_1px_0px_#000] hover:bg-rose-400 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                  Retry
                </button>
              )}
            </div>

            {/* AI Venue Card Recommendation System */}
            {msg.role === 'assistant' && msg.cards && msg.cards.length > 0 && (
              <div className="w-full max-w-[95%] mt-3 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {msg.cards.map((card) => {
                    const isInfra = card.venueType === 'infrastructure';
                    return (
                      <div
                        key={card.venueId}
                        className="bg-card-nested border-2 border-black overflow-hidden shadow-[3px_3px_0px_#000] flex flex-col hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] transition-all"
                      >
                        {/* Image */}
                        <div className="relative h-28 overflow-hidden bg-card-nested border-b border-black">
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.imageUrl}
                              alt={card.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-canvas">
                              🏢
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-black bg-cyan-400 text-black">
                            {card.sport}
                          </span>
                          <span className={cn(
                            "absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-black",
                            isInfra ? "bg-card text-primary border border-black" : "bg-emerald-500 text-black"
                          )}>
                            {isInfra ? 'Mapped' : 'Bookable'}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-extrabold text-primary text-xs mb-1 line-clamp-1">
                              {card.title}
                            </h4>
                            <p className="text-muted-theme text-[10px] mb-2 flex items-center gap-0.5">
                              <span>📍</span> {card.area}
                            </p>

                            {!isInfra ? (
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-cyan-400 font-extrabold text-xs">
                                  ₹{card.price}/hr
                                </span>
                                {card.rating !== undefined && (
                                  <span className="text-amber-500 text-[10px] font-bold">
                                    ★ {card.rating}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="bg-canvas border border-black/20 px-1.5 py-1 text-[9px] font-mono text-muted-theme mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                Code: {card.venueCode || 'N/A'}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-1 mt-auto">
                            {!isInfra ? (
                              <Link
                                href={`/venues/${card.venueId}`}
                                className="block w-full text-center bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[10px] py-1.5 rounded border border-black shadow-[1.5px_1.5px_0px_#000] no-underline transition-all hover:translate-y-[-0.5px] cursor-pointer"
                              >
                                ⚡ Book Now
                              </Link>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Link
                                  href={`/venues/${card.venueId}?infra=true`}
                                  className="block w-full text-center bg-card text-primary font-bold text-[10px] py-1 border border-black shadow-[1.5px_1.5px_0px_#000] no-underline transition-all cursor-pointer hover:bg-card-nested"
                                >
                                  View Details
                                </Link>
                                <Link
                                  href={`/owner?tab=verify&code=${card.venueCode}`}
                                  className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[10px] py-1 rounded border border-black shadow-[1.5px_1.5px_0px_#000] no-underline transition-all cursor-pointer"
                                >
                                  Verify Ownership
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border-2 border-black rounded-bl-none px-4 py-3 shadow-[2px_2px_0px_#000] flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce animation-delay-150ms" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce animation-delay-300ms" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            suppressHydrationWarning={true}
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={loading}
            className="text-xs bg-card border-2 border-black px-3 py-1.5 text-muted-theme font-bold hover:bg-cyan-400 hover:text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000] transition-all cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 p-4 border-t-2 border-black">
        <input
          suppressHydrationWarning={true}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
          placeholder={mode === 'discovery' ? "Ask about venues, prices, comparison..." : "Ask for basic sport tips, timing advice..."}
          className="flex-1 min-w-0"
        />
        <button
          suppressHydrationWarning={true}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-md bg-purple-600 text-white font-bold border-2 border-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all flex-shrink-0 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white fill-white" />}
        </button>
      </div>
    </div>
  );
}
