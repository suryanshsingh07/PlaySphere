import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import {
  Users, Building2, CalendarDays, ShieldAlert, RefreshCw,
  Loader, Search, Check, X, Lock, ShieldCheck, Trash2,
  Ban, TrendingUp, DollarSign, AlertTriangle, ChevronDown,
  Eye, EyeOff, Edit2
} from 'lucide-react';

// ── Confirmation Modal ────────────────────────────────────
function ConfirmModal({ config, onConfirm, onCancel }) {
  if (!config) return null;
  return (
    <div className="adm-overlay" onClick={onCancel}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-icon" style={{ background: config.danger ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: config.danger ? '#ef4444' : '#f59e0b' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="adm-modal-title">{config.title}</h3>
        <p className="adm-modal-body">{config.message}</p>
        <div className="adm-modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${config.danger ? 'btn-danger' : 'btn-emerald'}`}
            onClick={onConfirm}
            style={{ background: config.danger ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', border: `1px solid ${config.danger ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}` }}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ active, label }) {
  return (
    <span className={`badge ${active ? 'badge-emerald' : 'badge-red'}`}>
      {label || (active ? 'Active' : 'Inactive')}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="adm-kpi glass" style={{ borderColor: `${color}22` }}>
      <div className="adm-kpi-icon" style={{ background: `${color}18`, color }}><Icon size={20} /></div>
      <div>
        <div className="adm-kpi-label">{label}</div>
        <div className="adm-kpi-value">{value}</div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────
const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'venues', label: 'Venues', icon: Building2 },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
];

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminDashboard() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { title, message, danger, confirmLabel, onConfirm }

  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);

  const api = useCallback(async (method, url, data) => {
    const res = await axios({ method, url, data, headers });
    return res.data;
  }, [token]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, v, b] = await Promise.all([
        api('get', '/api/auth/users'),
        api('get', '/api/auth/admin/venues'),
        api('get', '/api/auth/admin/bookings'),
      ]);
      setUsers(u.data || []);
      setVenues(v.data || []);
      setBookings(b.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data. Make sure you are logged in as Admin.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const confirm = (config) => new Promise(resolve => {
    setModal({ ...config, onConfirm: () => { setModal(null); resolve(true); } });
  });

  // ── User Actions ─────────────────────────────────────────
  const toggleUserActive = async (u) => {
    const ok = await confirm({
      title: u.isActive ? `Deactivate @${u.username}?` : `Activate @${u.username}?`,
      message: u.isActive
        ? 'This user will be blocked from logging in until reactivated.'
        : 'This user will regain full access to their account.',
      danger: u.isActive,
      confirmLabel: u.isActive ? 'Deactivate' : 'Activate',
    });
    if (!ok) return;
    try {
      await api('put', `/api/auth/users/${u._id}/toggle-active`);
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const approveOwner = async (u, approve) => {
    const ok = await confirm({
      title: approve ? `Approve @${u.username}?` : `Reject @${u.username}?`,
      message: approve ? 'This venue owner will be able to log in and manage venues.' : 'This account will be rejected and deleted.',
      danger: !approve,
      confirmLabel: approve ? 'Approve' : 'Reject & Delete',
    });
    if (!ok) return;
    try {
      if (approve) {
        await api('put', `/api/auth/users/${u._id}/approve`, { isApproved: true });
        setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isApproved: true } : x));
      } else {
        await api('delete', `/api/auth/users/${u._id}`);
        setUsers(prev => prev.filter(x => x._id !== u._id));
      }
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (u) => {
    const ok = await confirm({
      title: `Delete @${u.username}?`,
      message: 'All venues, bookings, and reviews by this user will be permanently deleted. This cannot be undone.',
      danger: true,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    try {
      await api('delete', `/api/auth/users/${u._id}`);
      setUsers(prev => prev.filter(x => x._id !== u._id));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  // ── Venue Actions ─────────────────────────────────────────
  const toggleVenueActive = async (v) => {
    const ok = await confirm({
      title: v.isActive ? `Deactivate "${v.name}"?` : `Activate "${v.name}"?`,
      message: v.isActive ? 'This venue will be hidden from all searches and maps.' : 'This venue will become visible and bookable again.',
      danger: v.isActive,
      confirmLabel: v.isActive ? 'Deactivate' : 'Activate',
    });
    if (!ok) return;
    try {
      await api('put', `/api/auth/admin/venues/${v._id}/toggle-active`);
      setVenues(prev => prev.map(x => x._id === v._id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const deleteVenue = async (v) => {
    const ok = await confirm({
      title: `Delete "${v.name}"?`,
      message: 'All bookings and reviews for this venue will be permanently deleted.',
      danger: true,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    try {
      await api('delete', `/api/auth/admin/venues/${v._id}`);
      setVenues(prev => prev.filter(x => x._id !== v._id));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  // ── Booking Actions ───────────────────────────────────────
  const updateBookingStatus = async (b, status) => {
    const ok = await confirm({
      title: `Set booking to "${status}"?`,
      message: `Booking for ${b.sport} at ${b.venue?.name || 'venue'} will be marked as ${status}.`,
      danger: status === 'cancelled',
      confirmLabel: 'Confirm',
    });
    if (!ok) return;
    try {
      const res = await api('put', `/api/auth/admin/bookings/${b._id}/status`, { status });
      setBookings(prev => prev.map(x => x._id === b._id ? { ...x, status: res.data.status, paymentStatus: res.data.paymentStatus } : x));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const deleteBooking = async (b) => {
    const ok = await confirm({
      title: 'Delete this booking?',
      message: 'This booking record will be permanently removed.',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await api('delete', `/api/auth/admin/bookings/${b._id}`);
      setBookings(prev => prev.filter(x => x._id !== b._id));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  // ── Filtered data ─────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
  );
  const filteredVenues = venues.filter(v =>
    v.name?.toLowerCase().includes(q) || v.area?.toLowerCase().includes(q) || v.owner?.username?.toLowerCase().includes(q)
  );
  const filteredBookings = bookings.filter(b =>
    b.sport?.toLowerCase().includes(q) || b.user?.username?.toLowerCase().includes(q) || b.venue?.name?.toLowerCase().includes(q) || b.status?.toLowerCase().includes(q)
  );

  const pendingApprovals = users.filter(u => u.role === 'venue_owner' && !u.isApproved).length;

  // ── KPI values ────────────────────────────────────────────
  const totalRevenue = bookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((s, b) => s + (b.totalPrice || 0), 0);

  if (loading) return (
    <div className="container flex-center" style={{ minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="uiverse-loader" style={{ marginBottom: '20px' }}>
          <svg viewBox="0 0 120 120" width="50" height="50">
            <circle className="dash" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-primary)" strokeWidth="10" strokeLinecap="round" />
            <circle className="spin" cx="60" cy="60" r="57" fill="none" stroke="var(--accent-secondary)" strokeWidth="10" strokeLinecap="round" />
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading admin console...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div className="empty-state glass" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <ShieldAlert size={48} color="var(--accent-danger)" />
        <h3 style={{ color: '#fff', marginTop: '12px' }}>Access Denied</h3>
        <p style={{ maxWidth: '400px', marginTop: '8px' }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container adm-root">
      <ConfirmModal config={modal} onConfirm={modal?.onConfirm} onCancel={() => setModal(null)} />

      {/* Header */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Super Admin <span className="text-gradient">Console</span></h1>
          <p className="adm-subtitle">Full platform control — users, venues, bookings</p>
        </div>
        <button onClick={fetchAll} className="btn btn-ghost" style={{ gap: '8px', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="adm-kpis">
        <KpiCard icon={Users} label="Total Users" value={users.length} color="#06b6d4" />
        <KpiCard icon={Building2} label="Total Venues" value={venues.length} color="#8b5cf6" />
        <KpiCard icon={CalendarDays} label="Total Bookings" value={bookings.length} color="#10b981" />
        <KpiCard icon={DollarSign} label="Platform Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="#f59e0b" />
        <KpiCard icon={Ban} label="Deactivated Users" value={users.filter(u => !u.isActive).length} color="#ef4444" />
        <KpiCard icon={TrendingUp} label="Pending Approvals" value={pendingApprovals} color="#ec4899" />
      </div>

      {/* Tabs + Search */}
      <div className="adm-toolbar">
        <div className="adm-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`adm-tab ${tab === t.id ? 'adm-tab-active' : ''}`}
              onClick={() => { setTab(t.id); setSearch(''); }}
            >
              <t.icon size={15} />
              {t.label}
              {t.id === 'users' && pendingApprovals > 0 && (
                <span className="adm-badge-dot">{pendingApprovals}</span>
              )}
            </button>
          ))}
        </div>
        <div className="adm-search-wrap">
          <Search size={14} className="adm-search-icon" />
          <input
            className="adm-search"
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="adm-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
      </div>

      {/* ── USERS TAB ─────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="adm-table-wrap glass">
          <table className="adm-table">
            <thead>
              <tr>
                {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>
                  <td><span className="adm-username">@{u.username}</span></td>
                  <td className="adm-muted">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-violet' : u.role === 'venue_owner' ? 'badge-amber' : 'badge-cyan'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <StatusBadge active={u.isActive} />
                      {u.role === 'venue_owner' && (
                        <StatusBadge active={u.isApproved} label={u.isApproved ? 'Approved' : 'Pending'} />
                      )}
                    </div>
                  </td>
                  <td>
                    {u.role !== 'admin' ? (
                      <div className="adm-actions">
                        <button
                          className={`btn btn-xs ${u.isActive ? 'btn-danger' : 'btn-emerald'}`}
                          onClick={() => toggleUserActive(u)}
                        >
                          {u.isActive ? <><Lock size={11} /> Deactivate</> : <><ShieldCheck size={11} /> Activate</>}
                        </button>
                        {u.role === 'venue_owner' && !u.isApproved && (
                          <>
                            <button className="btn btn-xs btn-emerald" onClick={() => approveOwner(u, true)}>
                              <Check size={11} /> Approve
                            </button>
                            <button className="btn btn-xs btn-danger" onClick={() => approveOwner(u, false)}>
                              <X size={11} /> Reject
                            </button>
                          </>
                        )}
                        <button className="btn btn-xs btn-danger" onClick={() => deleteUser(u)}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    ) : (
                      <span className="adm-muted" style={{ fontSize: '0.75rem' }}>Protected</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <EmptyRow cols={5} />}
            </tbody>
          </table>
        </div>
      )}

      {/* ── VENUES TAB ────────────────────────────────────── */}
      {tab === 'venues' && (
        <div className="adm-table-wrap glass">
          <table className="adm-table">
            <thead>
              <tr>
                {['Venue', 'Area', 'Owner', 'Sports', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVenues.map(v => (
                <tr key={v._id}>
                  <td><span className="adm-username">{v.name}</span></td>
                  <td className="adm-muted">{v.area}</td>
                  <td className="adm-muted">@{v.owner?.username || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {v.sports?.slice(0, 3).map(s => (
                        <span key={s.name} className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{s.name}</span>
                      ))}
                      {v.sports?.length > 3 && <span className="adm-muted" style={{ fontSize: '0.75rem' }}>+{v.sports.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>★ {v.rating?.toFixed(1)}</span>
                  </td>
                  <td><StatusBadge active={v.isActive} /></td>
                  <td>
                    <div className="adm-actions">
                      <button
                        className={`btn btn-xs ${v.isActive ? 'btn-danger' : 'btn-emerald'}`}
                        onClick={() => toggleVenueActive(v)}
                      >
                        {v.isActive ? <><EyeOff size={11} /> Deactivate</> : <><Eye size={11} /> Activate</>}
                      </button>
                      <button className="btn btn-xs btn-danger" onClick={() => deleteVenue(v)}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVenues.length === 0 && <EmptyRow cols={7} />}
            </tbody>
          </table>
        </div>
      )}

      {/* ── BOOKINGS TAB ──────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="adm-table-wrap glass">
          <table className="adm-table">
            <thead>
              <tr>
                {['User', 'Venue', 'Sport', 'Date & Time', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b._id}>
                  <td className="adm-muted">@{b.user?.username || '—'}</td>
                  <td><span className="adm-username">{b.venue?.name || '—'}</span></td>
                  <td>
                    <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>{b.sport}</span>
                  </td>
                  <td className="adm-muted" style={{ fontSize: '0.8rem' }}>
                    {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    <br />{b.startTime} – {b.endTime}
                  </td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{b.totalPrice}</td>
                  <td>
                    <StatusDropdown
                      current={b.status}
                      options={BOOKING_STATUSES}
                      onChange={status => updateBookingStatus(b, status)}
                    />
                  </td>
                  <td>
                    <button className="btn btn-xs btn-danger" onClick={() => deleteBooking(b)}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && <EmptyRow cols={7} />}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No records found.
      </td>
    </tr>
  );
}

function StatusDropdown({ current, options, onChange }) {
  const colorMap = { pending: '#f59e0b', confirmed: '#10b981', completed: '#06b6d4', cancelled: '#ef4444' };
  const color = colorMap[current] || '#94a3b8';
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={current}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          background: `${color}18`,
          border: `1px solid ${color}44`,
          color,
          borderRadius: '6px',
          padding: '4px 24px 4px 8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
          textTransform: 'capitalize',
        }}
      >
        {options.map(o => <option key={o} value={o} style={{ background: '#0f172a', color: '#fff' }}>{o}</option>)}
      </select>
      <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color, pointerEvents: 'none' }} />
    </div>
  );
}
