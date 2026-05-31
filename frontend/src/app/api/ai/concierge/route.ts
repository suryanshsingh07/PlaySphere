import { NextRequest, NextResponse } from 'next/server';
import { handleConciergeRequest } from '@/backend/ai/concierge';

export const maxDuration = 60; // Allow up to 60s for LLM calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { message, history, mode } = body;

    // Enforce a hard timeout on the whole concierge handler
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 55 seconds')), 55000)
    );

    const result = await Promise.race([
      handleConciergeRequest(message, history ?? [], mode ?? 'discovery'),
      timeoutPromise,
    ]);

    if (typeof result === 'string') {
      return NextResponse.json({ response: result });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[/api/ai/concierge] Error:', msg);

    // Determine appropriate status code
    const isTimeout = msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('timed out');
    const isRateLimit = msg.toLowerCase().includes('429') || msg.toLowerCase().includes('rate limit');

    return NextResponse.json(
      {
        error: isTimeout
          ? 'AI response timed out. Please try again in a moment.'
          : isRateLimit
          ? 'AI service is busy right now. Please try again in a few seconds.'
          : `AI service error: ${msg}`,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
