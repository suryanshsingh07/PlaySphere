import { NextResponse } from 'next/server';
import { handleDiscoverRequest } from '@/backend/ai/discover';

export async function POST() {
  try {
    const insights = await handleDiscoverRequest();
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Discovery API Error:', error);
    return NextResponse.json(
      { insights: [] },
      { status: 500 }
    );
  }
}
