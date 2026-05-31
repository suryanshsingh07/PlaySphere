'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isOwner, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login?redirect=/owner');
      } else if (!isOwner && !isAdmin) {
        // Not an owner (e.g., a player) — redirect to player dashboard
        router.push('/dashboard');
      }
    }
  }, [user, loading, isOwner, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user || (!isOwner && !isAdmin)) return null;

  return <>{children}</>;
}
