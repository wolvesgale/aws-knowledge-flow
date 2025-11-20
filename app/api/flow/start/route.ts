// app/api/flow/start/route.ts
import { NextResponse } from 'next/server';
import {
  getNextNode,
  type FlowNode,
  type FlowHistoryItem,
} from '../../../../lib/flow-logic';

type StartResponseBody = {
  node: FlowNode;
};

// 最初の質問を返すだけのエンドポイント
export async function GET() {
  // まだ履歴はないので空配列
  const history: FlowHistoryItem[] = [];

  const node = getNextNode(history);
  const resBody: StartResponseBody = { node };

  return NextResponse.json(resBody);
}
