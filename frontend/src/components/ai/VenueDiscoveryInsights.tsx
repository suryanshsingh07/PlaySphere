'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

interface DiscoveryInsight {
  type: 'gap' | 'opportunity' | 'trend' | 'value';
  title: string;
  description: string;
  area?: string;
  sport?: string;
  emoji: string;
  urgency: 'high' | 'medium' | 'low';
}

export function VenueDiscoveryInsights() {
  const [insights, setInsights] = useState<DiscoveryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/discover', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/ai/discover', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (active) setInsights(data.insights || []);
        }
      } catch (error) {
        console.error('Failed to fetch insights', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gap': return 'bg-rose-400 text-black';
      case 'opportunity': return 'bg-emerald-400 text-black';
      case 'trend': return 'bg-amber-400 text-black';
      case 'value': return 'bg-cyan-400 text-black';
      default: return 'bg-slate-700 text-white';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'high') return '🔴 HIGH';
    if (urgency === 'medium') return '🟡 MED';
    return '🟢 LOW';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
          {/* text-primary flips between dark:#f8fafc and light:#0c0f17 */}
          <h2 className="font-display font-bold text-xl text-primary">AI Venue Discovery</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold bg-card border-2 border-black text-muted-theme px-3 py-1.5 shadow-[2px_2px_0px_#000] hover:text-primary hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x snap-mandatory">
        {loading && insights.length === 0 ? (
          // Loading Skeleton — uses bg-card and bg-card-nested so light mode works
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[280px] md:min-w-[320px] bg-card border-3 border-black p-5 shadow-[5px_5px_0px_#000] animate-pulse snap-center">
              <div className="h-6 w-32 bg-card-nested rounded mb-4" />
              <div className="h-4 w-full bg-card-nested rounded mb-2" />
              <div className="h-4 w-4/5 bg-card-nested rounded mb-6" />
              <div className="h-4 w-24 bg-card-nested rounded" />
            </div>
          ))
        ) : (
          insights.map((insight, i) => (
            <div
              key={i}
              className="min-w-[280px] md:min-w-[320px] bg-card border-3 border-black flex flex-col shadow-[5px_5px_0px_#000] hover:-translate-y-1 hover:shadow-[7px_7px_0px_#000] transition-all snap-center group"
            >
              {/* Coloured header stripe — type colors are always vivid, work on both themes */}
              <div className={cn("px-4 py-3 border-b-3 border-black flex items-center gap-2 font-display font-bold", getTypeColor(insight.type))}>
                <span className="text-xl">{insight.emoji}</span>
                {insight.title}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                {/* text-muted-theme: dark → slate-400, light → slate-600 */}
                <p className="text-muted-theme text-sm leading-relaxed mb-6 flex-1">
                  {insight.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <Link
                    href={`/venues?${insight.sport ? `sport=${insight.sport}&` : ''}${insight.area ? `area=${encodeURIComponent(insight.area)}` : ''}`}
                    className="text-xs font-bold text-cyan-500 group-hover:text-cyan-600 flex items-center gap-1 transition-colors"
                  >
                    Explore {insight.sport ? insight.sport.charAt(0).toUpperCase() + insight.sport.slice(1) : 'Venues'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[10px] font-black tracking-wider text-slate-500">
                    {getUrgencyIcon(insight.urgency)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
