// app/api/flow/start/route.ts
import { NextResponse } from 'next/server';
import { getNextNode, type FlowNode, type Answer } from '../../../../lib/flow-logic';

type StartRequestBody = {
  goalId?: string;
};

type StartResponseBody = {
  node: FlowNode;
};

export async function POST(req: Request) {
  let body: StartRequestBody;
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

  // 今は goalId によらず共通ロジック
  const answers: Answer[] = [];
  const node = getNextNode(answers);

  const resBody: StartResponseBody = { node };
  return NextResponse.json(resBody);
}
