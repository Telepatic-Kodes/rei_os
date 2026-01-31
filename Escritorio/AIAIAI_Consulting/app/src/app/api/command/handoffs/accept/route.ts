import { NextRequest, NextResponse } from 'next/server';
import { updateHandoff } from '@/lib/data-helpers';
import type { AcceptHandoffRequest } from '@/lib/types/command';

export async function POST(request: NextRequest) {
  try {
    const body: AcceptHandoffRequest = await request.json();
    const { handoffId } = body;

    // Update handoff status
    await updateHandoff(handoffId, {
      status: 'accepted',
    });

    // In a real system, would create a task for the receiving agent
    // For now, just acknowledge the acceptance
    return NextResponse.json({
      success: true,
      message: 'Handoff accepted',
    });
  } catch (error) {
    console.error('Accept handoff error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
