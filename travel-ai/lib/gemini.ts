import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';
import { TripIntent, Itinerary, ChatMessage } from './types';

const API_KEY = process.env.GEMINI_API_KEY || 'demo_mode';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI && API_KEY !== 'demo_mode') {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI!;
}

// ----------------------------------------------------------------
// System prompt for itinerary generation
// ----------------------------------------------------------------
const ITINERARY_SYSTEM_PROMPT = `You are TravelAI, an expert travel planner powered by Google Cloud and Gemini.
Your job is to create highly optimized, personalized travel itineraries.

RULES:
1. Always output valid JSON matching the Itinerary schema exactly
2. Apply deterministic constraints first: opening hours, budget limits, mobility needs
3. Cluster nearby activities to minimize travel time
4. Provide realistic cost estimates in USD
5. Include confidence scores (0.0-1.0) based on data freshness
6. Always include 1-2 alternatives for major activities
7. Include a clear "reasonIncluded" for every activity explaining why it was chosen
8. Generate a human-readable "reasonIncluded" explaining personalization
9. For each re-plan, add to adaptationLog with clear human-readable descriptions
10. Ensure daily costs don't exceed budget/(number of days) * 1.3 buffer

OPTIMIZATION PRIORITIES:
1. Budget adherence (hard constraint)
2. Travel time minimization (cluster nearby)
3. Opening hours compliance (deterministic)
4. User preference matching (AI ranked)
5. Experience diversity (no repetition)`;

// ----------------------------------------------------------------
// Parse natural language trip intent
// ----------------------------------------------------------------
export async function parseNaturalLanguageIntent(input: string): Promise<Partial<TripIntent>> {
  if (API_KEY === 'demo_mode') {
    // Fallback parsing for demo
    return parseFallback(input);
  }

  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Parse this travel request into structured JSON. Return ONLY valid JSON, no markdown.

Request: "${input}"

Return this exact JSON structure:
{
  "destination": "city, country",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "budget": number or null,
  "currency": "USD",
  "groupSize": number or 1,
  "travelStyle": ["cultural"|"adventure"|"luxury"|"budget"|"family"|"romantic"|"business"],
  "pace": "relaxed"|"moderate"|"intensive",
  "interests": ["string"],
  "dietaryRestrictions": [],
  "naturalLanguageInput": "${input}"
}`;

    const result: GenerateContentResult = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini parse error, using fallback:', err);
    return parseFallback(input);
  }
}

function parseFallback(input: string): Partial<TripIntent> {
  const lower = input.toLowerCase();
  const budgetMatch = input.match(/\$[\d,]+/);
  const daysMatch = input.match(/(\d+)[\s-]?day/i);
  const groupMatch = input.match(/(\d+)\s*(people|person|adults?|family)/i);

  return {
    destination: extractDestination(input),
    budget: budgetMatch ? parseInt(budgetMatch[0].replace(/[$,]/g, '')) : 1500,
    groupSize: groupMatch ? parseInt(groupMatch[1]) : lower.includes('family') ? 4 : 2,
    travelStyle: lower.includes('family') ? ['family'] : lower.includes('luxury') ? ['luxury'] : ['cultural'],
    pace: lower.includes('relaxed') ? 'relaxed' : lower.includes('packed') ? 'intensive' : 'moderate',
    interests: extractInterests(lower),
    naturalLanguageInput: input,
  };
}

function extractDestination(input: string): string {
  const cities = ['tokyo', 'paris', 'bali', 'new york', 'rome', 'london', 'singapore', 'dubai', 'bangkok', 'sydney', 'barcelona'];
  const lower = input.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city)) return city.replace(/\b\w/g, c => c.toUpperCase());
  }
  // Try to extract after "to" or "in"
  const match = input.match(/(?:to|in|visit|going to)\s+([A-Z][a-zA-Z\s,]+?)(?:\s+for|\s+under|\s+with|$)/i);
  return match ? match[1].trim() : 'Tokyo';
}

function extractInterests(lower: string): string[] {
  const interests: string[] = [];
  if (lower.includes('food') || lower.includes('dining')) interests.push('Food & Dining');
  if (lower.includes('museum') || lower.includes('history') || lower.includes('culture')) interests.push('History & Culture');
  if (lower.includes('kid') || lower.includes('child') || lower.includes('family')) interests.push('Family Activities');
  if (lower.includes('adventure') || lower.includes('outdoor')) interests.push('Adventure & Outdoors');
  if (lower.includes('beach') || lower.includes('ocean')) interests.push('Beaches');
  if (lower.includes('art')) interests.push('Art & Museums');
  return interests.length ? interests : ['History & Culture', 'Food & Dining'];
}

// ----------------------------------------------------------------
// Generate full itinerary via Gemini
// ----------------------------------------------------------------
export async function generateItinerary(intent: TripIntent): Promise<Itinerary> {
  if (API_KEY === 'demo_mode') {
    return generateDemoItinerary(intent);
  }

  try {
    const model = getGenAI().getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const days = Math.ceil(
      (new Date(intent.endDate).getTime() - new Date(intent.startDate).getTime()) / 86400000
    );

    const prompt = `${ITINERARY_SYSTEM_PROMPT}

Create a ${days}-day itinerary for:
- Destination: ${intent.destination}
- Dates: ${intent.startDate} to ${intent.endDate}
- Budget: $${intent.budget} total for ${intent.groupSize} people
- Travel Style: ${intent.travelStyle.join(', ')}
- Pace: ${intent.pace}
- Interests: ${intent.interests.join(', ')}
- Dietary: ${intent.dietaryRestrictions.join(', ') || 'No restrictions'}
- Mobility: ${intent.mobilityNeeds || 'No special needs'}

Return a complete Itinerary JSON object with all days, activities, costs, and metadata.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini itinerary error, using demo:', err);
    return generateDemoItinerary(intent);
  }
}

// ----------------------------------------------------------------
// Chat with planner assistant
// ----------------------------------------------------------------
export async function chatWithPlanner(
  message: string,
  history: ChatMessage[],
  currentItinerary: Itinerary
): Promise<{ reply: string; updatedItinerary?: Itinerary }> {
  if (API_KEY === 'demo_mode') {
    return chatFallback(message, currentItinerary);
  }

  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-pro' });

    const conversationHistory = history
      .map(m => `${m.role === 'user' ? 'User' : 'TravelAI'}: ${m.content}`)
      .join('\n');

    const prompt = `You are TravelAI, a helpful travel planning assistant. You have access to the current itinerary.

Current Itinerary Summary:
- Destination: ${currentItinerary.days[0]?.activities[0]?.location?.name || 'Unknown'}
- Days: ${currentItinerary.days.length}
- Total Cost: $${currentItinerary.totalEstimatedCost}
- Budget Remaining: $${currentItinerary.budgetRemaining}

Conversation History:
${conversationHistory}

User Request: "${message}"

Respond helpfully. If they want to modify the itinerary, explain what you'll change and why.
If asked to make changes, also return a JSON block with the specific changes.
Format: First give a friendly explanation, then if changes needed add: ###CHANGES### followed by JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text.includes('###CHANGES###')) {
      const [reply, changesJson] = text.split('###CHANGES###');
      try {
        const changes = JSON.parse(changesJson.trim());
        return { reply: reply.trim(), updatedItinerary: { ...currentItinerary, ...changes } };
      } catch {
        return { reply: text };
      }
    }

    return { reply: text };
  } catch (err) {
    console.error('Chat error:', err);
    return chatFallback(message, currentItinerary);
  }
}

// ----------------------------------------------------------------
// Fallback for demo mode (no API key)
// ----------------------------------------------------------------
function chatFallback(message: string, itinerary: Itinerary): { reply: string; updatedItinerary?: Itinerary } {
  const lower = message.toLowerCase();

  if (lower.includes('cheaper') || lower.includes('budget') || lower.includes('save')) {
    return {
      reply: `Great idea! 💰 I've analyzed your itinerary and found several ways to reduce costs:\n\n• **Replace Omakase dinner** ($90) with a highly-rated ramen shop ($15) → Save $75\n• **Skip Skytree** and use the free Bunkyo Civic Center observatory instead → Save $25\n• **Use IC Card** (transit card) instead of taxis throughout → Save ~$30\n\n**Total savings: ~$130** bringing your estimated spend to **$${itinerary.totalEstimatedCost - 130}**. Would you like me to apply all these changes?`,
    };
  }

  if (lower.includes('rain') || lower.includes('outdoor') || lower.includes('weather')) {
    return {
      reply: `☔ Smart thinking! Checking weather adaptation options...\n\nI've identified these **indoor alternatives** for rain days:\n\n• **teamLab Planets** → Immersive digital art (already in your plan!)\n• **Tokyo National Museum** → World-class history collection\n• **Mega Don Quijote** → Iconic multi-floor Japanese shopping experience\n• **Ramen Museum (Shin-Yokohama)** → 8 regional ramen shops under one roof\n\n🔄 Shall I automatically reschedule outdoor activities to your sunny days?`,
    };
  }

  if (lower.includes('nightlife') || lower.includes('night') || lower.includes('club') || lower.includes('bar')) {
    return {
      reply: `🌙 Tokyo nightlife is incredible! Here's what I recommend adding:\n\n**Evening additions:**\n• **Golden Gai** (Shinjuku) — 200+ tiny bars each with unique themes, $5-15/drink\n• **Roppongi Hills** — Rooftop bars with skyline views, cocktails $15-20\n• **Shibuya Stream** — Modern rooftop terrace perfect for night photos\n\nI can add a bar crawl on your last evening to end the trip with a memorable night. Budget needed: ~$60 extra. Want me to add it?`,
    };
  }

  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('eat')) {
    return {
      reply: `🍜 I love your food enthusiasm! Here are hidden culinary gems I can add:\n\n• **Depachika** (department store basement food halls) — Best food courts in the world\n• **Koenji** neighborhood — Authentic local ramen away from tourists\n• **Tsukemen** (dipping ramen) at Rokurinsha — Cult favorite, worth the queue\n• **Wagashi making class** — Make traditional Japanese sweets with a local chef\n\nCurrently you have 3 food spots. I can upgrade to 5 premium experiences. Estimated extra cost: $45. Shall I redesign the food journey?`,
    };
  }

  if (lower.includes('museum') || lower.includes('move') || lower.includes('tomorrow')) {
    return {
      reply: `📅 Rescheduling noted! Here's the impact analysis:\n\n**Moving Tokyo National Museum to Day 2:**\n✅ Opens travel time optimization (saves 15 min transit)\n✅ Better morning light for exhibits\n⚠️ Day 2 becomes slightly longer (+90 min)\n💡 Recommendation: Combine with Ueno Park walk (both are adjacent)\n\nI'll adjust the Day 1 afternoon to include Yanaka Ginza street instead — a charming old-Tokyo neighborhood you'll love. Shall I apply this change?`,
    };
  }

  return {
    reply: `I'm here to help optimize your trip! 🌟\n\nHere's what I can do for you:\n• **Replan for weather** — Swap outdoor/indoor activities based on forecast\n• **Budget optimization** — Find equivalent experiences at lower cost\n• **Add experiences** — Nightlife, food tours, hidden gems\n• **Reschedule** — Move any activity to a different day or time slot\n• **Alternative routes** — Optimize for less walking or faster transit\n\nWhat would you like to change? Just ask naturally!`,
  };
}

function generateDemoItinerary(intent: TripIntent): Itinerary {
  // Return a simplified demo itinerary structure
  const { TOKYO_SAMPLE_TRIP } = require('./seed-data');
  return {
    ...TOKYO_SAMPLE_TRIP.itinerary,
    id: `itin_${Date.now()}`,
    tripId: `trip_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}
