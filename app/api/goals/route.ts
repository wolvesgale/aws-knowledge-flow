// app/api/goals/route.ts
import { NextResponse } from 'next/server';
import { notion, NOTION_DB_GOALS } from '../../../lib/notion';

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
    // Notion クライアント or DB ID が無いとき → ログを出してスタブ返却
if (!notion || !NOTION_DB_GOALS) {
  console.error('[api/goals] Missing env in runtime', {
    hasNotion: !!notion,
    dbId: NOTION_DB_GOALS,
    secretPrefix: process.env.NOTION_SECRET?.slice(0, 8) ?? null,
  });

  return NextResponse.json(
    {
      goals: FALLBACK_GOALS,
      source: 'fallback_env',
      debug: {
        hasNotion: !!notion,
        hasDbId: !!NOTION_DB_GOALS,
        secretPrefix: process.env.NOTION_SECRET?.slice(0, 8) ?? null,
      },
    },
    { status: 200 },
  );
}


    // Notion DB から Goal 一覧を取得
const res = await notion.databases.query({
  database_id: NOTION_DB_GOALS,
  sorts: [
    {
      property: 'Goal ID',
      direction: 'ascending',
    },
  ],
});


// app/api/goals/route.ts の Notion から goals を組み立てる部分

const goals = res.results.map((page) => {
  // 1. タイトル（Goal Name）
  const titleProp: any = (page as any).properties['Goal Name'];
  const title =
    titleProp?.type === 'title' && titleProp.title?.length > 0
      ? titleProp.title[0].plain_text
      : 'No title';

  // 2. 説明（Description）※あれば
  const descProp: any = (page as any).properties['Description'];
  const description =
    descProp?.type === 'rich_text' && descProp.rich_text?.length > 0
      ? descProp.rich_text[0].plain_text
      : '';

  // 3. 並び順（Goal ID）※必要なら number として読む
  const orderProp: any = (page as any).properties['Goal ID'];
  const order =
    orderProp?.type === 'number' && typeof orderProp.number === 'number'
      ? orderProp.number
      : 0;

  return {
    id: page.id,
    title,
    description,
    order,
  };
});


    return NextResponse.json(
      {
        goals,
        source: 'notion', // デバッグ用
        count: goals.length,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[api/goals] Notion query error', err);

    // エラー時もスタブで動作だけはさせる
    return NextResponse.json(
      {
        goals: FALLBACK_GOALS,
        source: 'fallback_error', // デバッグ用
      },
      { status: 200 },
    );
  }
}
