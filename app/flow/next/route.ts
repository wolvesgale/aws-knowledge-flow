// app/api/flow/next/route.ts
import { NextResponse } from 'next/server';
import { getNextNode, type FlowNode, type Answer } from '../../../../lib/flow-logic';

type NextRequestBody = {
  goalId?: string;
  answers?: { questionId: string; value: string | string[] }[];
};

type NextResponseBody = {
  node: FlowNode;
};

export async function POST(req: Request) {
  let body: NextRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'JSONが不正です。' } },
      { status: 400 },
    );
  }

  if (!body.goalId) {
    return NextResponse.json(
      { error: { code: 'MISSING_GOAL_ID', message: 'goalId が必須です。' } },
      { status: 400 },
    );
  }

  const answers: Answer[] = (body.answers ?? []).map((a) => ({
    questionId: a.questionId,
    value: a.value,
  }));

  const node = getNextNode(answers);
  const resBody: NextResponseBody = { node };

  return NextResponse.json(resBody);
}
