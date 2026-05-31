'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Clock, MapPin, Bookmark, User, Bot, ArrowRight, X, Loader2,
  Ticket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { cancelBooking, getVenuesByIds } from '@/backend/firebase/firestore';
import { onSnapshot, query, collection, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/backend/firebase/config';
import { Booking, Venue } from '@/shared/types';
import { formatCurrency, formatDate, getSportEmoji, cn } from '@/shared/helpers/utils';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';
import { getBookingLifecycle } from '@/shared/helpers/pricing';

type DashboardTab = 'bookings' | 'saved' | 'ai' | 'profile';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [savedVenues, setSavedVenues] = useState<Venue[]>([]);
  const [savedVenuesLoading, setSavedVenuesLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  // Real-time bookings listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('playerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      data.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeB - timeA;
      });
      setBookings(data);
      setBookingsLoading(false);
    }, (error) => {
      console.error('Bookings listener error:', error);
      setBookingsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Load saved venues from Firestore (not static array)
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (!profile?.savedVenues?.length) {
        setSavedVenues([]);
        return;
      }
      setSavedVenuesLoading(true);
      getVenuesByIds(profile.savedVenues)
        .then((data) => {
          if (active) setSavedVenues(data);
        })
        .catch(() => {
          if (active) setSavedVenues([]);
        })
        .finally(() => {
          if (active) setSavedVenuesLoading(false);
        });
    });
    return () => { active = false; };
  }, [profile?.savedVenues]);

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      await cancelBooking(bookingId);
    } finally {
      setCancelling(null);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to remove this cancelled booking from your history?')) return;
    setDeleting(bookingId);
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } catch (e: any) {
      console.error('Delete error:', e);
      alert('Failed to delete booking: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const upcoming = bookings.filter((b) => getBookingLifecycle(b) === 'upcoming');
  const history = bookings.filter((b) => {
    const lifecycle = getBookingLifecycle(b);
    return lifecycle === 'completed' || lifecycle === 'expired' || lifecycle === 'cancelled';
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'bookings', label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'saved', label: 'Saved Venues', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Concierge', icon: <Bot className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">
              Welcome back, <span className="gradient-text">{profile?.displayName?.split(' ')[0] || 'Player'}</span> 👋
            </h1>
            <p className="text-slate-400">{upcoming.length} upcoming booking{upcoming.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/venues" className="btn-primary hidden md:flex">
            Book a Venue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Upcoming', value: bookings.filter((b) => getBookingLifecycle(b) === 'upcoming').length, color: 'text-cyan-400' },
            { label: 'Completed', value: bookings.filter((b) => getBookingLifecycle(b) === 'completed').length, color: 'text-emerald-400' },
            { label: 'Cancelled', value: bookings.filter((b) => getBookingLifecycle(b) === 'cancelled').length, color: 'text-red-400' },
            { label: 'Total Spent', value: `₹${bookings.filter(b => getBookingLifecycle(b) !== 'cancelled').reduce((s, b) => s + (b.amount !== undefined ? b.amount : (b.price || 0)), 0)}`, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-lg p-4 text-center border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold whitespace-nowrap transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                tab === t.id
                  ? 'bg-cyan-400 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: BOOKINGS ─────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : bookings.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">No bookings yet</h3>
                <p className="text-slate-400 mb-6">Start exploring venues and book your first session!</p>
                <Link href="/venues" className="btn-primary">Explore Venues</Link>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-cyan-400 border border-black shadow-[1px_1px_0px_#000]" /> Upcoming ({upcoming.length})
                    </h2>
                    {upcoming.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} cancelling={cancelling} onDelete={handleDelete} deleting={deleting} />
                    ))}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-display font-bold text-slate-400 mb-3">History</h2>
                    {history.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} cancelling={cancelling} onDelete={handleDelete} deleting={deleting} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: SAVED VENUES ───────────────────────────────────── */}
        {tab === 'saved' && (
          <div>
            {savedVenuesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : savedVenues.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">🔖</div>
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">No saved venues</h3>
                <p className="text-slate-400 mb-6">Bookmark venues while browsing to save them here</p>
                <Link href="/venues" className="btn-primary">Browse Venues</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedVenues.map((v) => (
                  <Link key={v.id} href={`/venues/${v.id}`} className="glass rounded-lg p-4 card-hover border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_#facc15] block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.imageUrl} alt={v.name} className="w-full h-32 object-cover rounded-md mb-3 border-2 border-black" />
                    <h3 className="font-display font-bold text-slate-200 mb-1">{v.name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{v.area}</p>
                    <div className="flex items-center justify-between border-t border-black/30 pt-2 mt-2">
                      <span className="text-cyan-400 font-bold">{formatCurrency(v.price)}/hr</span>
                      <span className="text-amber-400 text-sm font-semibold">★ {v.rating}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: AI CONCIERGE ───────────────────────────────────── */}
        {tab === 'ai' && (
          <div className="max-w-2xl mx-auto">
            <AIConciergePreview />
          </div>
        )}



        {/* ── TAB: PROFILE ─────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div className="glass rounded-lg p-8 max-w-lg border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-200">{profile?.displayName || 'Player'}</h2>
                <p className="text-slate-400">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-black/30">
                <span className="text-slate-400">Account Type</span>
                <span className="text-slate-200 font-bold capitalize bg-slate-900 border border-black px-2.5 py-1 rounded-md shadow-[1px_1px_0px_#000]">
                  {profile?.role === 'player' ? '🏃 Player' : profile?.role === 'owner' ? '🏢 Owner' : profile?.role || 'player'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-black/30">
                <span className="text-slate-400">Total Bookings</span>
                <span className="text-slate-200 font-bold">{bookings.length}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-black/30">
                <span className="text-slate-400">Saved Venues</span>
                <span className="text-slate-200 font-bold">{profile?.savedVenues?.length || 0}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Total Spent</span>
                <span className="text-slate-200 font-bold">{formatCurrency(bookings.filter(b => (b.bookingStatus || b.status) !== 'cancelled').reduce((s, b) => s + (b.amount !== undefined ? b.amount : (b.price || 0)), 0))}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
  onDelete,
  deleting,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancelling: string | null;
  onDelete?: (id: string) => void;
  deleting?: string | null;
}) {
  const lifecycle = getBookingLifecycle(booking);
  const pStatus = booking.paymentStatus;
  
  let statusText = 'Upcoming';
  let statusClass = 'text-black bg-cyan-400 border-black shadow-[2px_2px_0px_#000]';
  let showPayButton = false;
  let showRetryButton = false;
  let showCancelButton = false;
  let showPlayedDate = false;

  const bStatus = (booking.bookingStatus || booking.status) as string;

  if (lifecycle === 'cancelled') {
    if (pStatus === 'refund_pending') {
      statusText = 'Refund Pending';
      statusClass = 'text-black bg-pink-400 border-black shadow-[2px_2px_0px_#000]';
    } else {
      statusText = 'Cancelled';
      statusClass = 'text-black bg-rose-400 border-black shadow-[2px_2px_0px_#000]';
    }
  } else if (lifecycle === 'completed') {
    statusText = 'Completed';
    statusClass = 'text-white bg-slate-700 border-black shadow-[2px_2px_0px_#000]';
    showPlayedDate = true;
  } else if (lifecycle === 'expired') {
    statusText = 'Expired';
    statusClass = 'text-slate-400 bg-slate-900 border-slate-700 shadow-none border-dashed';
  } else {
    // lifecycle === 'upcoming'
    if (pStatus === 'payment_pending') {
      statusText = 'Payment Pending';
      statusClass = 'text-black bg-amber-400 border-black shadow-[2px_2px_0px_#000]';
      showPayButton = true;
      showCancelButton = true;
    } else if (pStatus === 'verification_pending') {
      statusText = 'Verification Pending';
      statusClass = 'text-black bg-cyan-300 border-black shadow-[2px_2px_0px_#000]';
      showCancelButton = true;
    } else if (pStatus === 'paid' || bStatus === 'confirmed' || bStatus === 'upcoming') {
      statusText = 'Upcoming';
      statusClass = 'text-black bg-cyan-400 border-black shadow-[2px_2px_0px_#000]';
      showCancelButton = true;
    } else if (pStatus === 'rejected') {
      statusText = 'Payment Rejected';
      statusClass = 'text-white bg-red-600 border-black shadow-[2px_2px_0px_#000]';
      showRetryButton = true;
      showCancelButton = true;
    } else {
      statusText = 'Upcoming';
      statusClass = 'text-black bg-cyan-400 border-black shadow-[2px_2px_0px_#000]';
      showCancelButton = true;
    }
  }

  const amount = booking.amount !== undefined ? booking.amount : (booking.price || 0);
  const ticketId = booking.ticketId || booking.ticketNumber;

  return (
    <div className="glass rounded-lg p-5 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] transition-all">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-3xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000]">{getSportEmoji(booking.sport)}</div>
        <div>
          <h3 className="font-display font-bold text-slate-200 text-base">{booking.venueName}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{booking.venueArea}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.slot}</span>
          </div>
          {ticketId && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">{ticketId}</span>
            </div>
          )}
          {showPlayedDate && (
            <div className="text-[10px] text-emerald-400 font-extrabold mt-1.5 tracking-wider uppercase">
              Played on {formatDate(booking.date)}
            </div>
          )}
          {booking.utrNumber && (
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              UTR: {booking.utrNumber}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-black/30 pt-3 md:pt-0 mt-2 md:mt-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-3 py-1.5 rounded-md border-2', statusClass)}>
            {statusText}
          </span>
          {showPayButton && (
            <Link 
              href={`/bookings/${booking.bookingId}/payment`}
              className="text-xs font-bold px-3 py-1.5 rounded-md bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-cyan-300 transition-colors"
            >
              Pay Now
            </Link>
          )}
          {showRetryButton && (
            <Link 
              href={`/bookings/${booking.bookingId}/payment`}
              className="text-xs font-bold px-3 py-1.5 rounded-md bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-yellow-300 transition-colors"
            >
              Retry Payment
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-200 text-lg">{formatCurrency(amount)}</span>
          {showCancelButton && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={cancelling === booking.id}
              className="w-8 h-8 rounded-md bg-rose-500 hover:bg-rose-400 border-2 border-black text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              title="Cancel Booking"
            >
              {cancelling === booking.id ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <X className="w-4 h-4 stroke-[3px]" />}
            </button>
          )}
          {lifecycle === 'cancelled' && onDelete && (
            <button
              onClick={() => onDelete(booking.id)}
              disabled={deleting === booking.id}
              className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-400 border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              title="Remove from History"
            >
              {deleting === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : 'Remove History'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
