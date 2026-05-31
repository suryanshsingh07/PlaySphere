/**
 * Peak pricing logic for PlaySphere AI
 * Returns price multipliers and slot labels based on time of day
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface PricingInfo {
  timeOfDay: TimeOfDay;
  label: string;
  multiplier: number;
  isWeekend: boolean;
  weekendSurcharge: number;
  finalPrice: number;
  tip?: string;
}

/**
 * Determines the time-of-day slot from a time string (HH:MM format)
 */
export function getTimeOfDay(timeStr: string): TimeOfDay {
  const [hours] = timeStr.split(':').map(Number);
  if (hours >= 5 && hours < 11) return 'morning';
  if (hours >= 11 && hours < 17) return 'afternoon';
  return 'evening';
}

/**
 * Checks if a date string (YYYY-MM-DD) is a weekend
 */
export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculates the peak price for a venue slot
 */
export function calculatePrice(
  basePrice: number,
  timeSlot: string,
  dateStr: string
): PricingInfo {
  const timeOfDay = getTimeOfDay(timeSlot);
  const weekend = isWeekend(dateStr);

  const multipliers: Record<TimeOfDay, number> = {
    morning: 1.0,
    afternoon: 0.85,
    evening: 1.3,
  };

  const labels: Record<TimeOfDay, string> = {
    morning: '🌅 Morning (5–8 AM)',
    afternoon: '☀️ Afternoon (11–4 PM)',
    evening: '🌆 Evening Peak (5–10 PM)',
  };

  const multiplier = multipliers[timeOfDay];
  const weekendSurcharge = weekend ? Math.min(basePrice * 0.2, 300) : 0;
  const finalPrice = Math.round(basePrice * multiplier + weekendSurcharge);

  let tip: string | undefined;
  if (timeOfDay === 'evening') {
    const afternoonPrice = Math.round(basePrice * 0.85);
    tip = `Save ₹${finalPrice - afternoonPrice} by booking afternoon instead!`;
  }
  if (weekend && weekendSurcharge > 0) {
    tip = `Weekend surcharge +₹${Math.round(weekendSurcharge)} applied`;
  }

  return {
    timeOfDay,
    label: labels[timeOfDay],
    multiplier,
    isWeekend: weekend,
    weekendSurcharge: Math.round(weekendSurcharge),
    finalPrice,
    tip,
  };
}

/**
 * Generate time slots for a venue on a given date
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  basePrice: number,
  dateStr: string,
  slotDurationMinutes = 60
) {
  const slots = [];
  
  function parseTimeToMinutes(timeStr: string): number {
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.endsWith('PM');
    const isAM = clean.endsWith('AM');
    const timePart = clean.replace(/[AP]M/, '').trim();
    const [hStr, mStr] = timePart.split(':');
    let hours = parseInt(hStr, 10) || 0;
    const minutes = parseInt(mStr, 10) || 0;
    
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  }

  let currentMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);

  while (currentMinutes + slotDurationMinutes <= closeMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endMinutes = currentMinutes + slotDurationMinutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const startStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    const timeLabel = `${startStr}–${endStr}`;

    const pricing = calculatePrice(basePrice, startStr, dateStr);

    // Available by default (will be blocked dynamically by database bookings)
    const available = true;

    slots.push({
      time: startStr,
      endTime: endStr,
      label: timeLabel,
      priceMultiplier: pricing.multiplier,
      finalPrice: pricing.finalPrice,
      timeOfDay: pricing.timeOfDay,
      available,
    });

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

/**
 * Checks if a slot on a given date is in the past
 */
export function isSlotInPast(dateStr: string, slotStr: string, referenceTime?: Date): boolean {
  try {
    const now = referenceTime || new Date();
    
    // YYYY-MM-DD in local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (dateStr < todayStr) {
      return true;
    }

    if (dateStr === todayStr) {
      const parts = slotStr.split(/[–-]/);
      if (parts.length >= 2) {
        const endTimeStr = parts[1].trim(); // e.g. "12:00"
        const [endH, endM] = endTimeStr.split(':').map(Number);
        
        const slotEndTime = new Date(now);
        slotEndTime.setHours(endH, endM, 0, 0);
        
        return slotEndTime.getTime() <= now.getTime();
      }
    }
  } catch (e) {
    console.error('Error checking isSlotInPast:', e);
  }
  return false;
}

/**
 * Derives the real-time booking lifecycle status
 */
export function getBookingLifecycle(
  booking: { date: string; slot: string; bookingStatus?: string; status?: string; paymentStatus?: string },
  referenceTime?: Date
): 'upcoming' | 'completed' | 'expired' | 'cancelled' {
  const bStatus = (booking.bookingStatus || booking.status || '').toLowerCase();
  
  if (bStatus === 'cancelled') {
    return 'cancelled';
  }

  // Check if slot has passed
  const passed = isSlotInPast(booking.date, booking.slot, referenceTime);

  if (!passed) {
    return 'upcoming';
  } else {
    // If it passed, check if it was paid/confirmed/verified
    const isSuccess = 
      bStatus === 'confirmed' || 
      booking.paymentStatus === 'paid' || 
      booking.paymentStatus === 'verification_pending';
    
    return isSuccess ? 'completed' : 'expired';
  }
}
