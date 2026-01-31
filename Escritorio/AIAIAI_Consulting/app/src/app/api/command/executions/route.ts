import { NextResponse } from 'next/server';
import { getActiveExecutions, getRecentExecutions } from '@/lib/data-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'active' or 'recent'
    const limit = parseInt(searchParams.get('limit') || '10');

    let executions;
    if (filter === 'active') {
      executions = await getActiveExecutions();
    } else {
      executions = await getRecentExecutions(limit);
    }

    return NextResponse.json({ executions });
  } catch (error) {
    console.error('Get executions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
