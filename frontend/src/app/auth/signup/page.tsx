'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight, Loader2, Building2, Shield } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/backend/firebase/auth';
import { useAuth } from '@/contexts/AuthProvider';
import { cn } from '@/shared/helpers/utils';

type Role = 'player' | 'owner';

interface RoleCard {
  id: Role;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge: string;
  badgeColor: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: 'player',
    label: 'Player',
    icon: <User className="w-7 h-7" />,
    description: 'Discover venues, book sessions, and get AI-powered sport guidance.',
    badge: 'Instant Access',
    badgeColor: 'bg-cyan-400 text-black',
  },
  {
    id: 'owner',
    label: 'Venue Owner',
    icon: <Building2 className="w-7 h-7" />,
    description: 'List your sports facility, manage bookings, and reach players across Lucknow.',
    badge: 'Pending Approval',
    badgeColor: 'bg-amber-400 text-black',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('player');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading, isOwner, isAdmin } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) router.push('/admin');
      else if (isOwner) router.push('/owner');
      else router.push('/dashboard');
    }
  }, [user, authLoading, router, isAdmin, isOwner]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, name, selectedRole);
      if (selectedRole === 'owner') router.push('/owner');
      else router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      if (msg === 'auth/email-already-in-use') setError('Email already registered. Please sign in.');
      else setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Redirect will be handled by the useEffect watching user / role states
    } catch {
      setError('Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 pt-16 pb-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-2">
            <div className="w-10 h-10 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="gradient-text [text-shadow:1.5px_1.5px_0px_#000]">PlaySphere AI</span>
          </Link>
          <h1 className="font-display text-2xl font-black text-slate-200 mt-2 uppercase tracking-wide">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Join the AI-powered sports marketplace for Lucknow</p>
        </div>

        <div className="bg-slate-900 border-3 border-black rounded-lg p-8 shadow-[8px_8px_0px_0px_#000]">

          {/* ── Role Selector ──────────────────────────────── */}
          <div className="mb-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> I am joining as
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => { setSelectedRole(card.id); setError(''); }}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-4 rounded-md border-2 text-center transition-all cursor-pointer',
                    selectedRole === card.id
                      ? 'bg-slate-800 border-cyan-400 shadow-[4px_4px_0px_0px_#22d3ee] -translate-x-0.5 -translate-y-0.5'
                      : 'bg-slate-950 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:border-slate-500 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-md flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000]',
                    selectedRole === card.id ? 'bg-cyan-400 text-black' : 'bg-slate-800 text-slate-400'
                  )}>
                    {card.icon}
                  </div>
                  <span className="font-display font-black text-slate-200 text-sm">{card.label}</span>
                  <span className="text-slate-400 text-xs leading-tight">{card.description}</span>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]', card.badgeColor)}>
                    {card.badge}
                  </span>
                  {selectedRole === card.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-cyan-400 border-2 border-black rounded-full flex items-center justify-center shadow-[1px_1px_0px_#000]">
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedRole === 'owner' && (
              <div className="mt-3 bg-amber-400/10 border-2 border-amber-400/40 rounded-md px-3 py-2.5 text-amber-300 text-xs font-medium shadow-[2px_2px_0px_rgba(0,0,0,0.4)]">
                ⚡ Venue Owner accounts require admin approval before you can list venues. You&apos;ll see your status on the Owner Dashboard.
              </div>
            )}
          </div>

          {/* ── Divider ───────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-0.5 bg-black" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">your details</span>
            <div className="flex-1 h-0.5 bg-black" />
          </div>

          {/* ── Google Sign In (Player only note) ─────────── */}
          {selectedRole === 'player' && (
            <>
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-display font-black border-3 border-black rounded-md py-3 mb-5 shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-0.5 bg-black" />
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">or register with email</span>
                <div className="flex-1 h-0.5 bg-black" />
              </div>
            </>
          )}

          {/* ── Email Form ────────────────────────────────── */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full pl-11 placeholder-slate-500"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-11 placeholder-slate-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                required
                className="w-full pl-11 pr-11 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border-2 border-black rounded-md px-4 py-3 text-red-400 text-sm font-bold shadow-[2px_2px_0px_#000]">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="signup-submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {selectedRole === 'owner' ? 'Register as Venue Owner' : 'Create Player Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6 font-medium">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors underline decoration-black underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
