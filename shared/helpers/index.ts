// Helper Functions

/**
 * Calculate Haversine distance between two coordinates (in km)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate unique ticket code: PS-XXXX-XXXX
 */
export function generateTicketCode(): string {
  const random = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PS-${random()}-${random()}`;
}

/**
 * Parse natural language time input
 */
export function parseTimeInput(input: string): string | null {
  const lowerInput = input.toLowerCase();

  // Morning: 06:00 - 11:00
  if (['morning', 'early', 'dawn', '6am', '7am', '8am', '9am', '10am'].some(t => lowerInput.includes(t))) {
    return '07:00';
  }

  // Afternoon: 12:00 - 17:00
  if (['afternoon', 'mid', 'lunch', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'].some(t => lowerInput.includes(t))) {
    return '14:00';
  }

  // Evening/Night: 18:00 - 22:00
  if (['evening', 'night', 'late', '6pm', '7pm', '8pm', '9pm', '10pm'].some(t => lowerInput.includes(t))) {
    return '18:00';
  }

  // Try parsing specific hour format
  const hourMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (hourMatch) {
    let hour = parseInt(hourMatch[1]);
    const isPM = hourMatch[3]?.toLowerCase() === 'pm';

    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:00`;
  }

  return null;
}

/**
 * Parse natural language date input
 */
export function parseDateInput(input: string): Date | null {
  const lowerInput = input.toLowerCase();
  const today = new Date();

  if (lowerInput.includes('today')) {
    return today;
  }

  if (lowerInput.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  if (lowerInput.includes('day after tomorrow') || lowerInput.includes('day after')) {
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    return afterTomorrow;
  }

  // Try parsing specific date format
  const dateMatch = input.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  return null;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}
