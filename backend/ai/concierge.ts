import { getApprovedVenues, getLandmarks, getInfrastructure, getVenueBookings } from '@/backend/firebase/firestore';
import { callLLM, ChatMessage } from '@/backend/ai/llm';
import { rankVenues, RankingCriteria } from './ranking';
import { generateTimeSlots } from '@/shared/helpers/pricing';

export async function handleConciergeRequest(
  message: string,
  history: { role: string; content: string }[],
  mode: 'discovery' | 'guidance' = 'discovery'
) {
  // ── LIVE FIRESTORE RETRIEVAL ───────────────────────────────────────────
  const liveVenues = await getApprovedVenues().catch(() => []);
  const landmarks = await getLandmarks().catch(() => []);
  const infra = await getInfrastructure().catch(() => []);

  // If in GUIDANCE MODE, run standard guidance chat
  if (mode === 'guidance') {
    const venueNames = liveVenues.map((v) => v.name).join(', ');
    const systemPrompt = `You are PlaySphere AI (Guidance Mode) — a sports rules and gear advisor for Lucknow, India.
Your focus is to provide lightweight sports tips, basic rules, workout timing advice, and beginner suggestions.
- Keep it lightweight. Do NOT create coaching programs, act as a health advisor, medical consultant, or life assistant.
- Provide simple rules, gear tips, warm-up habits, and suggestions on the best timing to book slots to save money (afternoon slots are 15% cheaper).
- You can mention that these venues are available in Lucknow if relevant: ${venueNames || 'None yet'}. Never invent any other sports venues.
- All prices are in Indian Rupees (₹).
- Start with a brief friendly sports greeting (E.g. "Hi! I'm PlaySphere AI (Guidance Mode) 🏸").`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }
    messages.push({ role: 'user', content: message });
    const responseText = await callLLM(messages);
    return { response: responseText, text: responseText, cards: [] };
  }

  // ── DISCOVERY/AGENTIC MODE: TWO-PASS WORKFLOW ───────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Pass 1: Parse intent from user message
  const extractionPrompt = `You are an agentic query parsing assistant. Analyze the user's sports query and extract search parameters in Lucknow.
Return ONLY a valid JSON object matching the schema below. Do not wrap the JSON in markdown code blocks or add any other text.
Schema:
{
  "sport": string | null,
  "location": string | null,
  "landmark": string | null,
  "venueName": string | null,
  "maxPrice": number | null,
  "skillLevel": string | null,
  "preferredTime": "morning" | "afternoon" | "evening" | null,
  "compareMode": boolean,
  "timeSlot": string | null,
  "bookingIntent": boolean,
  "bookingDate": string | null,
  "bookingSlot": string | null
}

Examples:
Query: "Beginner badminton under 300 near Lohia Park tomorrow evening"
JSON: {
  "sport": "badminton",
  "location": "Gomti Nagar",
  "landmark": "Lohia Park",
  "venueName": null,
  "maxPrice": 300,
  "skillLevel": "beginner",
  "preferredTime": "evening",
  "compareMode": false,
  "timeSlot": "tomorrow evening",
  "bookingIntent": false,
  "bookingDate": null,
  "bookingSlot": null
}

Query: "I want to book a football turf in Chinhat tomorrow at 6 PM"
JSON: {
  "sport": "football",
  "location": "Chinhat",
  "landmark": null,
  "venueName": null,
  "maxPrice": null,
  "skillLevel": null,
  "preferredTime": "evening",
  "compareMode": false,
  "timeSlot": "tomorrow at 6 PM",
  "bookingIntent": true,
  "bookingDate": "${new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]}",
  "bookingSlot": "18:00–19:00"
}

Query: "Book Lohia Park Sports Area tomorrow at 11 AM"
JSON: {
  "sport": "badminton",
  "location": "Gomti Nagar",
  "landmark": "Lohia Park",
  "venueName": "Lohia Park Sports Area",
  "maxPrice": null,
  "skillLevel": null,
  "preferredTime": null,
  "compareMode": false,
  "timeSlot": "tomorrow at 11 AM",
  "bookingIntent": true,
  "bookingDate": "${new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]}",
  "bookingSlot": "11:00–12:00"
}

User query: "${message}"
Today's date is: ${todayStr} (use this to resolve relative bookingDates like 'tomorrow', 'today', 'day after tomorrow', etc. to YYYY-MM-DD format).
JSON:`;

  let criteria: RankingCriteria = {};
  let isCompareMode = false;
  let timeSlotStr = '';
  let parsed: any = {};

  try {
    const rawExtraction = await callLLM([
      { role: 'system', content: 'You parse queries to JSON.' },
      { role: 'user', content: extractionPrompt }
    ], { temperature: 0.1 });

    const cleanedJson = rawExtraction.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedJson);
    
    criteria = {
      sport: parsed.sport || undefined,
      area: parsed.location || undefined,
      maxPrice: parsed.maxPrice || undefined,
      skillLevel: parsed.skillLevel || undefined,
      preferredTime: parsed.preferredTime || undefined,
      venueName: parsed.venueName || undefined,
    };
    isCompareMode = !!parsed.compareMode;
    timeSlotStr = parsed.timeSlot || '';

    // If landmark is specified, resolve it to coordinates and area
    if (parsed.landmark && landmarks.length > 0) {
      const matchedLandmark = landmarks.find(
        (l) => l.name.toLowerCase().includes(parsed.landmark.toLowerCase()) ||
               parsed.landmark.toLowerCase().includes(l.name.toLowerCase())
      );
      if (matchedLandmark) {
        criteria.nearLandmark = matchedLandmark.name;
        criteria.area = matchedLandmark.area; // Overwrite area with landmark's area
      }
    }

    // Direct landmark fallback resolution to Gomti Nagar for Lohia Park/Janeshwar Mishra Park if not matched
    if (parsed.landmark && !criteria.area) {
      const lm = parsed.landmark.toLowerCase();
      if (lm.includes('lohia') || lm.includes('janeshwar')) {
        criteria.nearLandmark = parsed.landmark;
        criteria.area = 'Gomti Nagar';
      }
    }
  } catch (err) {
    console.error('Intent extraction failed, falling back to heuristic parsing:', err);
    // Heuristic fallbacks
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('badminton')) criteria.sport = 'badminton';
    if (lowerMsg.includes('football')) criteria.sport = 'football';
    if (lowerMsg.includes('swimming')) criteria.sport = 'swimming';
    if (lowerMsg.includes('kabaddi')) criteria.sport = 'kabaddi';
    if (lowerMsg.includes('gomti')) criteria.area = 'Gomti Nagar';
    if (lowerMsg.includes('chinhat')) criteria.area = 'Chinhat';
    if (lowerMsg.includes('aliganj')) criteria.area = 'Aliganj';
    if (lowerMsg.includes('hazratganj')) criteria.area = 'Hazratganj';
    if (lowerMsg.includes('beginner')) criteria.skillLevel = 'beginner';
    if (lowerMsg.includes('advanced')) criteria.skillLevel = 'advanced';
    if (lowerMsg.includes('compare')) isCompareMode = true;
    if (lowerMsg.includes('lohia')) {
      criteria.area = 'Gomti Nagar';
      criteria.nearLandmark = 'Lohia Park';
    } else if (lowerMsg.includes('janeshwar')) {
      criteria.area = 'Gomti Nagar';
      criteria.nearLandmark = 'Janeshwar Mishra Park';
    }
  }

  // Merge live marketplace venues and infrastructure for discovery
  const activeVenueCodes = new Set(liveVenues.map((v) => v.venueCode).filter(Boolean));

  const mappedInfra = infra
    .filter((i) => !i.venueCode || !activeVenueCodes.has(i.venueCode))
    .map((i) => ({
      id: i.id,
      name: i.name,
      sport: i.sport as any,
      area: i.area,
      address: `${i.name}, ${i.area}`,
      coordinates: i.coordinates,
      price: 0,
      rating: i.rating || 0,
      reviewCount: i.reviewCount || 0,
      amenities: i.amenities || [],
      skillLevel: 'all' as any,
      timings: { open: '00:00', close: '00:00' },
      description: i.description || '',
      imageUrl: i.imageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
      category: 'infrastructure',
      available: false,
      ownerId: i.ownerId || 'system',
      source: i.source as any,
      approvalStatus: 'approved' as any,
      peakPricing: { morning: 0, afternoon: 0, evening: 0 },
      ownerLinked: i.ownerLinked ?? false,
      ownershipStatus: i.ownershipStatus ?? null,
      venueCode: i.venueCode
    }));

  const allSearchable = [...liveVenues, ...mappedInfra];

  // Filter venues by sport first (if requested) to keep search focused
  let filteredVenues = allSearchable;
  if (criteria.sport) {
    filteredVenues = allSearchable.filter((v) => v.sport.toLowerCase() === criteria.sport?.toLowerCase());
  }

  // Rank the filtered venues based on criteria
  const ranked = rankVenues(filteredVenues, criteria);

  // ── PREFILL AGENTIC BOOKING ACTION ──────────────────────────────────────
  let bookingAction: any = null;
  if (parsed.bookingIntent && liveVenues.length > 0) {
    // Filter only bookable marketplace venues (which have category !== 'infrastructure')
    const bookableFiltered = criteria.sport
      ? liveVenues.filter((v) => v.sport.toLowerCase() === criteria.sport?.toLowerCase())
      : liveVenues;

    const rankedBookables = rankVenues(bookableFiltered, criteria);
    if (rankedBookables.length > 0) {
      const targetVenue = rankedBookables[0].venue;
      const targetDate = parsed.bookingDate || todayStr;

      try {
        const bookings = await getVenueBookings(targetVenue.id, targetDate);
        const slots = generateTimeSlots(
          targetVenue.timings.open,
          targetVenue.timings.close,
          targetVenue.price,
          targetDate
        );

        // Filter out already booked slots
        const bookedSlotLabels = new Set(bookings.map((b) => b.slot));
        const availableSlots = slots.filter((s) => !bookedSlotLabels.has(s.label));

        // Match preferred slot
        let selectedSlot = null;
        if (parsed.bookingSlot) {
          const cleanSlot = parsed.bookingSlot.replace(/\s+/g, '').toLowerCase();
          selectedSlot = availableSlots.find((s) => {
            const cleanLabel = s.label.replace(/\s+/g, '').toLowerCase();
            return cleanLabel.includes(cleanSlot) || cleanSlot.includes(cleanLabel) || s.time.includes(cleanSlot);
          });
        }

        if (!selectedSlot && criteria.preferredTime) {
          selectedSlot = availableSlots.find((s) => s.timeOfDay === criteria.preferredTime);
        }

        if (!selectedSlot) {
          selectedSlot = availableSlots[0];
        }

        if (selectedSlot) {
          bookingAction = {
            type: 'book',
            venueId: targetVenue.id,
            venueName: targetVenue.name,
            date: targetDate,
            slot: selectedSlot.label,
          };
        }
      } catch (err) {
        console.error('Error checking availability for agentic action:', err);
      }
    }
  }

  // Programmatically handle Smart Compare Mode
  let comparisonTable = '';
  if (isCompareMode && ranked.length > 0) {
    comparisonTable = `\n\n### 📊 Structured Comparison Matrix:\n| Venue Name | Location / Area | Type | Base Price | Rating |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    ranked.slice(0, 3).forEach((r) => {
      const isInf = r.venue.category === 'infrastructure';
      comparisonTable += `| **${r.venue.name}** | ${r.venue.area} | ${isInf ? '🏛️ Mapped Infra' : '🎫 Bookable Venue'} | ${isInf ? 'N/A' : `₹${r.venue.price}/hr`} | ${isInf ? 'N/A' : `${r.venue.rating}★`} |\n`;
    });
  }

  // Programmatically handle Slot Recommendation Insights
  let slotRecommendation = '';
  if (ranked.length > 0) {
    const topVenue = ranked[0].venue;
    const peak = topVenue.peakPricing;
    if (peak && topVenue.category !== 'infrastructure') {
      slotRecommendation = `\n\n### ⏱️ Slot Availability & Smart Pricing Recommendation for ${topVenue.name}:\n`;
      slotRecommendation += `- **Best Value (Afternoon)**: ₹${peak.afternoon}/hr (11 AM - 4 PM) [15% Off discount applied]\n`;
      slotRecommendation += `- **Standard (Morning)**: ₹${peak.morning}/hr (5 AM - 8 AM)\n`;
      slotRecommendation += `- **Peak Premium (Evening)**: ₹${peak.evening}/hr (5 PM - 10 PM) [30% peak fee applied]\n`;
      slotRecommendation += `Recommendation: If booking ${timeSlotStr || 'soon'}, prefer the Afternoon slot to save money!`;
    }
  }

  // Assemble facts and final LLM system prompt
  const rankedFacts = ranked.slice(0, 3).map((r, index) => {
    const isInf = r.venue.category === 'infrastructure';
    return `${index + 1}. **${r.venue.name}** (Score: ${r.score}/100) [${isInf ? '🏛️ Mapped Infrastructure - Booking Unavailable' : '🎫 Marketplace Venue - Bookable'}] -> ${r.explanation}`;
  }).join('\n');

  let systemPrompt = `You are PlaySphere AI (Discovery Mode) — an expert agentic sports concierge for Lucknow, India.
Your objective is to provide venue search, comparisons, slot recommendations, and booking assistance.
- You have parsed the user's intent and calculated weighted matching scores for the top venues in real-time.
- You must explain recommendations using the calculated matching scores (E.g. "This facility scored 95/100 because...") instead of fabricating reasoning.
- Provide clear next steps using internal paths (e.g. /venues/[id]) and interactive venue cards rendering below.
- Do NOT output any Google Maps links, raw coordinates, or external navigation links. PlaySphere AI maintains a fully self-contained experience. Inform the user they can use the interactive cards or interactive map on this page to view details, verify ownership, or complete bookings.

### Real-Time Grounded Matches:
${rankedFacts || 'No matching active venues found in Lucknow matching those criteria.'}
${comparisonTable}
${slotRecommendation}

STRICT GROUNDING RULES:
1. Recommend ONLY the venues listed in the facts above. If the list is empty, state that honestly.
2. Incorporate the computed matching scores and peak pricing recommendation in your response.
3. Keep your response structured, recruiter-friendly, and concise. All prices are in Indian Rupees (₹).
4. Do not invent any other venues. Lucknow areas include: Gomti Nagar, Chinhat, Aliganj, Hazratganj, Indira Nagar, Chowk.
5. NEVER Suggest or output Google Maps links, coordinates, or any external navigation links. Guide the user to the interactive cards displayed on their screen instead.`;

  if (bookingAction) {
    systemPrompt += `\n\n### ⚡ PREFILLED BOOKING ACTION ACTIVE:
The user explicitly wants to book. We have verified availability and prefilled this action:
- Venue: ${bookingAction.venueName} (ID: ${bookingAction.venueId})
- Date: ${bookingAction.date}
- Slot: ${bookingAction.slot}

You MUST inform the user that you have found and pre-selected this slot for them, state the price, and tell them they can click the "Continue Booking" button below to pre-fill their booking details for manual confirmation on the booking page. Explain why this venue is the best match.`;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
  ];

  if (history && Array.isArray(history)) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });
  }

  const cards = ranked.slice(0, 3).map((r) => {
    const isInf = r.venue.category === 'infrastructure';
    return {
      venueId: r.venue.id,
      title: r.venue.name,
      sport: r.venue.sport,
      area: r.venue.area,
      imageUrl: r.venue.imageUrl,
      rating: isInf ? undefined : r.venue.rating,
      price: isInf ? undefined : r.venue.price,
      venueType: (isInf ? 'infrastructure' : 'marketplace') as 'marketplace' | 'infrastructure',
      venueCode: r.venue.venueCode,
      action: (isInf 
        ? (r.venue.ownershipStatus === 'approved' ? 'view' : 'verify') 
        : 'book') as 'book' | 'view' | 'verify',
    };
  });

  messages.push({ role: 'user', content: message });
  const responseText = await callLLM(messages);

  return {
    response: responseText,
    text: responseText,
    action: bookingAction || undefined,
    cards: cards
  };
}
