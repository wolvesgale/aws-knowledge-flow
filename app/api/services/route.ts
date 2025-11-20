// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchServicesFromNotion } from '@/lib/notion';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const goalIdParam = searchParams.get('goalId');
    const goalId =
      goalIdParam != null ? Number.parseInt(goalIdParam, 10) : undefined;

    const services = await fetchServicesFromNotion(
      typeof goalId === 'number' && !Number.isNaN(goalId)
        ? goalId
        : undefined,
    );

    return NextResponse.json(
      {
        source: 'notion',
        goalId: goalId ?? null,
        count: services.length,
        services,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[api/services] Notion query error', err);
    return NextResponse.json(
      {
        source: 'error',
        error: 'Failed to fetch services from Notion',
      },
      { status: 500 },
    );
  }
}
