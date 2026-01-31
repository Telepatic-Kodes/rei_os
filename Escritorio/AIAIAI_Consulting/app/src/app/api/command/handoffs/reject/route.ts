import { NextRequest, NextResponse } from 'next/server';
import { updateHandoff } from '@/lib/data-helpers';
import type { RejectHandoffRequest } from '@/lib/types/command';

export async function POST(request: NextRequest) {
  try {
    const body: RejectHandoffRequest = await request.json();
    const { handoffId, reason } = body;

    // Update handoff status
    await updateHandoff(handoffId, {
      status: 'rejected',
    });

    return NextResponse.json({
      success: true,
      message: 'Handoff rejected',
      reason,
    });
  } catch (error) {
    console.error('Reject handoff error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
