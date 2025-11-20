// app/api/flow/start/route.ts
import { NextResponse } from 'next/server';
import {
  getNextNode,
  type FlowNode,
  type FlowHistoryItem,
} from '../../../../lib/flow-logic';

type StartRequestBody = {
  history?: FlowHistoryItem[];
};

type StartResponseBody = {
  node: FlowNode | null;
};

export async function POST(req: Request) {
  const body = (await req.json()) as StartRequestBody;
  const history: FlowHistoryItem[] = body.history ?? [];

  // ★ Promise を返すので await が必要
  const node = await getNextNode(history);

  const resBody: StartResponseBody = { node };

  return NextResponse.json(resBody);
}
