// app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchQuestionsFromNotion } from '@/lib/notion';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const goalIdParam = searchParams.get('goalId');
    const goalId =
      goalIdParam != null ? Number.parseInt(goalIdParam, 10) : undefined;

    const questions = await fetchQuestionsFromNotion(
      typeof goalId === 'number' && !Number.isNaN(goalId)
        ? goalId
        : undefined,
    );

    return NextResponse.json(
      {
        source: 'notion',
        goalId: goalId ?? null,
        count: questions.length,
        questions,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[api/questions] Notion query error', err);
    return NextResponse.json(
      {
        source: 'error',
        error: 'Failed to fetch questions from Notion',
      },
      { status: 500 },
    );
  }
}
