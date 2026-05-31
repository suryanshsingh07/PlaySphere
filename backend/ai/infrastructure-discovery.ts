import { upsertInfrastructure } from '../firebase/firestore';
import { fetchOSMInfrastructure } from './osm-discovery';
import { Infrastructure } from '../../shared/types';

export interface DiscoveredCandidate {
  name: string;
  sport: string;
  area: string;
  coordinates: { lat: number; lng: number };
  source: string;
  verified: boolean;
  bookable: boolean;
  ownerLinked: boolean;
  ownerId: string | null;
  infrastructureType: 'government' | 'public' | 'akhara' | 'park' | 'private' | string;
  imageUrl?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  ownershipStatus: 'pending' | 'approved' | 'rejected' | null;
  linkedOwnerId: string | null;
  ownershipVerifiedAt: any | null;
  placeId?: string;
  osmId?: string;
}

export const LUCKNOW_DISCOVERED_POOL: DiscoveredCandidate[] = [
  {
    name: "Gomti Nagar Swimming Pavilion",
    sport: "swimming",
    area: "Gomti Nagar",
    coordinates: { lat: 26.8540, lng: 80.9910 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "public",
    imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
    description: "Public access swimming facility located in Gomti Nagar, offering clean waters and coached sessions.",
    rating: 4.1,
    reviewCount: 9,
    amenities: ["Shower Rooms", "Lockers", "Trainer"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  },
  {
    name: "Chinhat Badminton Center",
    sport: "badminton",
    area: "Chinhat",
    coordinates: { lat: 26.8900, lng: 81.0500 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "private",
    imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
    description: "Indoor private badminton facility in Chinhat area with synthetic courts.",
    rating: 3.9,
    reviewCount: 7,
    amenities: ["Parking", "Refreshments"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  },
  {
    name: "Aliganj Football Ground",
    sport: "football",
    area: "Aliganj",
    coordinates: { lat: 26.8980, lng: 80.9380 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "public",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
    description: "Open public football ground in Aliganj for community play and local matches.",
    rating: 4.0,
    reviewCount: 14,
    amenities: ["Open Access", "Goal Posts"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  },
  {
    name: "Hazratganj Kabaddi Academy",
    sport: "kabaddi",
    area: "Hazratganj",
    coordinates: { lat: 26.8610, lng: 80.9450 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "akhara",
    imageUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800",
    description: "Traditional soil arena and training ground for kabaddi enthusiasts in Hazratganj.",
    rating: 4.3,
    reviewCount: 22,
    amenities: ["Soil Arena", "Drinking Water", "First Aid"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  },
  {
    name: "Janeshwar Mishra Park Swimming Pool",
    sport: "swimming",
    area: "Gomti Nagar Extension",
    coordinates: { lat: 26.8350, lng: 80.9960 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "park",
    imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
    description: "Outdoor public swimming pool situated inside Janeshwar Mishra Park.",
    rating: 4.2,
    reviewCount: 31,
    amenities: ["Locker Rooms", "Showers", "Life Guard"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  },
  {
    name: "Ekana Badminton Arena",
    sport: "badminton",
    area: "Sultanpur Road",
    coordinates: { lat: 26.8100, lng: 81.0180 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "private",
    imageUrl: "https://images.unsplash.com/photo-1521537634581-0dccd2ece234?w=800",
    description: "Premium private indoor badminton courts near Ekana Stadium.",
    rating: 4.5,
    reviewCount: 18,
    amenities: ["Indoor Courts", "Parking", "AC", "Pro Shop"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  },
  {
    name: "Gomti Nagar Kabaddi Turf",
    sport: "kabaddi",
    area: "Gomti Nagar",
    coordinates: { lat: 26.8480, lng: 80.9800 },
    source: "discovered",
    verified: true,
    bookable: false,
    ownerLinked: false,
    ownerId: null,
    infrastructureType: "public",
    imageUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800",
    description: "Community kabaddi play area inside Gomti Nagar public sports complex.",
    rating: 3.8,
    reviewCount: 5,
    amenities: ["Open Fields", "Seating"],
    ownershipStatus: null,
    linkedOwnerId: null,
    ownershipVerifiedAt: null
  }
];

async function enrichWithGoogle(name: string, area: string, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name + ', ' + area + ', Lucknow')}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const match = data.results[0];
      let imageUrl: string | undefined = undefined;
      if (match.photos && match.photos.length > 0) {
        imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${match.photos[0].photo_reference}&key=${apiKey}`;
      }
      return {
        formattedAddress: match.formatted_address,
        rating: match.rating,
        reviewCount: match.user_ratings_total,
        imageUrl,
        placeId: match.place_id
      };
    }
  } catch (err) {
    console.error('[GOOGLE-ENRICHMENT] Failed to enrich venue:', name, err);
  }
  return null;
}

export async function runInfrastructureDiscovery() {
  const logs: string[] = [];
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let enriched = 0;
  let errors = 0;
  let osmFetched = 0;

  logs.push(`[${new Date().toLocaleTimeString()}] Starting sports infrastructure discovery for Lucknow...`);

  // 1. Fetch from OpenStreetMap Overpass API
  logs.push(`Querying OpenStreetMap Overpass API for sports infrastructure in Lucknow...`);
  const { rawFetched, normalized, rejected } = await fetchOSMInfrastructure();
  osmFetched = rawFetched;
  const normalizedCount = normalized.length;
  const rejectedCount = rejected;
  logs.push(`OSM Overpass query complete. Fetched ${rawFetched} candidates (Normalized: ${normalizedCount}, Rejected Junk: ${rejectedCount}).`);

  // 2. Combine Pools (Seed + OSM)
  const combinedCandidates: Omit<Infrastructure, 'id'>[] = [
    ...LUCKNOW_DISCOVERED_POOL,
    ...normalized
  ];

  logs.push(`Total candidates to process: ${combinedCandidates.length} (Seed: ${LUCKNOW_DISCOVERED_POOL.length}, OSM Normalized: ${normalizedCount}).`);

  // 3. Setup Google Enrichment
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const hasGoogleKey = googleApiKey.trim().length > 0;
  if (hasGoogleKey) {
    logs.push(`Google Places API key detected. Enabling optional metadata enrichment.`);
  } else {
    logs.push(`Google Places API key missing. Skipping enrichment phase.`);
  }

  // 4. Ingest and Enrich Candidates
  let enrichmentCount = 0;
  const ENRICHMENT_CAP = 5; // Cap to prevent high billing / rate limits

  for (const item of combinedCandidates) {
    try {
      const isOSM = item.source === 'osm_discovered';
      const sourceLabel = isOSM ? 'OSM' : 'Seed';
      
      // Determine if we should attempt Google Enrichment (Only up to the cap for non-blocking design)
      let enrichedThisVenue = false;
      if (hasGoogleKey && enrichmentCount < ENRICHMENT_CAP) {
        logs.push(`[ENRICH] Querying Google Places enrichment for "${item.name}"...`);
        const enrichedData = await enrichWithGoogle(item.name, item.area, googleApiKey);
        if (enrichedData) {
          item.rating = enrichedData.rating ?? item.rating;
          item.reviewCount = enrichedData.reviewCount ?? item.reviewCount;
          if (enrichedData.imageUrl) item.imageUrl = enrichedData.imageUrl;
          if (enrichedData.placeId) item.placeId = enrichedData.placeId;
          if (enrichedData.formattedAddress) {
            item.description = `${item.description || ''}\n\nAddress: ${enrichedData.formattedAddress}`;
          }
          item.source = 'osm_enriched'; // Upgrade source tag
          enrichedThisVenue = true;
          enrichmentCount++;
          enriched++;
          logs.push(`  -> ENRICHED: Successfully enriched metadata for "${item.name}" (Place ID: ${enrichedData.placeId})`);
        } else {
          logs.push(`  -> ENRICH SKIP: No exact match or empty response from Google Places.`);
        }
      }

      logs.push(`Evaluating candidate: "${item.name}" in ${item.area} (${item.sport}) [Source: ${sourceLabel}]...`);
      const res = await upsertInfrastructure(item);
      
      if (res.action === 'added') {
        added++;
        logs.push(`  -> SUCCESS: Created new mapped infrastructure: "${item.name}" (ID: ${res.id})`);
      } else {
        updated++;
        skipped++;
        const finalStatus = enrichedThisVenue ? 'Enriched' : 'Duplicate Skipped';
        logs.push(`  -> SKIP (Duplicate matched): Updated existing record for "${item.name}" (ID: ${res.id}) [Status: ${finalStatus}]`);
      }
    } catch (err: any) {
      errors++;
      logs.push(`  -> ERROR: Failed to ingest "${item.name}": ${err.message || err}`);
    }
  }

  logs.push(`[${new Date().toLocaleTimeString()}] Discovery cycle completed.`);
  logs.push(`Summary: OSM Fetched: ${osmFetched}, Normalized: ${normalizedCount}, Rejected: ${rejectedCount}, Added: ${added}, Updated: ${updated}, Skipped: ${skipped}, Enriched: ${enriched}, Errors: ${errors}.`);

  return {
    success: true,
    osmFetched,
    normalized: normalizedCount,
    rejected: rejectedCount,
    added,
    updated,
    skipped,
    enriched,
    errors,
    logs
  };
}
