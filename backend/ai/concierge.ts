// AI Concierge - Grounded LLM Integration

import Groq from 'groq-sdk';
import { SUPPORTED_SPORTS, LUCKNOW_NEIGHBORHOODS } from '@/shared/constants';
import { calculateDistance } from '@/shared/helpers';

const groq = new Groq({
  apiKey: process.env.LLM_API_KEY,
});

export interface ConciergeContext {
  availableVenues: Array<{
    id: string;
    name: string;
    area: string;
    sport: string;
    price: number;
    rating: number;
    coordinates: { latitude: number; longitude: number };
  }>;
  userLocation?: { latitude: number; longitude: number };
}

export interface ConciergeResponse {
  text: string;
  recommendations: Array<{
    venueId: string;
    venueName: string;
    sport: string;
    price: number;
    distance?: number;
    score: number;
  }>;
  bookingPrefill?: {
    venueId: string;
    date: string;
    time: string;
    sport: string;
  };
}

/**
 * Main AI Concierge handler with grounding
 */
export async function processUserQuery(
  userMessage: string,
  context: ConciergeContext
): Promise<ConciergeResponse> {
  // Step 1: Extract intent and parameters from user message
  const intent = extractIntent(userMessage);

  // Step 2: If it's a discovery/booking query, apply proximity boost and construct facts
  let factsPrompt = '';
  if (intent.type === 'discovery' || intent.type === 'booking') {
    const rankedVenues = rankVenuesByProximity(context.availableVenues, intent, context.userLocation);
    factsPrompt = buildFactsPrompt(rankedVenues);
  }

  // Step 3: Build system and user prompts with grounding
  const systemPrompt = buildSystemPrompt(intent, factsPrompt);
  const userPrompt = buildUserPrompt(userMessage, intent);

  try {
    // Step 4: Call Groq LLM
    const response = await groq.messages.create({
      model: process.env.LLM_MODEL || 'llama3-8b-8192',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: systemPrompt + '\n\n' + userPrompt,
        },
      ],
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    // Step 5: Parse LLM response and extract JSON structures
    const { recommendations, bookingPrefill } = extractStructuredData(aiResponse, intent);

    return {
      text: aiResponse,
      recommendations,
      bookingPrefill,
    };
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('Failed to process user query');
  }
}

interface IntentData {
  type: 'discovery' | 'booking' | 'guidance' | 'schedule' | 'help';
  sport?: string;
  area?: string;
  budget?: number;
  date?: string;
  time?: string;
}

function extractIntent(message: string): IntentData {
  const lowerMsg = message.toLowerCase();

  // Detect sport
  let sport: string | undefined;
  for (const s of SUPPORTED_SPORTS) {
    if (lowerMsg.includes(s.replace('_', ' '))) {
      sport = s;
      break;
    }
  }

  // Detect area
  let area: string | undefined;
  for (const neighborhood of LUCKNOW_NEIGHBORHOODS) {
    if (lowerMsg.includes(neighborhood.toLowerCase())) {
      area = neighborhood;
      break;
    }
  }

  // Detect budget (extract numbers followed by rupees/rs/₹)
  let budget: number | undefined;
  const budgetMatch = message.match(/[₹rs\s]+(\d+)/i);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1]);
  }

  // Detect time patterns
  let time: string | undefined;
  if (lowerMsg.includes('morning') || lowerMsg.includes('6') || lowerMsg.includes('7') || lowerMsg.includes('8')) {
    time = 'morning';
  } else if (
    lowerMsg.includes('afternoon') ||
    lowerMsg.includes('12') ||
    lowerMsg.includes('1') ||
    lowerMsg.includes('2') ||
    lowerMsg.includes('3')
  ) {
    time = 'afternoon';
  } else if (
    lowerMsg.includes('evening') ||
    lowerMsg.includes('night') ||
    lowerMsg.includes('6') ||
    lowerMsg.includes('7') ||
    lowerMsg.includes('8')
  ) {
    time = 'evening';
  }

  // Determine intent type
  let type: IntentData['type'] = 'help';
  if (
    lowerMsg.includes('find') ||
    lowerMsg.includes('search') ||
    lowerMsg.includes('looking for') ||
    lowerMsg.includes('where')
  ) {
    type = 'discovery';
  } else if (lowerMsg.includes('book') || lowerMsg.includes('reserve') || lowerMsg.includes('book now')) {
    type = 'booking';
  } else if (lowerMsg.includes('rules') || lowerMsg.includes('gear') || lowerMsg.includes('tips')) {
    type = 'guidance';
  } else if (lowerMsg.includes('my bookings') || lowerMsg.includes('bookings') || lowerMsg.includes('schedule')) {
    type = 'schedule';
  }

  return { type, sport, area, budget, time };
}

function rankVenuesByProximity(
  venues: ConciergeContext['availableVenues'],
  intent: IntentData,
  userLocation?: ConciergeContext['userLocation']
) {
  return venues
    .map(venue => {
      let score = venue.rating * 20; // Base rating score

      // Sport match boost
      if (intent.sport && venue.sport.toLowerCase().includes(intent.sport.toLowerCase())) {
        score += 50;
      }

      // Area match boost
      if (intent.area && venue.area.includes(intent.area)) {
        score += 40;
      }

      // Budget match boost
      if (intent.budget && venue.price <= intent.budget) {
        score += 30;
      } else if (intent.budget) {
        score -= 20; // Penalty for exceeding budget
      }

      // Proximity boost (if user location provided)
      let distance: number | undefined;
      if (userLocation) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          venue.coordinates.latitude,
          venue.coordinates.longitude
        );
        score += Math.max(0, 50 - distance * 5); // Closer = higher score
      }

      return { ...venue, score, distance };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 venues
}

function buildFactsPrompt(rankedVenues: ReturnType<typeof rankVenuesByProximity>): string {
  const venuesList = rankedVenues
    .map((v, idx) => `${idx + 1}. ${v.name} (${v.area}) - ${v.sport}, ₹${v.price}/hour, Rating: ${v.rating}/5`)
    .join('\n');

  return `
AVAILABLE VENUES IN LUCKNOW (Ranked by relevance):
${venuesList}

These are the ONLY venues available that match the search criteria. Do NOT suggest any other venues.
`;
}

function buildSystemPrompt(intent: IntentData, factsPrompt: string): string {
  if (intent.type === 'guidance') {
    return `You are PlaySphere AI, a sports knowledge assistant. You provide helpful tips, equipment recommendations, and sports rules ONLY. Do NOT recommend venues or make bookings. If asked about venues, politely redirect to the discovery feature.`;
  }

  if (intent.type === 'discovery' || intent.type === 'booking') {
    return `You are PlaySphere AI, a grounded sports venue assistant for Lucknow. Your responses are strictly based on the venues provided below. 

${factsPrompt}

Rules:
1. Only recommend venues from the list above
2. If no suitable venue exists, say "Unfortunately, no venues match your criteria"
3. For booking requests, provide a structured JSON block: {"venueId": "...", "date": "...", "time": "...", "sport": "..."}
4. Include distance if available
5. Be conversational and helpful`;
  }

  return `You are PlaySphere AI, a helpful sports venue assistant. Respond naturally to user queries about sports infrastructure discovery and booking in Lucknow.`;
}

function buildUserPrompt(message: string, intent: IntentData): string {
  let prompt = message;

  if (intent.type === 'discovery') {
    prompt += '\n\nBased on the venues provided, recommend the best match(es) for my query.';
  } else if (intent.type === 'booking') {
    prompt += '\n\nIf a suitable venue is found, provide booking details in JSON format.';
  }

  return prompt;
}

function extractStructuredData(
  aiResponse: string,
  intent: IntentData
): { recommendations: ConciergeResponse['recommendations']; bookingPrefill?: ConciergeResponse['bookingPrefill'] } {
  const recommendations: ConciergeResponse['recommendations'] = [];

  // Try to extract JSON prefill data
  const jsonMatch = aiResponse.match(/\{[^{}]*"venueId"[^{}]*\}/);
  let bookingPrefill: ConciergeResponse['bookingPrefill'] | undefined;

  if (jsonMatch) {
    try {
      bookingPrefill = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse booking prefill JSON');
    }
  }

  // Extract venue recommendations from text
  const venueMatches = aiResponse.match(/\d+\.\s+([A-Z][^,]+),/g);
  if (venueMatches) {
    venueMatches.forEach((match, idx) => {
      const venueName = match.replace(/^\d+\.\s+/, '').replace(/,\s*$/, '');
      recommendations.push({
        venueId: `venue_${idx}`,
        venueName,
        sport: intent.sport || 'various',
        price: 400, // Default estimate
        score: 100 - idx * 10,
      });
    });
  }

  return { recommendations, bookingPrefill };
}
