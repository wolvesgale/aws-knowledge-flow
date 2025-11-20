// app/api/goals/route.ts
import { NextResponse } from 'next/server';
import { fetchGoalsFromNotion } from '../../../lib/notion';

type Goal = {
  id: string;
  title: string;
  description?: string;
};

// Notion が使えないときの保険（これまで使っていたスタブ）
const FALLBACK_GOALS: Goal[] = [
  {
    id: 'UC001',
    title: 'CSV変換ツールを実装したい',
    description: '既存のCSVを整形・加工するツール',
  },
  {
    id: 'UC002',
    title: 'ECSで既存システムをリプレースしたい',
    description: 'オンプレ/EC2からECS(Fargate)への移行',
  },
];

export async function GET() {
  try {
    // 👉 Notion 側のヘルパーに全部任せる
    const goals = await fetchGoalsFromNotion();

    // もし何らかの理由で空配列だった場合はスタブにフォールバック
    if (!goals || goals.length === 0) {
      return NextResponse.json(
        {
          goals: FALLBACK_GOALS,
          source: 'fallback_empty',
          count: FALLBACK_GOALS.length,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        goals,
        source: 'notion',
        count: goals.length,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[api/goals] Notion query error', err);

    // エラー時もスタブで動作だけはさせる
    return NextResponse.json(
      {
        goals: FALLBACK_GOALS,
        source: 'fallback_error',
        count: FALLBACK_GOALS.length,
      },
      { status: 200 },
    );
  }
}
