import Link from 'next/link';
import { Zap, Globe, MessageCircle, Camera, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-[3px] border-black bg-footer">
      {/* Top accent stripe */}
      <div className="w-full h-1.5 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* ── Brand Column ── */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-9 h-9 bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[3px_3px_0px_#22d3ee] transition-all duration-150">
                <img src="/favicon.ico"/>             </div>
              <span
                className="gradient-text text-xl"
                style={{ fontFamily: 'var(--font-bebas), var(--font-space), sans-serif', letterSpacing: '0.04em' }}
              >
                PlaySphere AI
              </span>
            </Link>

            <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-semibold mb-6">
              AI-powered sports venue discovery and booking for Lucknow. Find your perfect game, anytime.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {[
                { icon: Globe, label: 'Official Website', title: 'Official Website' },
                { icon: MessageCircle, label: 'Community Chat', title: 'Community Chat' },
                { icon: Camera, label: 'Photo Gallery', title: 'Photo Gallery' },
              ].map(({ icon: Icon, label, title }) => (
                <a
                  key={label}
                  href="#"
                  title={title}
                  aria-label={label}
                  className="w-9 h-9 bg-card border-2 border-black flex items-center justify-center text-slate-500 hover:text-yellow-400 hover:bg-card-nested shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#facc15] transition-all duration-150"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Platform Links ── */}
          <div>
            <h4
              className="text-primary font-black mb-5 uppercase text-sm tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-space), sans-serif' }}
            >
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Discover Venues', href: '/venues' },
                { label: 'AI Concierge', href: '/#ai-concierge' },
                { label: 'Map View', href: '/venues?tab=map' },
                { label: 'My Bookings', href: '/dashboard' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-1.5 text-slate-500 hover:text-cyan-500 text-sm transition-colors duration-150 font-semibold"
                  >
                    {item.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Sports Links ── */}
          <div>
            <h4
              className="text-primary font-black mb-5 uppercase text-sm tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-space), sans-serif' }}
            >
              Sports
            </h4>
            <ul className="space-y-3">
              {[
                { label: '🏸 Badminton', href: '/venues?sport=badminton' },
                { label: '⚽ Football', href: '/venues?sport=football' },
                { label: '🏊 Swimming', href: '/venues?sport=swimming' },
                { label: '🤼 Kabaddi', href: '/venues?sport=kabaddi' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-1.5 text-slate-500 hover:text-yellow-500 text-sm transition-colors duration-150 font-semibold"
                  >
                    {item.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t-2 border-black mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-400 border border-black flex-shrink-0" />
            <p className="text-slate-500 text-xs font-semibold">
              © {currentYear} PlaySphere AI — Built by{' '}
              <span className="text-cyan-500 font-black">Team DeepStack</span>
              {' '}for Final Round Evaluation
            </p>
          </div>
          <p
            className="text-slate-600 text-[10px] uppercase tracking-[0.1em] font-bold"
            style={{ fontFamily: 'var(--font-space-mono, monospace)' }}
          >
            LLAMA 3.1 · FIREBASE · NEXT.JS · APL 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
