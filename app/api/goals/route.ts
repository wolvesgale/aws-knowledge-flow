// app/api/goals/route.ts
import { NextResponse } from 'next/server';
import { notion, NOTION_DB_GOALS } from '../../../lib/notion';

type Goal = {
  id: string;
  title: string;
  description?: string;
};

export async function GET() {
  try {
    // 1) 基本チェック
    if (!notion) {
      throw new Error('Notion client is not initialized (check NOTION_SECRET).');
    }
    if (!NOTION_DB_GOALS) {
      throw new Error(
        'NOTION_DATABASE_GOALS_ID is not set. Check your environment variables.',
      );
    }

    // 2) DB クエリ
    const res = await notion.databases.query({
      database_id: NOTION_DB_GOALS,
    });

    // 3) 結果をGoal型にマッピング
    const goals: Goal[] = res.results.map((page: any) => {
      const props = page.properties;

      // タイトル: "Name" か "Goal Name" を優先
      const titleProp = props['Name'] ?? props['Goal Name'];
      const title =
        titleProp?.title?.[0]?.plain_text ??
        titleProp?.rich_text?.[0]?.plain_text ??
        'Untitled';

      // 説明: "Description" があれば
      const descProp = props['Description'];
      const description =
        descProp?.rich_text?.[0]?.plain_text ?? undefined;

      // Goal ID: あればそれを使う / なければページID
      const goalIdProp = props['Goal ID'];
      const goalId =
        goalIdProp?.rich_text?.[0]?.plain_text ??
        page.id.replace(/-/g, '');

      return {
        id: goalId,
        title,
        description,
      };
    });

    return NextResponse.json({ goals });
  } catch (e: any) {
    // ここで Notion SDK のエラー詳細もログに出す
    console.error('Notion goals fetch error:', JSON.stringify(e, null, 2));

    return NextResponse.json(
      {
        error: {
          code: 'NOTION_ERROR',
          message: e?.message ?? 'Unknown Notion error',
          detail: e?.body ?? null,
        },
      },
      { status: 500 },
    );
  }
}
