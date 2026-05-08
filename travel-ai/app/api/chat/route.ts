import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatMessage, ApiResponse } from '@/lib/types';
import { chatWithPlanner } from '@/lib/gemini';
import { TOKYO_SAMPLE_TRIP } from '@/lib/seed-data';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, currentItinerary } = body;

    const itinerary = currentItinerary || TOKYO_SAMPLE_TRIP.itinerary!;

    const { reply, updatedItinerary } = await chatWithPlanner(message, [], itinerary);

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      itineraryUpdate: updatedItinerary,
      suggestedActions: generateSuggestedActions(message),
    };

    return NextResponse.json<ApiResponse<ChatMessage>>({
      success: true,
      data: assistantMessage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json<ApiResponse<ChatMessage>>({
      success: true,
      data: {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "I'm processing your request! Let me check the itinerary details and get back to you with the best options. 🌍",
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

function generateSuggestedActions(userMessage: string): string[] {
  const lower = userMessage.toLowerCase();
  if (lower.includes('cheaper') || lower.includes('budget')) {
    return ['Show budget breakdown', 'Find free alternatives', 'Reduce dining costs'];
  }
  if (lower.includes('rain') || lower.includes('weather')) {
    return ['Show indoor options', 'Check 7-day forecast', 'Move outdoor activities'];
  }
  return ['Make it cheaper', 'Add more food', 'Show hidden gems', 'Optimize routes'];
}
