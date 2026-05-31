import { Venue } from '@/shared/types';

export interface RankingCriteria {
  sport?: string;
  area?: string;
  maxPrice?: number;
  skillLevel?: string;
  preferredTime?: string;
  nearLandmark?: string;
  venueName?: string;
}

export interface RankedVenue {
  venue: Venue;
  score: number;
  scoreBreakdown: {
    skillScore: number;
    priceScore: number;
    locationScore: number;
    ratingScore: number;
    availabilityScore: number;
  };
  explanation: string;
}

export function rankVenues(venues: Venue[], criteria: RankingCriteria): RankedVenue[] {
  return venues
    .map((v) => {
      // 1. Skill Compatibility Score (Weight: 30%)
      let skillScore = 1.0;
      if (criteria.skillLevel) {
        if (v.skillLevel === 'all') {
          skillScore = 0.8;
        } else if (v.skillLevel.toLowerCase() === criteria.skillLevel.toLowerCase()) {
          skillScore = 1.0;
        } else {
          // Mismatch
          skillScore = 0.2;
        }
      }

      // 2. Budget Score (Weight: 25%)
      let priceScore = 1.0;
      if (criteria.maxPrice) {
        if (v.price <= criteria.maxPrice) {
          priceScore = 1.0;
        } else if (v.price <= criteria.maxPrice * 1.2) {
          priceScore = 0.6; // Slightly over budget
        } else {
          priceScore = 0.1; // Way over budget
        }
      }

      // 3. Location / Area Match (Weight: 25%)
      let locationScore = 1.0;
      if (criteria.venueName || criteria.area || criteria.nearLandmark) {
        const queryVenueName = (criteria.venueName || '').toLowerCase();
        const queryArea = (criteria.area || '').toLowerCase();
        const queryLandmark = (criteria.nearLandmark || '').toLowerCase();
        const venueArea = v.area.toLowerCase();
        const venueName = v.name.toLowerCase();
        const venueDesc = v.description.toLowerCase();

        const queryWords = queryVenueName.split(/\s+/).filter(w => w.length >= 3 && w !== 'sports' && w !== 'complex' && w !== 'arena' && w !== 'center' && w !== 'park' && w !== 'turf' && w !== 'field');
        const hasWordMatch = queryWords.length > 0 && queryWords.some(word => venueName.includes(word));

        if (queryVenueName && (venueName.includes(queryVenueName) || queryVenueName.includes(venueName) || hasWordMatch)) {
          // Specific venue name matches get a massive priority boost
          locationScore = 3.0;
        } else if (
          venueArea === queryArea || 
          (queryLandmark && (
            venueName.includes(queryLandmark) || 
            venueDesc.includes(queryLandmark) || 
            venueArea.includes(queryLandmark)
          ))
        ) {
          locationScore = 1.0;
        } else if (queryArea && (venueArea.includes(queryArea) || queryArea.includes(venueArea))) {
          locationScore = 0.8;
        } else {
          locationScore = 0.1;
        }
      }

      // 4. Rating Score (Weight: 10%)
      const ratingScore = (v.rating || 4.0) / 5.0;

      // 5. Availability Score (Weight: 10%)
      const availabilityScore = v.available ? 1.0 : 0.0;

      // 6. Locality-Aware Proximity AI Boost
      let localityBoost = 0;
      const queryArea = (criteria.area || '').toLowerCase().trim();
      const queryLandmark = (criteria.nearLandmark || '').toLowerCase().trim();
      const venueArea = v.area.toLowerCase().trim();
      const venueName = v.name.toLowerCase().trim();
      const venueDesc = v.description.toLowerCase().trim();

      if (queryArea && venueArea === queryArea) {
        localityBoost = 25;
      } else if (queryLandmark && (venueName.includes(queryLandmark) || venueDesc.includes(queryLandmark) || venueArea.includes(queryLandmark))) {
        localityBoost = 20;
      } else if (queryArea && (venueArea.includes(queryArea) || queryArea.includes(venueArea))) {
        localityBoost = 15;
      }

      // 7. Infrastructure vs Marketplace Priority Boost
      let priorityBoost = 0;
      const isInfra = v.category === 'infrastructure';
      const isVerifiedInfra = isInfra && (v.ownerLinked === true || v.ownershipStatus === 'approved');
      
      if (isInfra) {
        if (isVerifiedInfra) {
          priorityBoost = 10; // verified infrastructure
        } else {
          priorityBoost = 0;  // mapped infrastructure
        }
      } else {
        priorityBoost = 20; // verified marketplace venue
      }

      // Calculate Weighted Total Score
      const totalScore = Math.round(
        (skillScore * 0.3 +
          priceScore * 0.25 +
          locationScore * 0.25 +
          ratingScore * 0.1 +
          availabilityScore * 0.1) *
          100
      ) + priorityBoost + localityBoost;

      // Construct programmatic grounded recommendation rationale
      const targetLocation = criteria.nearLandmark || criteria.area || v.area;
      const explanation = `Recommended because it is closest to ${targetLocation}, is currently bookable, fits your ₹${v.price} budget, and supports ${v.sport}.`;

      return {
        venue: v,
        score: totalScore,
        scoreBreakdown: {
          skillScore,
          priceScore,
          locationScore,
          ratingScore,
          availabilityScore,
        },
        explanation,
      };
    })
    .sort((a, b) => b.score - a.score);
}
