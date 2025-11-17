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
      console.error('[api/goals] Notion client or DB ID missing', {
        hasNotion: !!notion,
        dbId: NOTION_DB_GOALS,
      });

      return NextResponse.json(
        {
          goals: FALLBACK_GOALS,
          source: 'fallback_env', // デバッグ用（画面側では未使用）
        },
        { status: 200 },
      );
    }

    // Notion DB から Goal 一覧を取得
    const res = await notion.databases.query({
      database_id: NOTION_DB_GOALS,
      sorts: [
        {
          property: 'Goal ID', // Notion 側のプロパティ名に合わせる
          direction: 'ascending',
        },
      ],
    });

    const goals: Goal[] = res.results.map((page: any) => {
      const props = page.properties;

      const titleProp = props['Goal Name'];
      const descProp = props['Description'];
      const idProp = props['Goal ID'];

      const title =
        titleProp?.title?.[0]?.plain_text ??
        titleProp?.rich_text?.[0]?.plain_text ??
        'No title';

      const description =
        descProp?.rich_text?.[0]?.plain_text ??
        descProp?.title?.[0]?.plain_text ??
        undefined;

      const id =
        idProp?.rich_text?.[0]?.plain_text ??
        idProp?.title?.[0]?.plain_text ??
        page.id;

      return { id, title, description };
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
