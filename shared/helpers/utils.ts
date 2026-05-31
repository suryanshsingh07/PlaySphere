import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    badminton: '🏸',
    football: '⚽',
    swimming: '🏊',
    kabaddi: '🤼',
  };
  return emojis[sport] || '🏆';
}

export function getSportColor(sport: string): string {
  const colors: Record<string, string> = {
    badminton: 'bg-yellow-400 text-black border-2 border-black font-bold',
    football: 'bg-emerald-400 text-black border-2 border-black font-bold',
    swimming: 'bg-cyan-400 text-black border-2 border-black font-bold',
    kabaddi: 'bg-rose-500 text-black border-2 border-black font-bold',
  };
  return colors[sport] || 'bg-indigo-400 text-black border-2 border-black font-bold';
}

export function getSkillBadgeColor(skill: string): string {
  const colors: Record<string, string> = {
    beginner: 'bg-emerald-500 text-black border-2 border-black font-bold',
    intermediate: 'bg-yellow-400 text-black border-2 border-black font-bold',
    advanced: 'bg-rose-500 text-black border-2 border-black font-bold',
    all: 'bg-cyan-400 text-black border-2 border-black font-bold',
  };
  return colors[skill] || 'bg-slate-300 text-black border-2 border-black font-bold';
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMinBookingDate(): string {
  return getTodayDate();
}

export function getMaxBookingDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a unique ticket number for a booking.
 * Format: PS-[SPORT3]-2026-[RANDOM4]
 * Examples: PS-BAD-2026-1042, PS-FOT-2026-5931
 */
export function generateTicketNumber(sport: string): string {
  const sportCodes: Record<string, string> = {
    badminton: 'BAD',
    football: 'FOT',
    swimming: 'SWM',
    kabaddi: 'KBD',
  };
  const code = sportCodes[sport] || 'SPT';
  const random = Math.floor(1000 + Math.random() * 9000); // always 4 digits
  return `PS-${code}-2026-${random}`;
}

/**
 * Recursively serializes Firestore data by converting complex types (such as Timestamps)
 * into plain serializable JSON values.
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item));
  }

  // Handle Firestore Timestamp or custom objects with toDate()
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle Date instances
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle nested objects
  if (typeof data === 'object') {
    // If it has a specific constructor type we want to serialize (like DocumentReference)
    if (data.constructor && data.constructor.name === 'DocumentReference') {
      return { id: data.id, path: data.path };
    }

    const serialized: any = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializeFirestoreData(data[key]);
    }
    return serialized;
  }

  return data;
}


