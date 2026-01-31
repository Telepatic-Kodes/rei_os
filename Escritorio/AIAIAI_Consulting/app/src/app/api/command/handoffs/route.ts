import { NextResponse } from 'next/server';
import { getPendingHandoffs } from '@/lib/data-helpers';

export async function GET() {
  try {
    const handoffs = await getPendingHandoffs();
    return NextResponse.json({ handoffs });
  } catch (error) {
    console.error('Get handoffs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
