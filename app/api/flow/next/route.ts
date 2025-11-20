// app/api/flow/next/route.ts
import { NextResponse } from 'next/server';
import {
  getNextNode,
  type FlowNode,
  type FlowHistoryItem,
} from '../../../../lib/flow-logic';

type NextRequestBody = {
  goalId?: string;
  answers?: {
    questionId: string;
    value: string | string[];
  }[];
};

type NextResponseBody = {
  node: FlowNode;
};

export async function POST(req: Request) {
  let body: NextRequestBody;

  try {
    body = (await req.json()) as NextRequestBody;
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const answers = body.answers ?? [];

  // Answer[] → FlowHistoryItem[] に変換
  const history: FlowHistoryItem[] = answers.map((a) => ({
    // サーバー側では質問文までは不要なので最低限のスタブでOK
    question: {
      id: a.questionId,
      text: '',
      type: 'single_choice',
      options: [],
    },
    answer: a.value,
  }));

  const node = getNextNode(history);
  const resBody: NextResponseBody = { node };

  return NextResponse.json(resBody);
}
