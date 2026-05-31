// Venue and Booking Types

export type UserRole = 'player' | 'venue_owner' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueCoordinates {
  latitude: number;
  longitude: number;
}

export interface SportConfig {
  name: string;
  courts: number;
  pricePerHour: number;
  maxPlayers?: number;
}

export type VenueSource = 'osm_discovered' | 'user_created' | 'enriched';

export interface Venue {
  id: string;
  name: string;
  description?: string;
  address: string;
  area: string;
  city: string;
  coordinates: VenueCoordinates;
  sports: SportConfig[];
  amenities: string[];
  ownerId?: string;
  ownerLinked: boolean;
  bookable: boolean;
  rating: number;
  totalReviews: number;
  operatingHours?: {
    open: string;
    close: string;
  };
  source: VenueSource;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  ticketCode: string; // PS-XXXX-XXXX
  userId: string;
  venueId: string;
  sport: string;
  courtNumber: number;
  date: Date;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: 'pending' | 'verified' | 'refunded';
  utrCode?: string; // Simulated transaction reference
  isAIBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  venueId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

export interface VerificationClaim {
  id: string;
  userId: string;
  venueId: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationDocuments: {
    paymentProof?: string;
    upiId?: string;
    utrRecords?: string[];
  };
  submittedAt: Date;
  reviewedAt?: Date;
}
