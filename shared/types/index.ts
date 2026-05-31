import { Timestamp } from 'firebase/firestore';

export type Sport = 'badminton' | 'football' | 'swimming' | 'kabaddi';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'payment_pending' | 'verification_pending' | 'paid' | 'rejected' | 'refund_pending';
export type UserRole = 'player' | 'owner' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type VenueSource = 'seed' | 'owner';
export type PriceSlot = 'morning' | 'afternoon' | 'evening';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Landmark {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  sportsRelevance: string[];
}

export interface PeakPricing {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface Timings {
  open: string;
  close: string;
}

export interface Venue {
  id: string;
  name: string;
  sport: Sport;
  area: string;
  address: string;
  coordinates: Coordinates;
  price: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  skillLevel: SkillLevel;
  timings: Timings;
  description: string;
  imageUrl: string;
  category: string;
  peakPricing: PeakPricing;
  available: boolean;
  // v3.0 owner/marketplace fields
  ownerId: string;           // 'system' for seed venues, uid for owner-added
  source: VenueSource;       // 'seed' | 'owner'
  approvalStatus: ApprovalStatus; // always 'approved' for now (owner approval is per-owner, not per-venue)
  tags?: string[];           // optional feature tags
  upiId?: string;            // Phase 3: owner UPI ID
  qrCodeUrl?: string;        // Phase 3: owner QR code URL
  createdAt?: Timestamp | Date;
  // Phase 2 schema additions
  ownerName?: string;
  venueName?: string;
  sportType?: string;
  location?: string;
  status?: 'active' | 'inactive';
  venueCode?: string;
  ownershipStatus?: 'pending' | 'approved' | 'rejected' | null;
  ownerLinked?: boolean;
  linkedOwnerId?: string | null;
  ownershipVerifiedAt?: Timestamp | Date | null;
}


export interface Booking {
  id: string;
  bookingId: string;
  playerId: string;          // replaces userId
  playerName: string;
  playerEmail?: string;
  ownerId: string;
  venueId: string;
  venueName: string;
  venueArea: string;
  sport: Sport;
  date: string;
  slot: string;
  amount: number;            // replaces price
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  utrNumber: string;
  screenshotUrl: string;
  ticketId: string;          // replaces ticketNumber
  createdAt?: Timestamp | Date;

  bookingLifecycle?: 'upcoming' | 'completed' | 'expired' | 'cancelled';

  // Legacy compatibility fields
  userId?: string;
  price?: number;
  status?: BookingStatus | 'upcoming';
  ticketNumber?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  savedVenues: string[];
  role: UserRole;                    // v3.0: 'player' | 'owner' | 'admin'
  approvalStatus?: ApprovalStatus;   // v3.0: only relevant for owners
  upiId?: string;                    // Phase 3: owner UPI ID
  qrCodeUrl?: string;                // Phase 3: owner QR code URL
  createdAt?: Timestamp | Date;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface VenueFilters {
  sport?: Sport | '';
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  skillLevel?: SkillLevel | '';
  amenities?: string[];
  minRating?: number;
  searchQuery?: string;
}

export interface TimeSlot {
  time: string;
  label: string;
  priceMultiplier: number;
  available: boolean;
}

export interface Infrastructure {
  id: string;
  name: string;
  sport: Sport | string;
  area: string;
  coordinates: Coordinates;
  source: string;
  verified: boolean;
  bookable: boolean;
  ownerLinked: boolean;
  ownerId?: string | null;
  infrastructureType: 'government' | 'public' | 'akhara' | 'park' | 'private' | string;
  imageUrl?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  venueCode?: string;
  osmId?: string;
  placeId?: string;
  ownershipStatus?: 'pending' | 'approved' | 'rejected' | null;
  linkedOwnerId?: string | null;
  ownershipVerifiedAt?: Timestamp | Date | null;
}

export interface OwnershipRequest {
  id: string;
  venueCode: string;
  infrastructureId: string;
  infrastructureName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  proofType: string;
  proofUrl: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date;
}

export interface ConciergeCard {
  venueId: string;
  title: string;
  sport: string;
  area: string;
  imageUrl?: string;
  rating?: number;
  price?: number;
  venueType: 'marketplace' | 'infrastructure';
  venueCode?: string;
  action: 'book' | 'view' | 'verify';
}

