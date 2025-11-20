// app/api/flow/next/route.ts
import { NextResponse } from 'next/server';
import {
  getNextNode,
  type FlowNode,
  type FlowHistoryItem, // ← ① 上で alias を復活させたのでこのまま使える
} from '../../../../lib/flow-logic';

type NextRequestBody = {
  history: FlowHistoryItem[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as NextRequestBody;

  // ★ getNextNode は Promise なので await する
  const next = await getNextNode(body.history);

  return NextResponse.json<{ node: FlowNode | null }>({
    node: next,
  });
}
