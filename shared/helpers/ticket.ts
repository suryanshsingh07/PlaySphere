import { Sport } from '../types';

export function generateTicketId(sport: Sport): string {
  const sportAbbrMap: Record<Sport, string> = {
    badminton: 'BAD',
    football: 'FOT',
    swimming: 'SWM',
    kabaddi: 'KAB'
  };
  const abbr = sportAbbrMap[sport] || 'SPT';
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `PS-${abbr}-2026-${randomNum}`;
}
