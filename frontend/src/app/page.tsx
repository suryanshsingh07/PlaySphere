import Link from 'next/link';
import { ArrowRight, Bot, MapPin, Star, Zap, ChevronRight, Shield, TrendingUp } from 'lucide-react';
import { SPORTS_LIST } from '@/shared/constants/venues';
import { getApprovedVenues } from '@/backend/firebase/firestore';
import { VenueCard } from '@/components/venue/VenueCard';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';
import { VenueDiscoveryInsights } from '@/components/ai/VenueDiscoveryInsights';
import { serializeFirestoreData } from '@/shared/helpers/utils';
import { Venue } from '@/shared/types';

export default async function HomePage() {
  const venues = await getApprovedVenues().catch(() => []);
  const rawFeaturedVenues = venues.filter((v) => (v.rating || 0) >= 4.7).slice(0, 3);
  const featuredVenues = serializeFirestoreData(rawFeaturedVenues) as Venue[];

  const marqueeItems = [
    '⚡ Badminton Courts',
    '⚽ Football Turfs',
    '🏊 Swimming Pools',
    '🤼 Akharas',
    '🏆 AI-Powered Booking',
    '📍 Lucknow',
    '🎯 Smart Recommendations',
    '💳 Instant Booking',
  ];

  return (
    <div className="min-h-screen">

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative hero-gradient pt-28 pb-24 px-4 overflow-hidden">
        {/* Floating brutalist squares */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-[8%] w-4 h-4 bg-yellow-400 border-2 border-black shadow-brutal-xs animate-float" />
          <div className="absolute top-56 left-[6%] w-4 h-4 bg-cyan-400 border-2 border-black shadow-brutal-xs animate-float animation-delay-1s" />
          <div className="absolute bottom-32 right-[15%] w-3 h-3 bg-pink-400 border-2 border-black shadow-brutal-xs animate-float animation-delay-2s" />
          <div className="absolute top-48 left-[20%] w-2 h-2 bg-emerald-400 border border-black animate-float animation-delay-300ms" />
          <div className="absolute bottom-48 left-[10%] w-3 h-3 bg-yellow-400 border-2 border-black shadow-brutal-xs animate-float-reverse animation-delay-150ms" />
          {/* Large decorative squares */}
          <div className="absolute -top-4 -right-4 w-32 h-32 border-3 border-yellow-400/10 rotate-12" />
          <div className="absolute bottom-0 -left-8 w-48 h-48 border-3 border-cyan-400/8 -rotate-6" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* APL Badge */}
          <div className="inline-flex items-center gap-2 bg-card border-2 border-black rounded-sm px-4 py-2 mb-8 shadow-[2px_2px_0px_#000] animate-stamp-in">
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            <span className="font-mono-label text-[10px] text-cyan-400 tracking-[0.18em]">
              APL FINAL ROUND 2026 — TEAM DEEPSTACK
            </span>
          </div>

          {/* Main Headline — Bebas Neue display */}
          <h1
            className="text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] font-black mb-8 tracking-[0.04em] animate-slide-up"
            style={{ fontFamily: 'var(--font-bebas), var(--font-space), sans-serif' }}
          >
            <span
              className="block text-primary"
              style={{ textShadow: '3px 3px 0px #000000' }}
            >
              FIND YOUR
            </span>
            <span
              className="block gradient-text"
              style={{ textShadow: 'none', filter: 'drop-shadow(3px 3px 0px #000000)' }}
            >
              PERFECT VENUE
            </span>
            <span
              className="block text-primary"
              style={{ textShadow: '3px 3px 0px #000000' }}
            >
              WITH AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-semibold">
            Discover and book badminton courts, football turfs, swimming pools, and akharas across{' '}
            <span className="text-cyan-400 font-black border-b-2 border-cyan-400">Lucknow</span>{' '}
            with smart AI recommendations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/venues" className="btn-primary text-base px-10 py-4 animate-pulse-yellow">
              Explore Venues <ArrowRight className="w-5 h-5 stroke-[2.5px]" />
            </Link>
            <Link href="/#ai-concierge" className="btn-secondary text-base px-10 py-4">
              <Bot className="w-5 h-5" /> Ask AI Concierge
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { value: '15+', label: 'Venues', color: 'border-t-4 border-t-yellow-400' },
              { value: '4',   label: 'Sports',  color: 'border-t-4 border-t-cyan-400' },
              { value: 'AI',  label: 'Powered', color: 'border-t-4 border-t-pink-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-card border-2 border-black rounded-sm p-4 text-center shadow-[3px_3px_0px_#000] ${stat.color}`}
              >
                <div
                  className="text-2xl font-black text-primary mb-1"
                  style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                >
                  {stat.value}
                </div>
                <div className="font-mono-label text-[9px] text-slate-500 tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ─────────────────────────────────────────── */}
      <div className="marquee-strip overflow-hidden">
        <div className="marquee-inner" aria-hidden="true">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="marquee-item">
              {item}
              <span className="w-2 h-2 inline-block bg-black rounded-full mx-2" />
            </span>
          ))}
        </div>
      </div>

      {/* ── AI VENUE DISCOVERY ────────────────────────────────────── */}
      <section className="py-14 px-4 border-b-3 border-black bg-card-hover">
        <div className="max-w-6xl mx-auto">
          <VenueDiscoveryInsights />
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-20 px-4 border-b-3 border-black bg-canvas">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* Section label */}
            <div className="inline-block mb-4">
              <span className="font-mono-label text-[10px] text-yellow-400 tracking-[0.2em]">PROCESS</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-black mb-4 text-primary uppercase tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-bebas), sans-serif',
                textShadow: '3px 3px 0px #000000',
              }}
            >
              How <span className="gradient-text">PlaySphere AI</span> Works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto font-semibold">
              From intent to booking in seconds, powered by AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: Bot,
                title: 'Describe It',
                desc: '"Beginner badminton near Gomti Nagar under ₹300"',
                accent: 'bg-cyan-400 text-black',
                stripe: 'stripe-cyan',
                num: '01',
              },
              {
                icon: Zap,
                title: 'AI Analyses',
                desc: 'AI understands your intent and finds the best match instantly',
                accent: 'bg-yellow-400 text-black',
                stripe: 'stripe-yellow',
                num: '02',
              },
              {
                icon: MapPin,
                title: 'Explore Map',
                desc: 'See venues pinned on Google Maps with distances',
                accent: 'bg-pink-400 text-black',
                stripe: 'stripe-pink',
                num: '03',
              },
              {
                icon: Shield,
                title: 'Book Instantly',
                desc: 'Select your time slot and confirm your booking',
                accent: 'bg-emerald-400 text-black',
                stripe: 'stripe-emerald',
                num: '04',
              },
            ].map((step) => (
              <div
                key={step.num}
                className={`relative bg-card border-2 border-black rounded-sm p-6 card-hover group shadow-[4px_4px_0px_#000] ${step.stripe}`}
              >
                {/* Step number watermark */}
                <div
                  className="text-5xl font-black text-slate-200/10 absolute top-3 right-4 select-none leading-none"
                  style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                >
                  {step.num}
                </div>
                <div
                  className={`w-11 h-11 rounded-sm border-2 border-black flex items-center justify-center mb-5 shadow-[2px_2px_0px_#000] ${step.accent}`}
                >
                  <step.icon className="w-5 h-5 stroke-[2px]" />
                </div>
                <h3 className="font-display font-black text-primary mb-2 text-sm uppercase tracking-[0.1em]">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPORTS CATEGORIES ──────────────────────────────────────── */}
      <section className="py-20 px-4 border-b-3 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="font-mono-label text-[10px] text-cyan-400 tracking-[0.2em]">CATEGORIES</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-black mb-4 text-primary uppercase tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-bebas), sans-serif',
                textShadow: '3px 3px 0px #000000',
              }}
            >
              Sports We <span className="gradient-text">Cover</span>
            </h2>
            <p className="text-slate-500 font-semibold">Every sport, every level, every budget</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {SPORTS_LIST.map((sport, idx) => {
              const accents = ['stripe-yellow', 'stripe-cyan', 'stripe-pink', 'stripe-emerald'];
              const accent = accents[idx % accents.length];
              return (
                <Link
                  key={sport.value}
                  href={`/venues?sport=${sport.value}`}
                  className={`bg-card border-2 border-black rounded-sm p-6 text-center card-hover group cursor-pointer shadow-[4px_4px_0px_#000] ${accent}`}
                >
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-200 select-none">
                    {sport.emoji}
                  </div>
                  <h3
                    className="font-black text-primary text-xl tracking-[0.08em] mb-2 uppercase"
                    style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                  >
                    {sport.label}
                  </h3>
                  <div className="font-mono-label text-[9px] text-slate-500 flex items-center justify-center gap-1 group-hover:text-cyan-400 transition-colors">
                    EXPLORE <ChevronRight className="w-3 h-3 stroke-[3px]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED VENUES ───────────────────────────────────────── */}
      <section className="py-20 px-4 border-b-3 border-black bg-card-hover">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-14">
            <div>
              <div className="mb-3">
                <span className="font-mono-label text-[10px] text-yellow-400 tracking-[0.2em]">TOP PICKS</span>
              </div>
              <h2
                className="text-4xl md:text-5xl font-black mb-2 text-primary uppercase tracking-[0.04em]"
                style={{
                  fontFamily: 'var(--font-bebas), sans-serif',
                  textShadow: '3px 3px 0px #000000',
                }}
              >
                Top Rated <span className="gradient-text">Venues</span>
              </h2>
              <p className="text-slate-500 font-semibold">Highest rated sports facilities in Lucknow</p>
            </div>
            <Link
              href="/venues"
              className="btn-secondary text-xs py-2.5 px-5 hidden md:flex"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/venues" className="btn-secondary">
              View All Venues <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI CONCIERGE PREVIEW ──────────────────────────────────── */}
      <section id="ai-concierge" className="py-20 px-4 border-b-3 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              {/* Label badge */}
              <div className="inline-flex items-center gap-2 rounded-sm px-3 py-2 bg-card border-2 border-black mb-6 shadow-[2px_2px_0px_#000]">
                <Bot className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="font-mono-label text-[9px] text-cyan-400 tracking-[0.18em]">
                  POWERED BY LLAMA 3.1
                </span>
              </div>

              <h2
                className="text-5xl md:text-6xl font-black mb-6 tracking-[0.04em] uppercase text-primary"
                style={{
                  fontFamily: 'var(--font-bebas), sans-serif',
                  textShadow: '3px 3px 0px #000000',
                  lineHeight: '0.95',
                }}
              >
                Meet Your AI
                <br />
                <span className="gradient-text">Sports Concierge</span>
              </h2>

              <p className="text-slate-400 leading-relaxed mb-8 font-semibold text-base">
                Just describe what you want in plain English. Our AI understands your intent,
                considers your budget, skill level, and location — then recommends the perfect venue.
              </p>

              {/* Example prompts */}
              <div className="space-y-3 mb-8">
                {[
                  '"Beginner badminton near Gomti Nagar under ₹300"',
                  '"Football turf for 10 friends this weekend"',
                  '"Cheapest swimming pool near Hazratganj"',
                ].map((example) => (
                  <div
                    key={example}
                    className="flex items-center gap-3 bg-card border-2 border-black rounded-sm px-4 py-3 shadow-[2px_2px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[3px_3px_0px_#facc15] transition-all duration-150"
                  >
                    <div className="w-2 h-2 bg-yellow-400 flex-shrink-0 border border-black" />
                    <span className="text-slate-400 text-sm font-semibold italic">{example}</span>
                  </div>
                ))}
              </div>

              <Link href="/#ai-concierge" className="btn-primary">
                Try AI Concierge <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
              </Link>
            </div>

            <div>
              <AIConciergePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── PEAK PRICING CALLOUT ──────────────────────────────────── */}
      <section className="py-20 px-4 border-b-3 border-black bg-card-hover">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border-3 border-black rounded-sm p-8 md:p-12 shadow-[8px_8px_0px_#000] stripe-yellow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-sm px-3 py-2 bg-card-nested border-2 border-black mb-5 shadow-[2px_2px_0px_#000]">
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="font-mono-label text-[9px] text-yellow-400 tracking-[0.18em]">SMART PRICING</span>
                </div>
                <h2
                  className="text-4xl md:text-5xl font-black mb-4 uppercase text-primary tracking-[0.04em]"
                  style={{
                    fontFamily: 'var(--font-bebas), sans-serif',
                    textShadow: '3px 3px 0px #000000',
                    lineHeight: '1',
                  }}
                >
                  <span>Save up to </span>
                  <span className="gradient-text-sport">15%</span>
                  <br />
                  <span>with smart timing</span>
                </h2>
                <p className="text-slate-400 leading-relaxed font-semibold">
                  Our AI knows when prices are lowest. Book afternoon slots to save significantly over peak evening rates.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Morning', time: '5–8 AM', icon: '🌅', price: 'Normal', badge: null, color: 'stripe-cyan' },
                  { label: 'Afternoon', time: '11 AM–4 PM', icon: '☀️', price: '15% Off', badge: 'BEST VALUE', color: 'stripe-emerald' },
                  { label: 'Evening', time: '5–10 PM', icon: '🌆', price: '+30%', badge: 'PEAK', color: 'border-t-4 border-t-rose-500' },
                ].map((slot) => (
                  <div
                    key={slot.label}
                    className={`bg-card-nested border-2 border-black rounded-sm p-4 text-center shadow-[3px_3px_0px_#000] relative ${slot.color}`}
                  >
                    {slot.badge && (
                      <div
                        className={`font-mono-label text-[8px] uppercase mb-2 inline-block border-2 border-black px-2 py-0.5 ${
                          slot.badge === 'BEST VALUE' ? 'bg-emerald-400 text-black' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {slot.badge}
                      </div>
                    )}
                    <div className="text-2xl mb-2 select-none">{slot.icon}</div>
                    <div className="font-black text-primary text-sm uppercase tracking-[0.06em]">{slot.label}</div>
                    <div className="font-mono-label text-[9px] text-slate-500 mt-1">{slot.time}</div>
                    <div
                      className={`text-sm font-extrabold mt-2 ${
                        slot.badge === 'BEST VALUE'
                          ? 'text-emerald-400'
                          : slot.badge === 'PEAK'
                          ? 'text-rose-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {slot.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-20 px-4 border-b-3 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="mb-4">
              <span className="font-mono-label text-[10px] text-pink-400 tracking-[0.2em]">TESTIMONIALS</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-black mb-4 text-primary uppercase tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-bebas), sans-serif',
                textShadow: '3px 3px 0px #000000',
              }}
            >
              Loved by <span className="gradient-text">Athletes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Arjun Sharma',
                sport: 'Badminton Player',
                text: 'Found the perfect court in Gomti Nagar in seconds. The AI knew exactly what I needed — beginner-friendly and under budget!',
                rating: 5,
                accent: 'stripe-yellow',
              },
              {
                name: 'Priya Gupta',
                sport: 'Football Enthusiast',
                text: 'Organized a 10-person football session with one AI query. The turf was exactly as described. Amazing experience!',
                rating: 5,
                accent: 'stripe-cyan',
              },
              {
                name: 'Rahul Verma',
                sport: 'Swimming Learner',
                text: 'As a complete beginner, the AI Guidance Mode gave me tips I never expected. Now I swim 3x a week!',
                rating: 5,
                accent: 'stripe-pink',
              },
            ].map((review) => (
              <div
                key={review.name}
                className={`bg-card border-2 border-black rounded-sm p-6 card-hover shadow-[4px_4px_0px_#000] ${review.accent}`}
              >
                <div className="flex text-amber-400 mb-4 gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-5 italic font-semibold">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-yellow-400 border-2 border-black flex items-center justify-center text-black text-sm font-black shadow-[2px_2px_0px_#000]">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="text-primary text-sm font-black">{review.name}</div>
                    <div className="font-mono-label text-[9px] text-slate-600 tracking-[0.1em]">{review.sport}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-card-hover">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-card border-3 border-black rounded-sm p-12 shadow-[10px_10px_0px_#000] stripe-yellow relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 border border-black" />
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-cyan-400 border border-black" />

            <div
              className="text-6xl mb-6 select-none"
              style={{ textShadow: '3px 3px 0px #000' }}
            >
              🏆
            </div>
            <h2
              className="text-5xl md:text-6xl font-black mb-5 uppercase text-primary tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-bebas), sans-serif',
                textShadow: '3px 3px 0px #000000',
                lineHeight: '1',
              }}
            >
              Ready to <span className="gradient-text">Play?</span>
            </h2>
            <p className="text-slate-400 mb-10 text-lg font-semibold">
              Join the revolution in sports facility discovery. Your next great game starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="btn-primary text-base px-12 py-4">
                Get Started Free <ArrowRight className="w-5 h-5 stroke-[2.5px]" />
              </Link>
              <Link href="/venues" className="btn-secondary text-base px-12 py-4">
                <MapPin className="w-5 h-5" /> Browse Venues
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
