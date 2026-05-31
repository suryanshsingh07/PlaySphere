import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { isSlotInPast } from '@/shared/helpers/pricing';
import { Venue, Booking, UserProfile, VenueFilters, ApprovalStatus, Landmark, Infrastructure, OwnershipRequest } from '@/shared/types';
import { generateTicketId } from '@/shared/helpers/ticket';

/** Helper to convert Firestore Timestamps to plain JS objects recursively,
 *  which avoids Next.js Server-to-Client Component serialization errors. */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (
    (typeof Timestamp !== 'undefined' && data instanceof Timestamp) ||
    (typeof data === 'object' &&
      data !== null &&
      'seconds' in data &&
      'nanoseconds' in data &&
      typeof (data as any).toDate === 'function')
  ) {
    return {
      seconds: (data as any).seconds,
      nanoseconds: (data as any).nanoseconds,
    } as any;
  }

  if (data instanceof Date) {
    return data as any;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item)) as any;
  }

  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serialized[key] = serializeData(data[key]);
      }
    }
    return serialized;
  }

  return data;
}


// ── VENUES ──────────────────────────────────────────────────────────────────

export async function getAllVenues(): Promise<Venue[]> {
  const snap = await getDocs(collection(db, 'venues'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
}

/** Fetch only active venues from Firestore owned by approved owners.
 *  Firestore is the single source of truth — no static fallback. */
export async function getApprovedVenues(): Promise<Venue[]> {
  const q = query(
    collection(db, 'venues'),
    where('available', '==', true)
  );
  const snap = await getDocs(q);
  const venues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
  return venues.filter((v) => v.ownerId !== 'system' && v.approvalStatus === 'approved');
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const snap = await getDoc(doc(db, 'venues', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Venue) : null;
}

export async function getFilteredVenues(filters: VenueFilters): Promise<Venue[]> {
  let q = query(collection(db, 'venues'));

  if (filters.sport) {
    q = query(q, where('sport', '==', filters.sport));
  }
  if (filters.area) {
    q = query(q, where('area', '==', filters.area));
  }
  if (filters.skillLevel) {
    q = query(q, where('skillLevel', 'in', [filters.skillLevel, 'all']));
  }

  const snap = await getDocs(q);
  let venues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));

  // Client-side filters for fields not supported by Firestore compound queries
  if (filters.maxPrice) {
    venues = venues.filter((v) => v.price <= filters.maxPrice!);
  }
  if (filters.minPrice) {
    venues = venues.filter((v) => v.price >= filters.minPrice!);
  }
  if (filters.minRating) {
    venues = venues.filter((v) => v.rating >= filters.minRating!);
  }
  if (filters.searchQuery) {
    const searchQ = filters.searchQuery.toLowerCase();
    venues = venues.filter(
      (v) =>
        v.name.toLowerCase().includes(searchQ) ||
        v.area.toLowerCase().includes(searchQ) ||
        v.description.toLowerCase().includes(searchQ)
    );
  }

  // Filter out system seed venues and keep only approved active venues
  return venues.filter((v) => v.ownerId !== 'system' && v.approvalStatus === 'approved' && v.available === true);
}

export async function addVenue(venue: Omit<Venue, 'id' | 'createdAt'>): Promise<string> {
  let ownerName = 'System';
  if (venue.ownerId && venue.ownerId !== 'system') {
    try {
      const profile = await getUserProfile(venue.ownerId);
      if (profile) {
        ownerName = profile.displayName;
      }
    } catch (err) {
      console.error('Error fetching owner profile in addVenue:', err);
    }
  }

  const ref = await addDoc(collection(db, 'venues'), {
    ...venue,
    ownerName,
    venueName: venue.name,
    sportType: venue.sport,
    location: venue.address || venue.area,
    status: venue.available ? 'active' : 'inactive',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateVenue(id: string, data: Partial<Venue>): Promise<void> {
  const updates: any = { ...data };
  if (data.name) updates.venueName = data.name;
  if (data.sport) updates.sportType = data.sport;
  if (data.address || data.area) updates.location = data.address || data.area;
  if (data.available !== undefined) {
    updates.status = data.available ? 'active' : 'inactive';
  }
  await updateDoc(doc(db, 'venues', id), updates);
}

export async function deleteVenue(id: string): Promise<void> {
  await deleteDoc(doc(db, 'venues', id));
}

/** Fetch all venues owned by a specific owner */
export async function getOwnerVenues(ownerId: string): Promise<Venue[]> {
  const q = query(collection(db, 'venues'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
}

/** Real-time listener for owner's venues */
export function subscribeOwnerVenues(ownerId: string, callback: (venues: Venue[]) => void): Unsubscribe {
  const q = query(collection(db, 'venues'), where('ownerId', '==', ownerId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
  });
}

// ── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function createBooking(booking: Omit<Booking, 'id' | 'bookingId' | 'createdAt'>): Promise<string> {
  if (isSlotInPast(booking.date, booking.slot)) {
    throw new Error("This slot has already passed.");
  }
  const docRef = doc(collection(db, 'bookings'));
  const bookingId = docRef.id;
  const bookingData = {
    ...booking,
    bookingId,
    id: bookingId,
    userId: booking.playerId || (booking as any).userId,
    playerId: booking.playerId || (booking as any).userId,
    amount: booking.amount || (booking as any).price || 0,
    price: booking.amount || (booking as any).price || 0,
    paymentStatus: 'payment_pending',
    bookingStatus: 'pending',
    status: 'pending', // legacy compatibility
    utrNumber: '',
    screenshotUrl: '',
    ticketId: '',
    ticketNumber: '', // legacy compatibility
    createdAt: serverTimestamp(),
  };
  await setDoc(docRef, bookingData);
  return bookingId;
}

export async function submitPaymentProof(bookingId: string, utrNumber: string, screenshotUrl: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: 'verification_pending',
    utrNumber,
    screenshotUrl,
  });
}

export async function approvePayment(bookingId: string): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) {
    throw new Error('Booking not found');
  }
  const booking = snap.data() as Booking;
  const ticketId = generateTicketId(booking.sport);
  await updateDoc(bookingRef, {
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    status: 'confirmed', // legacy compatibility
    ticketId,
    ticketNumber: ticketId, // legacy compatibility
  });
}

export async function rejectPayment(bookingId: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: 'rejected',
    bookingStatus: 'pending',
    status: 'pending', // legacy compatibility
  });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  const snap = await getDoc(bookingRef);
  if (snap.exists()) {
    const bookingData = snap.data() as Booking;
    const isPaid = bookingData.paymentStatus === 'paid';
    await updateDoc(bookingRef, {
      bookingStatus: 'cancelled',
      status: 'cancelled', // legacy compatibility
      paymentStatus: isPaid ? 'refund_pending' : (bookingData.paymentStatus || 'cancelled'),
    });
  } else {
    await updateDoc(bookingRef, {
      bookingStatus: 'cancelled',
      status: 'cancelled', // legacy compatibility
    });
  }
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, 'bookings', bookingId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null;
}

/** Fetch all bookings for a list of venue IDs (for owner dashboard) */
export async function getVenueBookingsForOwner(venueIds: string[]): Promise<Booking[]> {
  if (venueIds.length === 0) return [];
  // Firestore 'in' supports up to 30 items
  const chunks: string[][] = [];
  for (let i = 0; i < venueIds.length; i += 30) {
    chunks.push(venueIds.slice(i, i + 30));
  }
  const results: Booking[] = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, 'bookings'),
      where('venueId', 'in', chunk),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  }
  return results;
}

/** Real-time listener for bookings on a set of venue IDs */
export function subscribeVenueBookings(venueIds: string[], callback: (bookings: Booking[]) => void): Unsubscribe {
  if (venueIds.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, 'bookings'),
    where('venueId', 'in', venueIds.slice(0, 30)),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  });
}

/** Admin: fetch ALL bookings */
export async function getAllBookings(): Promise<Booking[]> {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

// ── SAVED VENUES ─────────────────────────────────────────────────────────────

export async function toggleSavedVenue(userId: string, venueId: string, isSaved: boolean): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    savedVenues: isSaved ? arrayRemove(venueId) : arrayUnion(venueId),
  });
}

/** Fetch venue documents by array of IDs (for saved venues) */
export async function getVenuesByIds(ids: string[]): Promise<Venue[]> {
  if (ids.length === 0) return [];
  const results: Venue[] = [];
  await Promise.all(
    ids.map(async (id) => {
      const snap = await getDoc(doc(db, 'venues', id));
      if (snap.exists()) results.push({ id: snap.id, ...snap.data() } as Venue);
    })
  );
  return results;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getVenueBookings(venueId: string, date: string): Promise<Booking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('venueId', '==', venueId),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Booking))
    .filter((b) => b.status !== 'cancelled' && b.bookingStatus !== 'cancelled');
}

export async function checkSlotAvailability(venueId: string, date: string, slot: string): Promise<boolean> {
  if (isSlotInPast(date, slot)) {
    return false;
  }
  const bookings = await getVenueBookings(venueId, date);
  return !bookings.some(b => b.slot === slot);
}

// ── USERS (Admin) ─────────────────────────────────────────────────────────────

/**
 * Admin: fetch all user profiles.
 * CRITICAL FIX: Legacy player docs do NOT store `uid` inside the document body —
 * only in the document path. We always inject uid from d.id to ensure it's populated.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({
    uid: d.id,         // Always inject from document path — never rely on stored uid field
    ...d.data(),
  } as UserProfile));
}

/** Admin: update an owner's approval status */
export async function updateOwnerApproval(uid: string, status: ApprovalStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { approvalStatus: status });
}

/** Get users with a specific role */
export async function getUsersByRole(role: 'player' | 'owner' | 'admin'): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
  } as UserProfile));
}

// ── ADMIN REALTIME LISTENERS ──────────────────────────────────────────────────

/**
 * Admin: realtime listener for ALL users.
 * Injects uid from document path so legacy docs without stored uid field still work.
 */
export function subscribeAllUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    } as UserProfile)));
  }, (err) => {
    console.error('[Admin] Users listener error:', err);
    callback([]);
  });
}

/**
 * Admin: realtime listener for ALL venues.
 */
export function subscribeAllVenues(callback: (venues: Venue[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'venues'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
  }, (err) => {
    console.error('[Admin] Venues listener error:', err);
    callback([]);
  });
}

/**
 * Admin: realtime listener for ALL bookings (ordered by creation desc).
 */
export function subscribeAllBookings(callback: (bookings: Booking[]) => void): Unsubscribe {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  }, (err) => {
    console.error('[Admin] Bookings listener error:', err);
    callback([]);
  });
}

/** Realtime listener for approved active venues */
export function subscribeApprovedVenues(callback: (venues: Venue[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'venues'),
    where('available', '==', true)
  );
  return onSnapshot(q, (snap) => {
    const venues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
    callback(venues.filter((v) => v.ownerId !== 'system' && v.approvalStatus === 'approved'));
  }, (err) => {
    console.error('Error in approved venues listener:', err);
    callback([]);
  });
}

/** Realtime listener for bookings belonging to a specific owner */
export function subscribeOwnerBookings(ownerId: string, callback: (bookings: Booking[]) => void): Unsubscribe {
  const q = query(collection(db, 'bookings'), where('ownerId', '==', ownerId));
  return onSnapshot(q, (snap) => {
    const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    // Sort by createdAt desc client-side to avoid composite index requirements
    bookings.sort((a, b) => {
      const timeA = (a.createdAt as any)?.seconds || 0;
      const timeB = (b.createdAt as any)?.seconds || 0;
      return timeB - timeA;
    });
    callback(bookings);
  }, (err) => {
    console.error('Error in owner bookings listener:', err);
    callback([]);
  });
}

// ── LANDMARKS ────────────────────────────────────────────────────────────────

export async function getLandmarks(): Promise<Landmark[]> {
  const colRef = collection(db, 'landmarks');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Landmark));
}

export function subscribeLandmarks(callback: (landmarks: Landmark[]) => void): Unsubscribe {
  const colRef = collection(db, 'landmarks');
  return onSnapshot(colRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Landmark)));
  }, (err) => {
    console.error('Error subscribing to landmarks:', err);
    callback([]);
  });
}

export async function getInfrastructure(): Promise<Infrastructure[]> {
  const colRef = collection(db, 'infrastructure');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Infrastructure));
}

export async function getInfrastructureById(id: string): Promise<Infrastructure | null> {
  const snap = await getDoc(doc(db, 'infrastructure', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Infrastructure) : null;
}


export function subscribeInfrastructure(callback: (infra: Infrastructure[]) => void): Unsubscribe {
  const colRef = collection(db, 'infrastructure');
  return onSnapshot(colRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Infrastructure)));
  }, (err) => {
    console.error('Error subscribing to infrastructure:', err);
    callback([]);
  });
}

export function generateVenueCode(sport: string): string {
  const prefixes: Record<string, string> = {
    badminton: 'BAD',
    football: 'FTB',
    swimming: 'SWM',
    kabaddi: 'KBD'
  };
  const code = prefixes[sport.toLowerCase()] || 'SPT';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PS-LKO-${code}-${rand}`;
}

export async function getInfrastructureByVenueCode(venueCode: string): Promise<Infrastructure | null> {
  const colRef = collection(db, 'infrastructure');
  const q = query(colRef, where('venueCode', '==', venueCode));
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Infrastructure);
}

export async function submitOwnershipRequest(requestData: Omit<OwnershipRequest, 'id' | 'status' | 'createdAt'>): Promise<string> {
  // A. Validate infrastructure exists
  const infraRef = doc(db, 'infrastructure', requestData.infrastructureId);
  const infraSnap = await getDoc(infraRef);
  if (!infraSnap.exists()) {
    throw new Error('Infrastructure record not found');
  }
  const infraData = infraSnap.data() as Infrastructure;

  // B. Reject if already verified
  if (infraData.ownerLinked === true) {
    throw new Error('This venue is already verified by an owner.');
  }

  // C. Check if a pending request already exists for the same venueCode
  const requestsCol = collection(db, 'ownership_requests');
  try {
    const qCode = query(
      requestsCol,
      where('venueCode', '==', requestData.venueCode),
      where('status', '==', 'pending')
    );
    const snapCode = await getDocs(qCode);
    if (!snapCode.empty) {
      throw new Error('Ownership verification already pending.');
    }
  } catch (err: any) {
    if (err.code !== 'permission-denied') {
      throw err;
    }
  }

  // D. Prevent duplicate request by the same owner
  const qOwner = query(
    requestsCol,
    where('ownerId', '==', requestData.ownerId),
    where('venueCode', '==', requestData.venueCode),
    where('status', '==', 'pending')
  );
  const snapOwner = await getDocs(qOwner);
  if (!snapOwner.empty) {
    throw new Error('You already have a pending verification request for this venue.');
  }

  let docRef;
  try {
    docRef = await addDoc(requestsCol, {
      ...requestData,
      status: 'pending',
      createdAt: new Date(),
    });
  } catch (err: any) {
    console.error('[submitOwnershipRequest] Error writing to ownership_requests:', err);
    throw new Error(`Write to ownership_requests failed: ${err.message}`);
  }

  return docRef.id;
}

export async function approveOwnershipRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, 'ownership_requests', requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) {
    throw new Error('Ownership request not found');
  }

  const reqData = requestSnap.data() as Omit<OwnershipRequest, 'id'>;
  if (reqData.status !== 'pending') {
    throw new Error(`Request is already in state: ${reqData.status}`);
  }

  // 1. Update request status to approved
  await updateDoc(requestRef, { status: 'approved' });

  // 2. Update the infrastructure record
  const infraRef = doc(db, 'infrastructure', reqData.infrastructureId);
  const infraSnap = await getDoc(infraRef);
  if (!infraSnap.exists()) {
    throw new Error('Infrastructure record not found');
  }
  const infraData = infraSnap.data() as Omit<Infrastructure, 'id'>;

  await updateDoc(infraRef, {
    ownershipStatus: 'approved',
    linkedOwnerId: reqData.ownerId,
    ownershipVerifiedAt: new Date(),
    ownerLinked: true,
    bookable: true,
    ownerId: reqData.ownerId,
  });

  // Fetch owner profile name
  let ownerName = reqData.ownerName || 'Venue Owner';
  try {
    const profile = await getUserProfile(reqData.ownerId);
    if (profile) {
      ownerName = profile.displayName;
    }
  } catch (err) {
    console.error('Error fetching owner profile in approveOwnershipRequest:', err);
  }

  // 3. Create corresponding marketplace venue doc
  const venueData: Omit<Venue, 'id'> = {
    name: infraData.name,
    sport: infraData.sport as any,
    area: infraData.area,
    address: `${infraData.name}, ${infraData.area}, Lucknow`,
    coordinates: infraData.coordinates,
    price: 250, // default hourly rate
    rating: infraData.rating || 4.5,
    reviewCount: infraData.reviewCount || 1,
    amenities: infraData.amenities || ['Parking', 'Drinking Water', 'Restrooms'],
    skillLevel: 'all',
    timings: { open: '06:00', close: '22:00' },
    description: infraData.description || `Owner-managed facility claimed from mapped infrastructure: ${infraData.name}`,
    imageUrl: infraData.imageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    category: 'sports',
    peakPricing: { morning: 250, afternoon: 212, evening: 325 },
    available: true,
    ownerId: reqData.ownerId,
    ownerName: ownerName,
    source: 'owner',
    approvalStatus: 'approved',
    status: 'active',
  };

  await addDoc(collection(db, 'venues'), venueData);
}

export async function rejectOwnershipRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, 'ownership_requests', requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) {
    throw new Error('Ownership request not found');
  }

  const reqData = requestSnap.data() as Omit<OwnershipRequest, 'id'>;

  // 1. Update the request status to rejected
  await updateDoc(requestRef, { status: 'rejected' });

  // 2. Reset infrastructure record fields
  const infraRef = doc(db, 'infrastructure', reqData.infrastructureId);
  await updateDoc(infraRef, {
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null,
    ownerLinked: false,
    bookable: false,
    ownerId: null,
  });
}

export function subscribeOwnershipRequests(callback: (reqs: OwnershipRequest[]) => void): Unsubscribe {
  const colRef = collection(db, 'ownership_requests');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OwnershipRequest)));
  }, (err) => {
    console.error('Error subscribing to ownership requests:', err);
    callback([]);
  });
}

export function subscribeOwnerOwnershipRequests(ownerId: string, callback: (reqs: OwnershipRequest[]) => void): Unsubscribe {
  const colRef = collection(db, 'ownership_requests');
  const q = query(colRef, where('ownerId', '==', ownerId));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OwnershipRequest));
    docs.sort((a, b) => {
      const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).toMillis?.() || new Date(a.createdAt as any).getTime();
      const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).toMillis?.() || new Date(b.createdAt as any).getTime();
      return tB - tA;
    });
    callback(docs);
  }, (err) => {
    console.error('Error subscribing to owner ownership requests:', err);
    callback([]);
  });
}

export async function getOwnershipRequestByVenueCode(venueCode: string): Promise<OwnershipRequest | null> {
  const colRef = collection(db, 'ownership_requests');
  const q = query(colRef, where('venueCode', '==', venueCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OwnershipRequest));
  docs.sort((a, b) => {
    const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).seconds * 1000;
    const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).seconds * 1000;
    return tB - tA;
  });
  return docs[0];
}

export async function seedLandmarksAndInfrastructure(): Promise<void> {
  // 1. Seed landmarks
  const landmarkCol = collection(db, 'landmarks');
  const landmarkSnap = await getDocs(landmarkCol);
  if (landmarkSnap.empty) {
    const defaults = [
      { name: 'Lohia Park', area: 'Gomti Nagar', latitude: 26.8529, longitude: 80.9829, sportsRelevance: ['running', 'walking', 'badminton', 'yoga'] },
      { name: 'SAI Lucknow Center', area: 'Kanpur Road', latitude: 26.7456, longitude: 80.8719, sportsRelevance: ['athletics', 'football', 'hockey', 'swimming', 'badminton'] },
      { name: 'K.D. Singh Babu Stadium', area: 'Hazratganj', latitude: 26.8576, longitude: 80.9402, sportsRelevance: ['cricket', 'football', 'swimming', 'tennis'] },
      { name: 'Ekana Stadium', area: 'Sultanpur Road', latitude: 26.8122, longitude: 81.0142, sportsRelevance: ['cricket', 'football', 'tennis'] },
      { name: 'Janeshwar Mishra Park', area: 'Gomti Nagar Extension', latitude: 26.8328, longitude: 80.9998, sportsRelevance: ['football', 'cycling', 'cricket'] },
      { name: 'Chinhat Bazar', area: 'Chinhat', latitude: 26.8864, longitude: 81.0454, sportsRelevance: ['cricket', 'football'] },
      { name: 'SAI Complex Aliganj', area: 'Aliganj', latitude: 26.8923, longitude: 80.9405, sportsRelevance: ['badminton', 'table tennis', 'basketball'] }
    ];
    for (const d of defaults) {
      await addDoc(landmarkCol, d);
    }
  }

  // 2. Seed infrastructure
  const infraCol = collection(db, 'infrastructure');
  const infraSnap = await getDocs(infraCol);
  if (infraSnap.empty) {
    const defaults = [
      {
        name: "Lohia Park Sports Area",
        sport: "badminton",
        area: "Gomti Nagar",
        coordinates: { lat: 26.8529, lng: 80.9829 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "park",
        imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
        description: "Public open-air badminton courts and jogging tracks inside Dr. Ram Manohar Lohia Park, Gomti Nagar.",
        rating: 4.2,
        reviewCount: 15,
        amenities: ["Jogging Track", "Open Gym", "Public Restrooms"],
        venueCode: "PS-LKO-BAD-1043",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      },
      {
        name: "SAI Lucknow Sports Complex",
        sport: "football",
        area: "Kanpur Road",
        coordinates: { lat: 26.7456, lng: 80.8719 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "government",
        imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
        description: "Sports Authority of India (SAI) training facility in Lucknow, offering national-grade football turfs.",
        rating: 4.6,
        reviewCount: 48,
        amenities: ["Locker Rooms", "Professional Coaches", "Parking", "First Aid"],
        venueCode: "PS-LKO-FTB-2012",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      },
      {
        name: "Chinhat Sports Complex",
        sport: "football",
        area: "Chinhat",
        coordinates: { lat: 26.8864, lng: 81.0454 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "public",
        imageUrl: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800",
        description: "Regional public turf facility in Chinhat for local tournaments and recreational play.",
        rating: 4.0,
        reviewCount: 12,
        amenities: ["Parking", "Water"],
        venueCode: "PS-LKO-FTB-2013",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      },
      {
        name: "SAI Complex Aliganj",
        sport: "badminton",
        area: "Aliganj",
        coordinates: { lat: 26.8923, lng: 80.9405 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "government",
        imageUrl: "https://images.unsplash.com/photo-1521537634581-0dccd2ece234?w=800",
        description: "Government-run indoor sports halls in Aliganj, featuring high-quality wooden courts.",
        rating: 4.4,
        reviewCount: 25,
        amenities: ["Restrooms", "Water Cooler", "Indoor Seating"],
        venueCode: "PS-LKO-BAD-1044",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      },
      {
        name: "K.D. Singh Babu Stadium",
        sport: "swimming",
        area: "Hazratganj",
        coordinates: { lat: 26.8576, lng: 80.9402 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "government",
        imageUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=800",
        description: "Historic sports stadium in the heart of Hazratganj, including an Olympic-sized public swimming pool.",
        rating: 4.5,
        reviewCount: 80,
        amenities: ["Olympic Pool", "Locker Rooms", "Spectator Stand"],
        venueCode: "PS-LKO-SWM-3091",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      },
      {
        name: "Ekana Sports Complex",
        sport: "kabaddi",
        area: "Sultanpur Road",
        coordinates: { lat: 26.8122, lng: 81.0142 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "private",
        imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
        description: "State-of-the-art sports facilities adjacent to the cricket stadium on Sultanpur Road.",
        rating: 4.7,
        reviewCount: 35,
        amenities: ["Parking", "Locker Rooms", "First Aid"],
        venueCode: "PS-LKO-KBD-4011",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      },
      {
        name: "Janeshwar Mishra Park Kabaddi Arena",
        sport: "kabaddi",
        area: "Gomti Nagar Extension",
        coordinates: { lat: 26.8328, lng: 80.9998 },
        source: "mapped",
        verified: true,
        bookable: false,
        ownerLinked: false,
        ownerId: null,
        infrastructureType: "park",
        imageUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800",
        description: "Dedicated public play area inside Janeshwar Mishra Park, Gomti Nagar Extension.",
        rating: 4.3,
        reviewCount: 19,
        amenities: ["Open Area", "Jogging Track", "Food Courts"],
        venueCode: "PS-LKO-KBD-4012",
        ownershipStatus: null,
        linkedOwnerId: null,
        ownershipVerifiedAt: null
      }
    ];
    for (const d of defaults) {
      await addDoc(infraCol, d);
    }
  }
}

export async function getUnverifiedInfrastructure(): Promise<Infrastructure[]> {
  const allInfra = await getInfrastructure();
  return allInfra.filter(infra => !infra.ownerLinked && !infra.bookable);
}

export async function upsertInfrastructure(infra: Omit<Infrastructure, 'id'> & { id?: string }): Promise<{ id: string; action: 'added' | 'updated' }> {
  const allInfra = await getInfrastructure();
  
  // Find duplicate matching
  let match: Infrastructure | null = null;
  
  const newName = infra.name?.trim().toLowerCase();
  const newArea = infra.area?.trim().toLowerCase();
  const newLat = infra.coordinates?.lat;
  const newLng = infra.coordinates?.lng;
  const newCode = infra.venueCode?.trim();
  const newOsmId = infra.osmId?.trim();
  const newPlaceId = infra.placeId?.trim();

  // Priority 1: Match by placeId / OSM id
  if (newOsmId) {
    const found = allInfra.find((item) => item.osmId === newOsmId);
    if (found) match = found;
  }
  if (!match && newPlaceId) {
    const found = allInfra.find((item) => item.placeId === newPlaceId);
    if (found) match = found;
  }

  // Priority 2: Match by venueCode (exact match)
  if (!match && newCode) {
    const found = allInfra.find((item) => item.venueCode?.trim() === newCode);
    if (found) match = found;
  }

  // Priority 3: Match by name + area (case-insensitive trim match)
  if (!match && newName && newArea) {
    const found = allInfra.find(
      (item) => item.name.trim().toLowerCase() === newName && item.area.trim().toLowerCase() === newArea
    );
    if (found) match = found;
  }

  // Priority 4: Match by coordinates closeness (difference < 0.0005)
  if (!match && newLat !== undefined && newLng !== undefined) {
    const found = allInfra.find((item) => {
      const latDiff = Math.abs(item.coordinates.lat - newLat);
      const lngDiff = Math.abs(item.coordinates.lng - newLng);
      return latDiff < 0.0005 && lngDiff < 0.0005;
    });
    if (found) match = found;
  }

  if (match) {
    // Merge safely preserving critical ownership properties
    const mergedData = {
      ...match, // start with existing record
      ...infra, // overwrite with incoming properties
      ownerLinked: match.ownerLinked ?? false,
      verified: match.verified ?? false,
      ownerId: match.ownerId ?? null,
      linkedOwnerId: match.linkedOwnerId ?? null,
      ownershipStatus: match.ownershipStatus ?? null,
      ownershipVerifiedAt: match.ownershipVerifiedAt ?? null,
      bookable: match.bookable ?? false,
      venueCode: match.venueCode || infra.venueCode || generateVenueCode(infra.sport || 'badminton'),
    };
    
    // Clean up undefined properties to avoid Firebase errors
    const cleanedData = JSON.parse(JSON.stringify(mergedData));
    
    const docRef = doc(db, 'infrastructure', match.id);
    await setDoc(docRef, cleanedData, { merge: true });
    return { id: match.id, action: 'updated' };
  } else {
    // Generate code and save new record
    const venueCode = infra.venueCode || generateVenueCode(infra.sport || 'badminton');
    const newDoc = {
      ...infra,
      venueCode,
      verified: infra.verified ?? true,
      bookable: false, // strictly unbookable until claimed/verified by workflow
      ownerLinked: false,
      ownerId: null,
      linkedOwnerId: null,
      ownershipStatus: null,
      ownershipVerifiedAt: null,
      source: infra.source || 'discovered'
    };
    
    // Clean up undefined properties
    const cleanedDoc = JSON.parse(JSON.stringify(newDoc));
    
    const colRef = collection(db, 'infrastructure');
    if (infra.id) {
      await setDoc(doc(colRef, infra.id), cleanedDoc);
      return { id: infra.id, action: 'added' };
    } else {
      const docRef = await addDoc(colRef, cleanedDoc);
      return { id: docRef.id, action: 'added' };
    }
  }
}


