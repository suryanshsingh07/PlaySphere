// Sports Configuration Constants

export const SUPPORTED_SPORTS = [
  'badminton',
  'cricket',
  'football',
  'basketball',
  'volleyball',
  'tennis',
  'squash',
  'table_tennis',
  'swimming',
  'gym',
] as const;

export const SPORT_COLORS: Record<string, string> = {
  badminton: '#EC4899',
  cricket: '#F59E0B',
  football: '#3B82F6',
  basketball: '#F97316',
  volleyball: '#8B5CF6',
  tennis: '#10B981',
  squash: '#06B6D4',
  table_tennis: '#EF4444',
  swimming: '#0EA5E9',
  gym: '#6366F1',
};

export const SPORT_ICONS: Record<string, string> = {
  badminton: '🏸',
  cricket: '🏏',
  football: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  tennis: '🎾',
  squash: '🎯',
  table_tennis: '🏓',
  swimming: '🏊',
  gym: '💪',
};

export const LUCKNOW_NEIGHBORHOODS = [
  'Gomti Nagar',
  'Hazratganj',
  'Indira Nagar',
  'Aliganj',
  'Chinhat',
  'Jankipuram',
  'Mahanagar',
  'Rajajipuram',
  'Eldeco',
  'Vikas Nagar',
  'Sahara',
  'Kapoorthala',
  'Aashiana',
  'Aminabad',
  'Cantt',
] as const;

export const LUCKNOW_CENTER = {
  latitude: 26.8467,
  longitude: 80.9462,
};

export const BOOKING_TIME_SLOTS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
];
