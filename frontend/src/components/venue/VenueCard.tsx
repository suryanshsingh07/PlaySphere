'use client';

import Link from 'next/link';
import { MapPin, Star, Bookmark, BookmarkCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { Venue } from '@/shared/types';
import { cn, formatCurrency, getSportEmoji, getSportColor, getSkillBadgeColor } from '@/shared/helpers/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { toggleSavedVenue } from '@/backend/firebase/firestore';
import { useRouter } from 'next/navigation';

interface VenueCardProps {
  venue: Venue;
  className?: string;
}

export function VenueCard({ venue, className }: VenueCardProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const isSaved = profile?.savedVenues?.includes(venue.id) || false;
  const sportColor = getSportColor(venue.sport);
  const isInfra = venue.category === 'infrastructure';

  // Stripe accent colors based on sport
  const sportStripes: Record<string, string> = {
    badminton: 'border-t-[4px] border-t-yellow-400',
    football:  'border-t-[4px] border-t-emerald-400',
    swimming:  'border-t-[4px] border-t-cyan-400',
    kabaddi:   'border-t-[4px] border-t-pink-400',
  };
  const stripeAccent = sportStripes[venue.sport] ?? 'border-t-[4px] border-t-yellow-400';

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setSaving(true);
    try {
      await toggleSavedVenue(user.uid, venue.id, isSaved);
    } catch (err) {
      console.error('Error toggling saved venue:', err);
      alert('Unable to save venue. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('You must be logged in to verify ownership.');
      router.push('/auth/login');
      return;
    }
    if (profile?.role !== 'owner') {
      alert('You must be registered as a Venue Owner to verify ownership of this facility.');
      return;
    }
    router.push(`/owner?tab=verify&code=${venue.venueCode}`);
  };

  return (
    <div
      className={cn(
        'bg-card border-2 border-black overflow-hidden card-hover group flex flex-col justify-between h-full shadow-[5px_5px_0px_#000]',
        stripeAccent,
        className
      )}
    >
      {/* ── Image & Badges ── */}
      <div className="relative h-44 overflow-hidden bg-card-nested border-b-2 border-black flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Sport badge */}
        <div
          className={cn(
            'absolute top-3 left-3 px-2.5 py-1 text-[10px] shadow-[2px_2px_0px_#000] border-2 border-black font-black tracking-[0.08em] uppercase',
            sportColor
          )}
        >
          {getSportEmoji(venue.sport)} {venue.sport.charAt(0).toUpperCase() + venue.sport.slice(1)}
        </div>

        {/* Infrastructure badge */}
        {isInfra && (
          <div className="absolute top-3 right-12 bg-card border-2 border-black px-2 py-1 text-[9px] font-black text-slate-400 shadow-[1px_1px_0px_#000] flex items-center gap-1 uppercase tracking-[0.08em]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" /> MAPPED
          </div>
        )}

        {/* Unavailable overlay */}
        {!isInfra && !venue.available && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <span className="text-black font-black text-xs bg-rose-500 px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_#000] uppercase tracking-[0.1em]">
              UNAVAILABLE
            </span>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          aria-label={isSaved ? 'Unsave venue' : 'Save venue'}
          className="absolute top-3 right-3 w-8 h-8 bg-card border-2 border-black flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:shadow-[3px_3px_0px_#22d3ee] transition-all duration-150 disabled:opacity-50 shadow-[2px_2px_0px_#000]"
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4 text-cyan-500" />
            : <Bookmark className="w-4 h-4" />
          }
        </button>
      </div>

      {/* ── Content ── */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Name + Rating */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-black text-primary text-base leading-tight flex-1 pr-2 uppercase tracking-[0.03em]">
              {venue.name}
            </h3>
            {!isInfra && (
              <div className="flex items-center gap-1 flex-shrink-0 bg-amber-950/20 border border-amber-500/30 px-1.5 py-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-amber-600 text-xs font-black">{venue.rating}</span>
                <span className="text-slate-400 text-[10px]">({venue.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-slate-500 text-sm mb-3 font-semibold">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-cyan-500" />
            <span>{venue.area}</span>
          </div>

          {/* Skill Badge */}
          <div className="mb-3">
            {isInfra ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 shadow-[2px_2px_0px_#000] border-2 border-black bg-card-nested text-slate-500 font-black uppercase tracking-[0.08em]">
                🏛️ PUBLIC INFRASTRUCTURE
              </span>
            ) : (
              <span className={cn('inline-flex text-[10px] px-2.5 py-1 shadow-[2px_2px_0px_#000] border-2 border-black font-black uppercase tracking-[0.08em]', getSkillBadgeColor(venue.skillLevel))}>
                {venue.skillLevel === 'all' ? 'ALL LEVELS' : venue.skillLevel.toUpperCase()}
              </span>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
            {venue.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-[10px] text-slate-500 bg-card-nested px-2 py-0.5 border border-black/30 font-semibold uppercase tracking-[0.06em]"
              >
                {amenity}
              </span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-[10px] text-slate-500 bg-card-nested px-2 py-0.5 border border-black/30 font-semibold">
                +{venue.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* ── Footer: Price / Infra Actions ── */}
        <div className="border-t-2 border-black/20 pt-4 mt-auto">
          {isInfra ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-slate-500 font-black bg-card-nested border border-black/30 px-2.5 py-1 text-[10px] tracking-[0.1em]">
                  {venue.venueCode}
                </span>
                <span
                  className={cn(
                    'font-black text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0px_#000]',
                    venue.ownershipStatus === 'pending'
                      ? 'bg-amber-400 text-black'
                      : venue.ownershipStatus === 'approved'
                      ? 'bg-emerald-400 text-black'
                      : 'bg-rose-500 text-white'
                  )}
                >
                  {venue.ownershipStatus === 'pending'
                    ? 'PENDING'
                    : venue.ownershipStatus === 'approved'
                    ? 'VERIFIED'
                    : 'UNVERIFIED'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-rose-500 font-black text-[10px] bg-rose-950/20 border border-rose-500/20 px-2 py-1 uppercase tracking-[0.08em]">
                  BOOKING N/A
                </span>
                <Link
                  href={`/venues/${venue.id}?infra=true`}
                  className="text-[11px] font-black text-cyan-500 hover:text-cyan-600 flex items-center gap-1 uppercase tracking-[0.06em]"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {venue.ownershipStatus !== 'approved' && (
                <button
                  onClick={handleVerify}
                  disabled={venue.ownershipStatus === 'pending'}
                  className={cn(
                    'w-full text-center py-2 text-[10px] font-black border-2 border-black transition-all shadow-[2px_2px_0px_#000] cursor-pointer uppercase tracking-[0.1em]',
                    venue.ownershipStatus === 'pending'
                      ? 'bg-card-nested text-slate-500 border-slate-300 shadow-none cursor-not-allowed opacity-70'
                      : 'bg-cyan-400 text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000]'
                  )}
                >
                  {venue.ownershipStatus === 'pending' ? 'VERIFICATION PENDING' : 'VERIFY OWNERSHIP'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-xl font-black text-primary"
                  style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                >
                  {formatCurrency(venue.price)}
                </span>
                <span className="text-slate-500 text-[10px] ml-1 font-mono-label">/HR</span>
              </div>
              <Link
                href={`/venues/${venue.id}`}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-black transition-all duration-150 uppercase tracking-[0.08em] px-3 py-1.5 border-2',
                  venue.available
                    ? 'bg-yellow-400 text-black border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#22d3ee]'
                    : 'text-slate-400 border-slate-300 pointer-events-none bg-transparent'
                )}
              >
                {venue.available ? 'BOOK NOW' : 'UNAVAILABLE'}
                {venue.available && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
