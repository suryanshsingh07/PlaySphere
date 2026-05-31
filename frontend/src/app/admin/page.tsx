'use client';

import { useEffect, useState } from 'react';
import {
  Shield, Building2, Calendar, Clock, CheckCircle, XCircle,
  Loader2, Ticket, User, ChevronRight, BarChart3, AlertCircle
} from 'lucide-react';
import {
  updateOwnerApproval,
  subscribeAllUsers,
  subscribeAllVenues,
  subscribeAllBookings,
  approveOwnershipRequest,
  rejectOwnershipRequest,
  subscribeOwnershipRequests,
  subscribeInfrastructure
} from '@/backend/firebase/firestore';
import { UserProfile, Venue, Booking, Infrastructure, OwnershipRequest } from '@/shared/types';
import { formatCurrency, formatDate, getSportEmoji, cn } from '@/shared/helpers/utils';
import { auth, db } from '@/backend/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const percentageClasses: Record<number, string> = {
  0: 'w-0',
  5: 'w-[5%]',
  10: 'w-[10%]',
  15: 'w-[15%]',
  20: 'w-[20%]',
  25: 'w-[25%]',
  30: 'w-[30%]',
  35: 'w-[35%]',
  40: 'w-[40%]',
  45: 'w-[45%]',
  50: 'w-[50%]',
  55: 'w-[55%]',
  60: 'w-[60%]',
  65: 'w-[65%]',
  70: 'w-[70%]',
  75: 'w-[75%]',
  80: 'w-[80%]',
  85: 'w-[85%]',
  90: 'w-[90%]',
  95: 'w-[95%]',
  100: 'w-full'
};

function getPercentageClass(pct: number) {
  const rounded = Math.min(100, Math.max(0, Math.round(pct / 5) * 5));
  return percentageClasses[rounded] || 'w-0';
}

type AdminTab = 'overview' | 'approvals' | 'players' | 'owners' | 'venues' | 'bookings' | 'infrastructure';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ownershipRequests, setOwnershipRequests] = useState<OwnershipRequest[]>([]);
  const [allInfra, setAllInfra] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryLogs, setDiscoveryLogs] = useState<string[]>([]);
  const [scanState, setScanState] = useState<{ isRunning: boolean; lastScanAt: any } | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [scanResult, setScanResult] = useState<{
    osmFetched: number;
    normalized: number;
    rejected: number;
    added: number;
    updated: number;
    skipped: number;
    enriched: number;
    errors: number;
  } | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  useEffect(() => {
    let usersLoaded = false;
    let venuesLoaded = false;
    let bookingsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && venuesLoaded && bookingsLoaded) {
        setLoading(false);
      }
    };

    const unsubUsers = subscribeAllUsers((u) => {
      setUsers(u);
      usersLoaded = true;
      checkLoading();
    });

    const unsubVenues = subscribeAllVenues((v) => {
      setVenues(v);
      venuesLoaded = true;
      checkLoading();
    });

    const unsubBookings = subscribeAllBookings((b) => {
      setBookings(b);
      bookingsLoaded = true;
      checkLoading();
    });

    const unsubClaims = subscribeOwnershipRequests((c) => {
      setOwnershipRequests(c);
    });

    const unsubInfra = subscribeInfrastructure((infraData) => {
      setAllInfra(infraData);
    });

    const unsubDiscovery = onSnapshot(doc(db, 'system_settings', 'discovery'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScanState({
          isRunning: data.isRunning || false,
          lastScanAt: data.lastScanAt ? data.lastScanAt.toDate() : null
        });
      }
    });

    return () => {
      unsubUsers();
      unsubVenues();
      unsubBookings();
      unsubClaims();
      unsubInfra();
      unsubDiscovery();
    };
  }, []);

  useEffect(() => {
    if (!scanState?.lastScanAt) {
      setCooldownLeft(0);
      return;
    }
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const lastScan = new Date(scanState.lastScanAt).getTime();
      const diffMs = now - lastScan;
      const cooldownMs = 5 * 60 * 1000;
      if (diffMs < cooldownMs) {
        setCooldownLeft(Math.ceil((cooldownMs - diffMs) / 1000));
      } else {
        setCooldownLeft(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scanState]);

  const handleApprove = async (uid: string) => {
    setApprovingId(uid);
    try {
      await updateOwnerApproval(uid, 'approved');
      showSuccess('✅ Owner approved!');
    } catch (err) {
      console.error('Error approving owner:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (uid: string) => {
    setApprovingId(uid);
    try {
      await updateOwnerApproval(uid, 'rejected');
      showSuccess('🚫 Owner rejected.');
    } catch (err) {
      console.error('Error rejecting owner:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveOwnership = async (requestId: string) => {
    setApprovingId(requestId);
    try {
      await approveOwnershipRequest(requestId);
      showSuccess('✅ Venue ownership approved & linked!');
    } catch (err) {
      console.error('Error approving ownership request:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectOwnership = async (requestId: string) => {
    setApprovingId(requestId);
    try {
      await rejectOwnershipRequest(requestId);
      showSuccess('🚫 Venue ownership rejected.');
    } catch (err) {
      console.error('Error rejecting ownership request:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { seedLandmarksAndInfrastructure } = await import('@/backend/firebase/firestore');
      await seedLandmarksAndInfrastructure();
      showSuccess('🌱 Database seeded successfully!');
    } catch (err) {
      console.error('Seeding error:', err);
      alert('Failed to seed landmarks and infrastructure.');
    } finally {
      setSeeding(false);
    }
  };

  const handleRunDiscovery = async () => {
    setDiscovering(true);
    setDiscoveryLogs(['[INFO] Requesting discovery agent launch...']);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setDiscoveryLogs((prev) => [...prev, '[ERROR] Unauthorized: No active admin session found. Please re-login.']);
        alert('You must be logged in as an admin.');
        setDiscovering(false);
        return;
      }

      const res = await fetch('/api/admin/discover-infrastructure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveryLogs(data.logs || [
          `[SUCCESS] Ingestion completed. Added: ${data.added}, Skipped: ${data.skipped}, Errors: ${data.errors}`
        ]);
        setScanResult({
          osmFetched: data.osmFetched || 0,
          normalized: data.normalized || 0,
          rejected: data.rejected || 0,
          added: data.added || 0,
          updated: data.updated || 0,
          skipped: data.skipped || 0,
          enriched: data.enriched || 0,
          errors: data.errors || 0
        });
        showSuccess(`✅ Ingested ${data.added} facilities, skipped ${data.skipped} duplicates!`);
      } else {
        setDiscoveryLogs(data.logs || [`[ERROR] ${data.error || 'Unknown error occurred.'}`]);
        alert(data.error || 'Infrastructure discovery failed.');
      }
    } catch (err: any) {
      console.error(err);
      setDiscoveryLogs((prev) => [...prev, `[ERROR] Network or server error: ${err.message || err}`]);
      alert('Failed to connect to discovery endpoint.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleSyncInfrastructure = async () => {
    await handleRunDiscovery();
  };

  const handleRefreshAnalytics = () => {
    showSuccess('📊 Refreshing analytics metrics...');
  };

  // Derived lists
  const players = users.filter((u) => u.role === 'player');
  const owners = users.filter((u) => u.role === 'owner');
  const pendingOwners = owners.filter((u) => u.approvalStatus === 'pending');
  const approvedOwners = owners.filter((u) => u.approvalStatus === 'approved');

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'approvals', label: 'Approvals', icon: <Clock className="w-4 h-4" />, badge: pendingOwners.length + ownershipRequests.filter((r) => r.status === 'pending').length },
    { id: 'players', label: 'Players', icon: <User className="w-4 h-4" /> },
    { id: 'owners', label: 'Owners', icon: <Building2 className="w-4 h-4" /> },
    { id: 'venues', label: 'Venues', icon: <Building2 className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'infrastructure', label: 'Infrastructure', icon: <Building2 className="w-4 h-4 text-purple-400" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-md bg-purple-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-slate-200">
                Admin <span className="text-[#a855f7]">Dashboard</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm">PlaySphere AI — Super Admin Control Panel</p>
          </div>
          <div className="flex items-center gap-3">
            {successMsg && (
              <div className="bg-purple-500 border-2 border-black rounded-md px-4 py-2 text-white text-sm font-bold shadow-[3px_3px_0px_#000]">
                {successMsg}
              </div>
            )}
            {pendingOwners.length > 0 && (
              <button
                onClick={() => setTab('approvals')}
                className="flex items-center gap-2 bg-amber-400 border-2 border-black rounded-md px-4 py-2 text-black text-sm font-bold shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] transition-all"
              >
                <AlertCircle className="w-4 h-4" />
                {pendingOwners.length} Pending Approval{pendingOwners.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold whitespace-nowrap transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                tab === t.id
                  ? 'bg-purple-500 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              )}
            >
              {t.icon} {t.label}
              {t.badge && t.badge > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-2 border-black rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Users', value: users.length, color: 'text-purple-400', icon: '👥' },
                { label: 'Players', value: players.length, color: 'text-cyan-400', icon: '🏃' },
                { label: 'Total Owners', value: owners.length, color: 'text-amber-400', icon: '🏢' },
                { label: 'Approved Owners', value: approvedOwners.length, color: 'text-emerald-400', icon: '✅' },
                { label: 'Total Venues', value: venues.length, color: 'text-indigo-400', icon: '📍' },
                { label: 'Total Bookings', value: bookings.length, color: 'text-rose-400', icon: '📅' },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-900 rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {pendingOwners.length > 0 && (
              <div className="bg-amber-400/10 border-2 border-amber-400/40 rounded-lg p-5 shadow-[3px_3px_0px_rgba(245,158,11,0.3)]">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display font-bold text-amber-300">Approval Queue</h3>
                </div>
                <p className="text-amber-200 text-sm mb-4">
                  {pendingOwners.length} owner{pendingOwners.length !== 1 ? 's' : ''} waiting for approval.
                </p>
                <button onClick={() => setTab('approvals')} className="flex items-center gap-2 bg-amber-400 border-2 border-black px-4 py-2 rounded-md text-black text-sm font-bold shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 transition-all">
                  Review Approvals <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="glass rounded-lg p-6 border-2 border-black shadow-[4px_4px_0px_#000] bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-slate-200 text-lg mb-1">🌱 Database Initialization & Seeding</h3>
                <p className="text-slate-400 text-sm">Deploy default landmarks and Lucknow sports infrastructure mapped areas.</p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 bg-[#22d3ee] border-2 border-black px-5 py-3 rounded-md text-black font-extrabold text-sm shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Seeding Database...
                  </>
                ) : (
                  "Seed Infrastructure & Landmarks"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: APPROVALS ────────────────────────────────────────── */}
        {tab === 'approvals' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" /> Owner Approval Queue ({pendingOwners.length} pending)
            </h2>
            {pendingOwners.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">All clear!</h3>
                <p className="text-slate-400">No pending owner approvals.</p>
              </div>
            ) : (
              pendingOwners.map((owner) => (
                <div key={owner.uid} className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-black flex items-center justify-center text-white text-xl font-bold shadow-[2px_2px_0px_#000]">
                      {owner.displayName?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <div>
                      <div className="font-display font-bold text-slate-200">{owner.displayName}</div>
                      <div className="text-slate-400 text-sm">{owner.email}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {venues.filter((v) => v.ownerId === owner.uid).length} venues listed
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="bg-amber-400/20 border-2 border-amber-400/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-md">
                      Pending
                    </span>
                    <button
                      onClick={() => handleApprove(owner.uid)}
                      disabled={approvingId === owner.uid}
                      className="flex items-center gap-1.5 bg-emerald-400 border-2 border-black text-black text-sm font-bold px-4 py-2 rounded-md shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] transition-all disabled:opacity-50"
                    >
                      {approvingId === owner.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(owner.uid)}
                      disabled={approvingId === owner.uid}
                      className="flex items-center gap-1.5 bg-rose-500 border-2 border-black text-white text-sm font-bold px-4 py-2 rounded-md shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Approved owners list below */}
            {approvedOwners.length > 0 && (
              <div className="mt-8">
                <h3 className="font-display font-bold text-slate-400 text-sm uppercase tracking-wider mb-3">Approved Owners ({approvedOwners.length})</h3>
                {approvedOwners.map((owner) => (
                  <div key={owner.uid} className="glass rounded-lg p-4 border-2 border-black mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-emerald-900/40 border-2 border-black flex items-center justify-center text-emerald-400 font-bold shadow-[2px_2px_0px_#000]">
                        {owner.displayName?.[0]?.toUpperCase() || 'O'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">{owner.displayName}</div>
                        <div className="text-slate-400 text-xs">{owner.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{venues.filter((v) => v.ownerId === owner.uid).length} venues</span>
                      <span className="bg-emerald-400/20 border-2 border-emerald-400/40 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md">Approved</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ownership Verification Requests */}
            <div className="mt-10 pt-8 border-t-2 border-black/30">
              <h2 className="font-display text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" /> Ownership Verification Requests ({ownershipRequests.length})
              </h2>
              {ownershipRequests.length === 0 ? (
                <div className="glass rounded-lg p-8 text-center border-2 border-black">
                  <CheckCircle className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No ownership verification requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ownershipRequests.map((req) => (
                    <div key={req.id} className="glass rounded-lg p-5 border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/30 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl bg-slate-900 w-11 h-11 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000] flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{req.infrastructureName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">{req.venueCode}</span>
                              <span className="text-slate-500 text-[10px]">•</span>
                              <span className="text-slate-400 text-xs">
                                Submitted: {req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : new Date((req.createdAt as any).seconds * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-bold px-2.5 py-1 rounded border-2 border-black shadow-[1.5px_1.5px_0px_#000]',
                            req.status === 'approved' && 'bg-emerald-400 text-black',
                            req.status === 'pending' && 'bg-amber-400 text-black',
                            req.status === 'rejected' && 'bg-rose-500 text-white'
                          )}>
                            {req.status === 'approved' && 'Ownership Verified'}
                            {req.status === 'pending' && 'Verification Pending'}
                            {req.status === 'rejected' && 'Verification Rejected'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Owner Information</div>
                          <div className="text-slate-200 font-bold">{req.ownerName}</div>
                          <div className="text-slate-300">{req.ownerEmail}</div>
                          <div className="text-slate-300">Phone: {req.phone}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Verification Details</div>
                          <div>
                            <span className="text-slate-400">Proof Link: </span>
                            <a href={req.proofUrl} target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] font-bold hover:underline break-all">
                              View Proof Document ↗
                            </a>
                          </div>
                          <div className="text-slate-300"><span className="text-slate-400">Notes: </span>{req.notes || 'None'}</div>
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-3 border-t border-black/20 pt-3 justify-end">
                          <button
                            onClick={() => handleApproveOwnership(req.id)}
                            disabled={approvingId === req.id}
                            className="flex items-center gap-1.5 bg-emerald-400 border-2 border-black text-black text-xs font-bold px-4 py-2 rounded-md shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all disabled:opacity-50"
                          >
                            {approvingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve Verification
                          </button>
                          <button
                            onClick={() => handleRejectOwnership(req.id)}
                            disabled={approvingId === req.id}
                            className="flex items-center gap-1.5 bg-rose-500 border-2 border-black text-white text-xs font-bold px-4 py-2 rounded-md shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: PLAYERS ──────────────────────────────────────────── */}
        {tab === 'players' && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" /> Players ({players.length})
            </h2>
            {players.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="font-display text-lg font-bold text-slate-200 mb-1">No Players Registered</h3>
                <p className="text-slate-400 text-sm">When users sign up as players, they will appear here.</p>
              </div>
            ) : (
              players.map((p) => (
                <div key={p.uid} className="glass rounded-lg p-4 border-2 border-black flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-cyan-900/30 border-2 border-black flex items-center justify-center text-cyan-400 font-bold shadow-[2px_2px_0px_#000]">
                      {p.displayName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{p.displayName}</div>
                      <div className="text-slate-400 text-xs">{p.email}</div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs">
                    {bookings.filter((b) => b.userId === p.uid).length} bookings
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: OWNERS ───────────────────────────────────────────── */}
        {tab === 'owners' && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" /> Venue Owners ({owners.length})
            </h2>
            {owners.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-4xl mb-3">🏢</div>
                <h3 className="font-display text-lg font-bold text-slate-200 mb-1">No Venue Owners Registered</h3>
                <p className="text-slate-400 text-sm">When users sign up as owners, they will appear here.</p>
              </div>
            ) : (
              owners.map((o) => {
                const ownerVenues = venues.filter((v) => v.ownerId === o.uid);
                const ownerBookings = bookings.filter((b) => ownerVenues.some((v) => v.id === b.venueId));
                return (
                  <div key={o.uid} className="glass rounded-lg p-4 border-2 border-black">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-amber-900/30 border-2 border-black flex items-center justify-center text-amber-400 font-bold shadow-[2px_2px_0px_#000]">
                          {o.displayName?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{o.displayName}</div>
                          <div className="text-slate-400 text-xs">{o.email}</div>
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs font-bold px-2.5 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_#000]',
                        o.approvalStatus === 'approved' ? 'bg-emerald-400 text-black' :
                        o.approvalStatus === 'pending' ? 'bg-amber-400 text-black' : 'bg-rose-400 text-black'
                      )}>
                        {o.approvalStatus || 'pending'}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-slate-400">
                      <span>{ownerVenues.length} venues</span>
                      <span>•</span>
                      <span>{ownerBookings.length} total bookings</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB: VENUES ───────────────────────────────────────────── */}
        {tab === 'venues' && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> All Venues ({venues.length})
            </h2>
            {venues.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-4xl mb-3">📍</div>
                <h3 className="font-display text-lg font-bold text-slate-200 mb-1">No Venues Registered</h3>
                <p className="text-slate-400 text-sm">When owners list venues on the platform, they will appear here.</p>
              </div>
            ) : (
              venues.map((v) => {
                const owner = users.find((u) => u.uid === v.ownerId);
                return (
                  <div key={v.id} className="glass rounded-lg p-4 border-2 border-black flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl bg-slate-900 w-11 h-11 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000]">
                        {getSportEmoji(v.sport)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">{v.name}</div>
                        <div className="text-slate-400 text-xs">
                          {v.area} • {owner ? owner.displayName : 'System'} • {formatCurrency(v.price)}/hr
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-md border-2 border-black',
                      v.available ? 'bg-emerald-400 text-black' : 'bg-rose-400 text-black'
                    )}>
                      {v.available ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB: BOOKINGS ─────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" /> All Bookings ({bookings.length})
            </h2>
            {bookings.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="font-display text-lg font-bold text-slate-200 mb-1">No Bookings Made</h3>
                <p className="text-slate-400 text-sm">When players make court or turf bookings, they will show up here.</p>
              </div>
            ) : (
              bookings.map((b) => {
                const bStatus = b.bookingStatus || b.status || 'pending';
                const pStatus = b.paymentStatus || 'paid';
                const ticketId = b.ticketId || b.ticketNumber;
                const amount = b.amount !== undefined ? b.amount : (b.price || 0);

                const statusText = bStatus.charAt(0).toUpperCase() + bStatus.slice(1);
                let statusClass = 'bg-cyan-400 text-black';
                if (bStatus === 'cancelled') statusClass = 'bg-rose-400 text-black';
                if (bStatus === 'completed') statusClass = 'bg-emerald-400 text-black';

                const paymentText = pStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                let paymentClass = 'text-amber-400 border-amber-400/40 bg-amber-400/10';
                if (pStatus === 'paid') paymentClass = 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10';
                if (pStatus === 'rejected') paymentClass = 'text-rose-400 border-rose-400/40 bg-rose-400/10';
                if (pStatus === 'verification_pending') paymentClass = 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10';

                return (
                  <div key={b.id} className="glass rounded-lg p-4 border-2 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-grow">
                      <div className="text-2xl bg-slate-900 w-11 h-11 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000] flex-shrink-0">
                        {getSportEmoji(b.sport)}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-200 text-sm">{b.venueName}</div>
                        <div className="text-slate-400 text-xs flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>{b.playerName || 'Player'}</span>
                          <span>•</span>
                          <span>{formatDate(b.date)}</span>
                          <span>•</span>
                          <span>{b.slot}</span>
                        </div>
                        {ticketId && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Ticket className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="font-mono text-xs text-cyan-400 font-bold">{ticketId}</span>
                          </div>
                        )}
                        {b.utrNumber && (
                          <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-2 mt-1">
                            <span>UTR: <strong className="text-slate-300 select-all">{b.utrNumber}</strong></span>
                            {b.screenshotUrl && (
                              <a 
                                href={b.screenshotUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-cyan-400 hover:underline"
                              >
                                View Proof Screenshot
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 ml-auto border-t md:border-t-0 border-black/20 pt-2.5 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-bold px-2 py-1 rounded border-2 border-black', statusClass)}>
                          {statusText}
                        </span>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded border border-current', paymentClass)}>
                          {paymentText}
                        </span>
                      </div>
                      <span className="font-bold text-slate-200">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB: INFRASTRUCTURE ────────────────────────────────────── */}
        {tab === 'infrastructure' && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-slate-200 flex items-center gap-2">
              🏛️ Lucknow Sports Infrastructure Intelligence ({allInfra.length})
            </h2>

            {/* 1. Intelligence Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Mapped</div>
                <div className="text-2xl font-extrabold text-slate-200 mt-1">{allInfra.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">Lucknow facilities list</div>
              </div>
              <div className="glass p-4 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Verified Mapped</div>
                <div className="text-2xl font-extrabold text-purple-400 mt-1">
                  {allInfra.filter(i => i.ownerLinked).length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Owner verified</div>
              </div>
              <div className="glass p-4 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Marketplace Venues</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {venues.filter(v => v.ownerId !== 'system' && v.approvalStatus === 'approved').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Bookable & active</div>
              </div>
              <div className="glass p-4 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Pending Claims</div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">
                  {ownershipRequests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Verification queue</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left & Mid: Control Panel & Live Logs Terminal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Discovery Control Panel */}
                <div className="glass p-5 rounded-lg border-2 border-black shadow-[3px_3px_0px_#000] relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold px-3 py-1 uppercase border-b border-l border-black/30">
                    Auto-Discovery Pipeline
                  </div>
                  <h3 className="font-display text-md font-bold text-slate-200 mb-2 flex items-center gap-2">
                    🤖 Ingestion & Auto-Discovery Agent
                  </h3>
                  <p className="text-slate-400 text-xs mb-4 max-w-xl">
                    Continuously sync and discover Lucknow municipal/private sports facilities. Discovered venues are added as read-only mapped entries. They never become bookable automatically.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleRunDiscovery}
                      disabled={discovering || scanState?.isRunning || cooldownLeft > 0}
                      className="flex items-center gap-2 bg-[#a855f7] hover:bg-[#9333ea] border-2 border-black text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all disabled:opacity-50"
                    >
                      {discovering || scanState?.isRunning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Crawling Sources...
                        </>
                      ) : cooldownLeft > 0 ? (
                        `Cooldown: ${cooldownLeft}s`
                      ) : (
                        'Run Discovery Scan'
                      )}
                    </button>
                    <button
                      onClick={handleSyncInfrastructure}
                      disabled={discovering || scanState?.isRunning || cooldownLeft > 0}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-300 text-xs font-bold px-4 py-2.5 rounded-md shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all disabled:opacity-50"
                    >
                      Sync Infrastructure
                    </button>
                    <button
                      onClick={handleRefreshAnalytics}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-300 text-xs font-bold px-4 py-2.5 rounded-md shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all"
                    >
                      Refresh Analytics
                    </button>
                  </div>

                  {scanState && (
                    <div className="mt-4 p-3 bg-black/30 rounded border border-black/40 text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scan Status:</span>
                        <span className={scanState.isRunning ? 'text-purple-400 animate-pulse font-bold' : 'text-slate-400'}>
                          {scanState.isRunning ? 'RUNNING (DB LOCKED)' : 'IDLE'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Execution:</span>
                        <span className="text-slate-300">
                          {scanState.lastScanAt ? new Date(scanState.lastScanAt).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      {cooldownLeft > 0 && (
                        <div className="flex justify-between text-amber-400 font-bold">
                          <span>Next Ingestion Slot:</span>
                          <span>{cooldownLeft}s cooldown remaining</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                  {/* Telemetry Counter Dashboard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">OSM Raw</div>
                      <div className="text-xl font-black text-cyan-400 mt-0.5">{scanResult ? scanResult.osmFetched : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Normalized</div>
                      <div className="text-xl font-black text-purple-400 mt-0.5">{scanResult ? scanResult.normalized : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Rejected</div>
                      <div className="text-xl font-black text-rose-500 mt-0.5">{scanResult ? scanResult.rejected : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Added</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">{scanResult ? scanResult.added : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Updated</div>
                      <div className="text-xl font-black text-amber-400 mt-0.5">{scanResult ? scanResult.updated : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Skipped</div>
                      <div className="text-xl font-black text-slate-400 mt-0.5">{scanResult ? scanResult.skipped : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Enriched</div>
                      <div className="text-xl font-black text-cyan-400 mt-0.5">{scanResult ? scanResult.enriched : 0}</div>
                    </div>
                    <div className="glass bg-[#121526] p-3 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] text-center">
                      <div className="text-[10px] text-slate-400 font-black uppercase">Errors</div>
                      <div className="text-xl font-black text-rose-500 mt-0.5">{scanResult ? scanResult.errors : 0}</div>
                    </div>
                  </div>

                  {/* Console Log Terminal */}
                  <div className="glass rounded-lg border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
                  <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-black">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2">discovery-pipeline.log</span>
                    </div>
                    {discovering && (
                      <span className="text-[10px] text-purple-400 animate-pulse font-mono font-bold uppercase">
                        Active Scan
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-[#050209] h-60 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-1 scrollbar-thin">
                    {discoveryLogs.length === 0 ? (
                      <span className="text-slate-600">Terminal idle. Click &quot;Run Discovery Scan&quot; to start scanning Lucknow sports infrastructure database sources...</span>
                    ) : (
                      discoveryLogs.map((logLine, idx) => {
                        let colorClass = 'text-slate-300';
                        if (logLine.includes('SUCCESS')) colorClass = 'text-emerald-400';
                        if (logLine.includes('SKIP')) colorClass = 'text-amber-400/90';
                        if (logLine.includes('ERROR')) colorClass = 'text-rose-400';
                        if (logLine.includes('Summary')) colorClass = 'text-purple-400 font-bold';
                        return (
                          <div key={idx} className={colorClass}>
                            {logLine}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Area Heat Rank & Distribution Intelligence */}
              <div className="glass p-5 rounded-lg border-2 border-black shadow-[3px_3px_0px_#000] space-y-6">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-200 mb-3">
                    📍 Area Density & Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      allInfra.reduce((acc, curr) => {
                        acc[curr.area] = (acc[curr.area] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([area, count]) => {
                        const pct = Math.round((count / (allInfra.length || 1)) * 100) || 0;
                        return (
                          <div key={area} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                              <span>{area}</span>
                              <span className="text-purple-400">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 border border-black/50 overflow-hidden">
                              <div
                                className={cn("bg-purple-500 h-full rounded-full transition-all duration-500", getPercentageClass(pct))}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="border-t border-black/40 pt-4">
                  <h3 className="font-display text-sm font-bold text-slate-200 mb-3">
                    🏸 Sport Distribution (Live Metrics)
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      allInfra.reduce((acc, curr) => {
                        const s = curr.sport ? curr.sport.toLowerCase() : 'other';
                        acc[s] = (acc[s] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([sport, count]) => {
                      const pct = Math.round((count / (allInfra.length || 1)) * 100) || 0;
                      let color = 'bg-cyan-500';
                      if (sport === 'football') color = 'bg-emerald-500';
                      if (sport === 'swimming') color = 'bg-blue-500';
                      if (sport === 'kabaddi') color = 'bg-amber-500';
                      return (
                        <div key={sport} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300 font-semibold uppercase tracking-wide">
                            <span>{sport}</span>
                            <span>{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-2 border border-black/50 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", color, getPercentageClass(pct))}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Mapped Facilities Table */}
            <div className="glass p-5 rounded-lg border-2 border-black shadow-[3px_3px_0px_#000]">
              <h3 className="font-display text-sm font-bold text-slate-200 mb-4">
                🗺️ Mapped Sports Facilities Listings
              </h3>
              {allInfra.length === 0 ? (
                <div className="glass rounded-lg p-12 text-center border-2 border-black/50 bg-slate-900">
                  <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="font-display text-lg font-bold text-slate-200 mb-2">No Mapped Infrastructure</h3>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">No Lucknow sports facilities have been mapped yet. Run an ingestion scan or seed the database to populate the intelligence registry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Facility Name</th>
                        <th>Sport</th>
                        <th>Area</th>
                        <th>Type</th>
                        <th>Venue Code</th>
                        <th>Source</th>
                        <th>Claim Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20">
                      {allInfra.map((item) => {
                        let statusBadge = (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700/50">
                            Unclaimed
                          </span>
                        );
                        if (item.ownerLinked) {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/40">
                              Verified Owner
                            </span>
                          );
                        } else if (item.ownershipStatus === 'pending') {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800/40 animate-pulse">
                              Pending Claim
                            </span>
                          );
                        } else if (item.ownershipStatus === 'rejected') {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 text-[10px] font-bold border border-rose-800/40">
                              Rejected Request
                            </span>
                          );
                        }

                        let sourceBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/50">
                            Seed
                          </span>
                        );
                        if (item.source === 'osm_discovered') {
                          sourceBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                              OSM
                            </span>
                          );
                        } else if (item.source === 'osm_enriched' || item.source === 'enriched') {
                          sourceBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800/40">
                              Enriched
                            </span>
                          );
                        }

                        return (
                          <tr key={item.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 font-semibold text-slate-200">{item.name}</td>
                            <td className="capitalize font-semibold text-slate-300">{item.sport}</td>
                            <td className="text-slate-300">{item.area}</td>
                            <td className="capitalize text-slate-400">{item.infrastructureType}</td>
                            <td className="font-mono font-bold text-purple-400">{item.venueCode || 'N/A'}</td>
                            <td>{sourceBadge}</td>
                            <td>{statusBadge}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
