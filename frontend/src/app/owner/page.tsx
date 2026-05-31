'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Plus, Calendar, BarChart3, Clock, Loader2, Trash2, Pencil, Eye, EyeOff, Ticket, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import {
  subscribeOwnerVenues,
  subscribeOwnerBookings,
  addVenue,
  updateVenue,
  deleteVenue,
  approvePayment,
  rejectPayment,
  updateUserProfile,
  subscribeOwnerOwnershipRequests,
  submitOwnershipRequest,
  getInfrastructureByVenueCode,
} from '@/backend/firebase/firestore';
import { Venue, Booking, OwnershipRequest } from '@/shared/types';
import { formatCurrency, formatDate, getSportEmoji, cn } from '@/shared/helpers/utils';
import { VenueForm, VenueFormData } from '@/components/owner/VenueForm';

type OwnerTab = 'overview' | 'venues' | 'verify' | 'bookings' | 'analytics';

const getProgressWidthClass = (pct: number) => {
  const rounded = Math.round(pct / 10) * 10;
  switch (rounded) {
    case 10: return 'w-[10%]';
    case 20: return 'w-[20%]';
    case 30: return 'w-[30%]';
    case 40: return 'w-[40%]';
    case 50: return 'w-[50%]';
    case 60: return 'w-[60%]';
    case 70: return 'w-[70%]';
    case 80: return 'w-[80%]';
    case 90: return 'w-[90%]';
    case 100: return 'w-full';
    default: return 'w-0';
  }
};

export default function OwnerDashboardPage() {
  const { user, profile, isApprovedOwner, isOwner } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<OwnerTab>('overview');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Ownership request states
  const [ownerRequests, setOwnerRequests] = useState<OwnershipRequest[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');
  const [verificationProofUrl, setVerificationProofUrl] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Payout states
  const [ownerUpi, setOwnerUpi] = useState('');
  const [ownerQrBase64, setOwnerQrBase64] = useState('');
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bookingSubTab, setBookingSubTab] = useState<'requests' | 'confirmed' | 'tickets'>('requests');

  useEffect(() => {
    if (profile) {
      setOwnerUpi(profile.upiId || '');
      setOwnerQrBase64(profile.qrCodeUrl || '');
    }
  }, [profile]);

  const handleSavePayout = async () => {
    if (!user) return;
    setPayoutSaving(true);
    try {
      await updateUserProfile(user.uid, {
        upiId: ownerUpi,
        qrCodeUrl: ownerQrBase64
      });
      showSuccess('💼 Payout settings saved!');
    } catch (err) {
      console.error('Error saving payout details:', err);
      alert('Unable to save payout details. Please try again.');
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await approvePayment(bookingId);
      showSuccess('✅ Payment approved & ticket generated!');
    } catch (err) {
      console.error('Error approving payment:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await rejectPayment(bookingId);
      showSuccess('❌ Payment proof rejected.');
    } catch (err) {
      console.error('Error rejecting payment:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Subscribe to owner venues in real-time
  useEffect(() => {
    if (!user) return;
    let active = true;
    let unsub: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (!active) return;
      setVenuesLoading(true);
      unsub = subscribeOwnerVenues(user.uid, (v) => {
        if (active) {
          setVenues(v);
          setVenuesLoading(false);
        }
      });
    });
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [user]);

  // Subscribe to bookings for the owner in realtime
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeOwnerBookings(user.uid, setBookings);
    return () => unsub();
  }, [user]);

  // Subscribe to owner's ownership requests in real-time
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeOwnerOwnershipRequests(user.uid, setOwnerRequests);
    return () => unsub();
  }, [user]);

  // Handle URL query parameters for prefilling verification venue code
  useEffect(() => {
    const codeParam = searchParams.get('code');
    const tabParam = searchParams.get('tab');
    if (codeParam) {
      setVerificationCode(codeParam);
    }
    if (tabParam === 'verify') {
      setTab('verify');
    }
  }, [searchParams]);

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!verificationCode.trim() || !verificationPhone.trim() || !verificationProofUrl.trim()) {
      setVerificationError('Please fill out all required fields.');
      return;
    }

    setSubmittingVerification(true);
    setVerificationError('');
    setVerificationSuccess('');

    try {
      // 1. Verify that the infrastructure record exists for the code
      const infra = await getInfrastructureByVenueCode(verificationCode.trim());
      if (!infra) {
        setVerificationError('Invalid Venue Code. Please verify and try again.');
        setSubmittingVerification(false);
        return;
      }

      // 2. Check if a request already exists for this code (approved or pending)
      const existing = ownerRequests.find((r) => r.venueCode === verificationCode.trim());
      if (existing) {
        if (existing.status === 'approved') {
          setVerificationError('You have already been verified as the owner of this venue.');
        } else if (existing.status === 'pending') {
          setVerificationError('A verification request is already pending for this venue.');
        } else {
          setVerificationError('A previous request was rejected. Please contact support.');
        }
        setSubmittingVerification(false);
        return;
      }

      // 3. Submit request
      await submitOwnershipRequest({
        venueCode: verificationCode.trim(),
        infrastructureId: infra.id,
        infrastructureName: infra.name,
        ownerId: user.uid,
        ownerName: profile.displayName || 'Venue Owner',
        ownerEmail: user.email || '',
        phone: verificationPhone.trim(),
        proofType: 'URL',
        proofUrl: verificationProofUrl.trim(),
        notes: verificationNotes.trim(),
      });

      setVerificationSuccess('🎉 Ownership verification request submitted successfully! Awaiting Admin verification.');
      setVerificationCode('');
      setVerificationPhone('');
      setVerificationProofUrl('');
      setVerificationNotes('');
    } catch (err: any) {
      console.error('Error submitting ownership request:', err);
      setVerificationError(err.message || 'Failed to submit ownership request.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleAddVenue = async (formData: VenueFormData) => {
    if (!user) return;
    await addVenue({
      ...formData,
      ownerId: user.uid,
      source: 'owner',
      approvalStatus: 'approved',
      rating: 4.0,
      reviewCount: 0,
      category: formData.sport,
      peakPricing: {
        morning: Math.round(formData.price * 1.1),
        afternoon: Math.round(formData.price * 0.85),
        evening: Math.round(formData.price * 1.3),
      },
    });
    showSuccess('✅ Venue added successfully!');
    setTab('venues');
  };

  const handleEditVenue = async (formData: VenueFormData) => {
    if (!editingVenue) return;
    await updateVenue(editingVenue.id, {
      ...formData,
      peakPricing: {
        morning: Math.round(formData.price * 1.1),
        afternoon: Math.round(formData.price * 0.85),
        evening: Math.round(formData.price * 1.3),
      },
    });
    showSuccess('✅ Venue updated!');
    setEditingVenue(null);
    setTab('venues');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this venue? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteVenue(id);
      showSuccess('🗑️ Venue deleted.');
    } catch (err) {
      console.error('Error deleting venue:', err);
      alert('Unable to delete venue. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (venue: Venue) => {
    setTogglingId(venue.id);
    try {
      await updateVenue(venue.id, { available: !venue.available });
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Unable to toggle venue availability. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Stats ──
  const totalRevenue = bookings.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + (b.amount !== undefined ? b.amount : (b.price || 0)), 0);
  const upcomingBookings = bookings.filter((b) => ((b.bookingStatus || b.status) as string) === 'confirmed' || ((b.bookingStatus || b.status) as string) === 'upcoming');
  const activeVenues = venues.filter((v) => v.available);

  // Sub-tabs groupings
  const verificationRequests = bookings.filter((b) => b.paymentStatus === 'verification_pending');
  const confirmedBookings = bookings.filter((b) => ((b.bookingStatus || b.status) as string) === 'confirmed' || ((b.bookingStatus || b.status) as string) === 'upcoming');
  const ticketRecords = bookings.filter((b) => !!(b.ticketId || b.ticketNumber));

  // ── Pending approval guard ─────────────────────────────────────────────────
  if (isOwner && !isApprovedOwner) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-slate-900 border-3 border-black rounded-lg p-10 shadow-[8px_8px_0px_0px_#000] text-center">
          <div className="w-20 h-20 rounded-md bg-amber-400 border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_#000]">
            <Clock className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-display text-2xl font-black text-slate-200 uppercase tracking-wide mb-3">
            Pending Approval
          </h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Your Venue Owner account is under review. Our admin team will verify your account within 24 hours. 
            Once approved, you&apos;ll have full access to the Owner Dashboard to list and manage your venues.
          </p>
          <div className="bg-amber-400/10 border-2 border-amber-400/40 rounded-md p-4 text-amber-300 text-sm font-medium mb-6">
            📧 You&apos;ll be notified when your account is approved. You can refresh this page to check your status.
          </div>
          <button onClick={() => router.push('/')} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const TABS: { id: OwnerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'venues', label: 'My Venues', icon: <Building2 className="w-4 h-4" /> },
    { id: 'verify', label: 'Add / Verify Venue', icon: <Plus className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-md bg-cyan-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <h1 className="font-display text-3xl font-bold">
                Owner <span className="gradient-text">Dashboard</span>
              </h1>
            </div>
            <p className="text-slate-400">
              {profile?.displayName} &bull; {venues.length} venue{venues.length !== 1 ? 's' : ''} listed
            </p>
          </div>
          {successMsg && (
            <div className="bg-emerald-400 border-2 border-black rounded-md px-4 py-2 text-black text-sm font-bold shadow-[3px_3px_0px_#000]">
              {successMsg}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setEditingVenue(null); }}
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

        {/* ── TAB: OVERVIEW ──────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Venues', value: venues.length, color: 'text-cyan-400', icon: '🏢' },
                { label: 'Active Venues', value: activeVenues.length, color: 'text-emerald-400', icon: '✅' },
                { label: 'Total Bookings', value: bookings.length, color: 'text-amber-400', icon: '📅' },
                { label: 'Revenue', value: formatCurrency(totalRevenue), color: 'text-purple-400', icon: '💰' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Upcoming bookings summary */}
            <div className="glass rounded-lg p-6 border-2 border-black">
              <h2 className="font-display font-bold text-slate-200 text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" /> Upcoming Bookings ({upcomingBookings.length})
              </h2>
              {upcomingBookings.length === 0 ? (
                <p className="text-slate-400 text-sm">No upcoming bookings yet.</p>
              ) : (
                upcomingBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3 border-b border-black/20 last:border-0">
                    <div>
                      <div className="text-slate-200 font-bold text-sm">{b.venueName}</div>
                      <div className="text-slate-400 text-xs">{b.playerName || 'Player'} • {formatDate(b.date)} • {b.slot}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-cyan-400 bg-slate-900 border border-black px-2 py-1 rounded">
                        {b.ticketId || b.ticketNumber || 'NO TICKET'}
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">{formatCurrency(b.amount !== undefined ? b.amount : (b.price || 0))}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payout Settings Card */}
            <div className="glass rounded-lg p-6 border-2 border-black">
              <h2 className="font-display font-bold text-slate-200 text-lg mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" /> Payout Settings (UPI / QR Code)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="owner-upi-id" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Your Payout UPI ID
                  </label>
                  <input
                    id="owner-upi-id"
                    type="text"
                    placeholder="e.g. venueowner@upi"
                    value={ownerUpi}
                    onChange={(e) => setOwnerUpi(e.target.value)}
                    className="w-full bg-slate-900 border-2 border-black rounded-md px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">This UPI ID will be shown to players during checkout.</p>
                </div>
                <div>
                  <label htmlFor="owner-qr-upload" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Payout QR Code (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative border-2 border-dashed border-black rounded-md p-3 bg-slate-900 transition-colors text-center cursor-pointer flex-grow">
                      <input
                        id="owner-qr-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setOwnerQrBase64(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload QR Code"
                      />
                      <span className="text-xs text-slate-400">
                        {ownerQrBase64 ? '✓ QR Code uploaded (click to change)' : 'Upload QR Code image'}
                      </span>
                    </div>
                    {ownerQrBase64 && (
                      <button
                        type="button"
                        onClick={() => setOwnerQrBase64('')}
                        className="text-xs text-rose-400 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePayout}
                  disabled={payoutSaving}
                  className="btn-primary py-2 px-5 text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-2"
                >
                  {payoutSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Payout Details'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MY VENUES ─────────────────────────────────── */}
        {tab === 'venues' && !editingVenue && (
          <div>
            {venuesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
            ) : venues.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">No venues yet</h3>
                <p className="text-slate-400 mb-6">Add your first sports venue to start receiving bookings.</p>
                <button onClick={() => setTab('verify')} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Your First Venue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {venues.map((venue) => (
                  <div key={venue.id} className="glass rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                    <div className="relative h-36 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <div className="text-slate-200 font-display font-bold">{venue.name}</div>
                          <div className="text-slate-300 text-xs">{getSportEmoji(venue.sport)} {venue.area}</div>
                        </div>
                        <div className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_#000]',
                          venue.available ? 'bg-emerald-400 text-black' : 'bg-rose-400 text-black'
                        )}>
                          {venue.available ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-cyan-400 font-bold">{formatCurrency(venue.price)}/hr</span>
                        <span className="text-slate-400 text-xs">{bookings.filter((b) => b.venueId === venue.id).length} bookings</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingVenue(venue); setTab('venues'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 border-2 border-black rounded-md text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all shadow-[2px_2px_0px_#000]"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(venue)}
                          disabled={togglingId === venue.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 border-2 border-black rounded-md text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all shadow-[2px_2px_0px_#000] disabled:opacity-50"
                        >
                          {togglingId === venue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : venue.available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {venue.available ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          disabled={deletingId === venue.id}
                          className="w-10 flex items-center justify-center py-2 bg-rose-900/40 border-2 border-black rounded-md text-rose-400 hover:bg-rose-900/70 transition-all shadow-[2px_2px_0px_#000] disabled:opacity-50"
                        >
                          {deletingId === venue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EDIT VENUE (inline) ─────────────────────────────── */}
        {tab === 'venues' && editingVenue && (
          <div className="glass rounded-lg p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <h2 className="font-display font-bold text-slate-200 text-xl mb-6">Edit Venue: {editingVenue.name}</h2>
            <VenueForm
              mode="edit"
              initialData={editingVenue}
              onSubmit={handleEditVenue as Parameters<typeof VenueForm>[0]['onSubmit']}
              onCancel={() => setEditingVenue(null)}
            />
          </div>
        )}

        {/* ── TAB: VERIFY / ADD VENUE ─────────────────────────── */}
        {tab === 'verify' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Private Listing Form */}
            <div className="glass rounded-lg p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] h-fit">
              <h2 className="font-display font-bold text-slate-200 text-xl mb-1">Create New Venue Listing</h2>
              <p className="text-slate-400 text-xs mb-6">List a new private sports facility to receive bookings.</p>
              <VenueForm
                mode="add"
                onSubmit={handleAddVenue as Parameters<typeof VenueForm>[0]['onSubmit']}
                onCancel={() => setTab('venues')}
              />
            </div>

            {/* Mapped Infrastructure Verification Form */}
            <div className="space-y-6">
              <div className="glass rounded-lg p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000]">
                <h2 className="font-display font-bold text-slate-200 text-xl mb-1">Verify Existing Venue Ownership</h2>
                <p className="text-slate-400 text-xs mb-6">Enter the permanent venue code of a mapped sports infrastructure facility to verify ownership.</p>
                
                {verificationError && (
                  <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 px-4 py-2.5 rounded-md text-xs font-bold mb-4">
                    ⚠️ {verificationError}
                  </div>
                )}
                {verificationSuccess && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-md text-xs font-bold mb-4">
                    {verificationSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitVerification} className="space-y-4">
                  <div>
                    <label htmlFor="verify-venue-code" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Venue Code *
                    </label>
                    <input
                      id="verify-venue-code"
                      type="text"
                      placeholder="e.g. PS-LKO-BAD-1043"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:shadow-[1px_1px_0px_#000] transition-all shadow-[2px_2px_0px_#000]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="verify-phone" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Phone Number *
                    </label>
                    <input
                      id="verify-phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={verificationPhone}
                      onChange={(e) => setVerificationPhone(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:shadow-[1px_1px_0px_#000] transition-all shadow-[2px_2px_0px_#000]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="verify-proof" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Proof Document URL *
                    </label>
                    <input
                      id="verify-proof"
                      type="url"
                      placeholder="e.g. Google Drive link to electricity bill or tax receipt"
                      value={verificationProofUrl}
                      onChange={(e) => setVerificationProofUrl(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:shadow-[1px_1px_0px_#000] transition-all shadow-[2px_2px_0px_#000]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="verify-notes" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      id="verify-notes"
                      rows={3}
                      placeholder="Specify your association (e.g. Owner, Lessee, Manager)"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-black rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:shadow-[1px_1px_0px_#000] transition-all shadow-[2px_2px_0px_#000]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVerification}
                    className="w-full btn-primary py-2.5 text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingVerification ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      'Submit Ownership Verification Request'
                    )}
                  </button>
                </form>
              </div>

              {/* Your Requests List */}
              <div className="glass rounded-lg p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000]">
                <h3 className="font-display font-bold text-slate-200 text-base mb-4">Ownership Verification Requests</h3>
                {ownerRequests.length === 0 ? (
                  <p className="text-slate-400 text-xs">No verification requests submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {ownerRequests.map((req) => (
                      <div key={req.id} className="bg-slate-950 border border-black/80 rounded p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-cyan-400 font-bold">{req.venueCode}</span>
                          <span className={cn(
                            'text-[10px] font-black px-2 py-0.5 rounded border border-black',
                            req.status === 'approved' && 'bg-emerald-400 text-black',
                            req.status === 'pending' && 'bg-amber-400 text-black',
                            req.status === 'rejected' && 'bg-rose-500 text-white'
                          )}>
                            {req.status === 'approved' && 'Ownership Verified'}
                            {req.status === 'pending' && 'Verification Pending'}
                            {req.status === 'rejected' && 'Verification Rejected'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-200">{req.infrastructureName}</div>
                        <div className="text-[10px] text-slate-500">
                          Submitted on {req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : new Date((req.createdAt as any).seconds * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: BOOKINGS ────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-6">
            
            {/* Sub-tabs Selection */}
            <div className="flex border-b-2 border-black/30 pb-px gap-4">
              {[
                { id: 'requests', label: 'Verification Requests', count: verificationRequests.length },
                { id: 'confirmed', label: 'Confirmed Bookings', count: confirmedBookings.length },
                { id: 'tickets', label: 'Ticket Records', count: ticketRecords.length }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setBookingSubTab(subTab.id as any)}
                  className={cn(
                    'pb-3 font-bold text-sm relative transition-colors',
                    bookingSubTab === subTab.id
                      ? 'text-cyan-600 dark:text-cyan-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-600 dark:after:bg-cyan-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {subTab.label}
                  <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-black/60 px-1.5 py-0.5 rounded font-mono text-slate-900 dark:text-slate-200">
                    {subTab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Sub-tab Content: Verification Requests */}
            {bookingSubTab === 'requests' && (
              <div className="space-y-4">
                {verificationRequests.length === 0 ? (
                  <div className="glass rounded-lg p-10 text-center border border-black/40">
                    <div className="text-4xl mb-3">✓</div>
                    <p className="text-slate-400 text-sm">All caught up! No pending verification requests.</p>
                  </div>
                ) : (
                  verificationRequests.map((b) => {
                    const amount = b.amount !== undefined ? b.amount : (b.price || 0);
                    return (
                      <div key={b.id} className="glass rounded-lg p-5 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        <div className="flex items-start gap-4 flex-grow">
                          <div className="text-3xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000] flex-shrink-0">
                            {getSportEmoji(b.sport)}
                          </div>
                          <div className="space-y-1">
                            <div className="font-display font-bold text-slate-200 text-base">{b.venueName}</div>
                            <div className="text-slate-400 text-xs flex flex-wrap gap-x-3 gap-y-1">
                              <span className="font-semibold text-slate-300">Player: {b.playerName || 'Player'} ({b.playerEmail})</span>
                              <span>•</span>
                              <span>Date: {formatDate(b.date)}</span>
                              <span>•</span>
                              <span>Slot: {b.slot}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              UTR Number: <strong className="text-slate-300 font-bold select-all">{b.utrNumber}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Screenshot proof */}
                        {b.screenshotUrl && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={b.screenshotUrl}
                              alt="Payment Proof"
                              className="w-24 h-16 object-contain rounded border-2 border-black bg-slate-950 cursor-zoom-in hover:scale-105 transition-transform"
                              onClick={() => {
                                window.open(b.screenshotUrl, '_blank');
                              }}
                              title="Click to view full image"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3 border-t lg:border-t-0 border-black/20 pt-3 lg:pt-0 justify-between lg:justify-end flex-shrink-0">
                          <span className="font-extrabold text-slate-200 text-lg lg:mr-2">{formatCurrency(amount)}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReject(b.bookingId)}
                              disabled={processingId === b.bookingId}
                              className="px-3.5 py-2 rounded-md bg-rose-900/40 text-rose-400 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_#000] hover:bg-rose-900/70 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(b.bookingId)}
                              disabled={processingId === b.bookingId}
                              className="px-3.5 py-2 rounded-md bg-emerald-400 text-black border-2 border-black text-xs font-bold shadow-[2px_2px_0px_#000] hover:bg-emerald-300 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === b.bookingId ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Verify & Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Sub-tab Content: Confirmed Bookings */}
            {bookingSubTab === 'confirmed' && (
              <div className="space-y-4">
                {confirmedBookings.length === 0 ? (
                  <div className="glass rounded-lg p-10 text-center border border-black/40">
                    <p className="text-slate-400 text-sm">No confirmed bookings found.</p>
                  </div>
                ) : (
                  confirmedBookings.map((b) => {
                    const amount = b.amount !== undefined ? b.amount : (b.price || 0);
                    return (
                      <div key={b.id} className="glass rounded-lg p-5 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000]">
                            {getSportEmoji(b.sport)}
                          </div>
                          <div>
                            <div className="font-display font-bold text-slate-200">{b.venueName}</div>
                            <div className="text-slate-400 text-sm flex flex-wrap gap-2 mt-1">
                              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{b.playerName || 'Player'}</span>
                              <span>•</span>
                              <span>{formatDate(b.date)}</span>
                              <span>•</span>
                              <span>{b.slot}</span>
                            </div>
                            {(b.ticketId || b.ticketNumber) && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">{b.ticketId || b.ticketNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-md border-2 border-black bg-emerald-400 text-black shadow-[2px_2px_0px_#000]">
                            Confirmed
                          </span>
                          <span className="font-bold text-slate-200 text-lg">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Sub-tab Content: Ticket Records */}
            {bookingSubTab === 'tickets' && (
              <div className="space-y-4">
                {ticketRecords.length === 0 ? (
                  <div className="glass rounded-lg p-10 text-center border border-black/40">
                    <p className="text-slate-400 text-sm">No ticket records found.</p>
                  </div>
                ) : (
                  ticketRecords.map((b) => {
                    const amount = b.amount !== undefined ? b.amount : (b.price || 0);
                    return (
                      <div key={b.id} className="glass rounded-lg p-5 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000]">
                            {getSportEmoji(b.sport)}
                          </div>
                          <div>
                            <div className="font-display font-bold text-slate-200">{b.venueName}</div>
                            <div className="text-slate-400 text-sm flex flex-wrap gap-2 mt-1">
                              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{b.playerName || 'Player'}</span>
                              <span>•</span>
                              <span>{formatDate(b.date)}</span>
                              <span>•</span>
                              <span>{b.slot}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">{b.ticketId || b.ticketNumber}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          <span className="font-bold text-slate-200 text-lg">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

        {/* ── TAB: ANALYTICS ────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            {/* New metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="font-display text-lg font-bold text-cyan-400 truncate">
                  {venues.length > 0 ? (
                    (() => {
                      const sorted = [...venues].sort((a, b) => {
                        const countA = bookings.filter(bk => bk.venueId === a.id && bk.paymentStatus === 'paid').length;
                        const countB = bookings.filter(bk => bk.venueId === b.id && bk.paymentStatus === 'paid').length;
                        return countB - countA;
                      });
                      return sorted[0]?.name || 'N/A';
                    })()
                  ) : 'N/A'}
                </div>
                <div className="text-slate-400 text-xs mt-1">Most Popular Venue</div>
              </div>
              <div className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-display text-2xl font-bold text-emerald-400">
                  {bookings.length > 0 ? Math.round((bookings.filter(b => b.paymentStatus === 'paid').length / bookings.length) * 100) : 0}%
                </div>
                <div className="text-slate-400 text-xs mt-1">Confirmation Rate (Paid/Total)</div>
              </div>
              <div className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center">
                <div className="text-3xl mb-2">⚙️</div>
                <div className="font-display text-2xl font-bold text-amber-400">
                  {venues.filter(v => v.available).length} / {venues.length}
                </div>
                <div className="text-slate-400 text-xs mt-1">Venue Activity Ratio (Active/Total)</div>
              </div>
            </div>

            {venues.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-display text-lg font-bold text-slate-200 mb-1">No Analytics Available</h3>
                <p className="text-slate-400 text-sm">List a venue and receive bookings to view venue-specific performance analytics.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {venues.map((v) => {
                  const venueBookings = bookings.filter((b) => b.venueId === v.id && (b.bookingStatus || b.status) !== 'cancelled');
                  const revenue = venueBookings.reduce((s, b) => s + (b.amount !== undefined ? b.amount : (b.price || 0)), 0);
                  const pct = venues.length > 0 ? Math.round((venueBookings.length / Math.max(bookings.filter(b => (b.bookingStatus || b.status) !== 'cancelled').length, 1)) * 100) : 0;
                  
                  // Calculate Popularity Rank among all owned venues based on confirmed (paid) bookings
                  const sortedByConfirmed = [...venues].sort((a, b) => {
                    const countA = bookings.filter(bk => bk.venueId === a.id && bk.paymentStatus === 'paid').length;
                    const countB = bookings.filter(bk => bk.venueId === b.id && bk.paymentStatus === 'paid').length;
                    return countB - countA;
                  });
                  const rankIndex = sortedByConfirmed.findIndex(item => item.id === v.id);
                  const popularityRank = rankIndex !== -1 ? rankIndex + 1 : '-';

                  return (
                    <div key={v.id} className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{getSportEmoji(v.sport)}</div>
                          <div>
                            <div className="font-display font-bold text-slate-200 text-sm">{v.name}</div>
                            <div className="text-slate-400 text-xs">{v.area}</div>
                          </div>
                        </div>
                        <div className="text-xs font-black px-2 py-1 rounded bg-cyan-400 text-black border border-black shadow-[1px_1px_0px_#000]">
                          Rank #{popularityRank}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Bookings</span>
                          <span className="font-bold text-slate-200">{venueBookings.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Revenue</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(revenue)}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 border border-black mt-2">
                          <div
                            className={cn(
                              "bg-cyan-400 h-2 rounded-full border-r border-black",
                              getProgressWidthClass(pct)
                            )}
                          />
                        </div>
                        <div className="text-xs text-slate-500 text-right">{pct}% of all bookings</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Revenue by sport */}
            <div className="glass rounded-lg p-6 border-2 border-black">
              <h2 className="font-display font-bold text-slate-200 text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Revenue Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
                  { label: 'Upcoming Bookings', value: upcomingBookings.length, color: 'text-cyan-400' },
                  { label: 'Completed', value: bookings.filter(b => (b.bookingStatus || b.status) === 'completed').length, color: 'text-amber-400' },
                  { label: 'Cancelled', value: bookings.filter(b => (b.bookingStatus || b.status) === 'cancelled').length, color: 'text-rose-400' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
