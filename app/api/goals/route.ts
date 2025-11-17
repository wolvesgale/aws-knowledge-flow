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
    const res = await notion.databases.query({
      database_id: NOTION_DB_GOALS,
      // 並び順が必要になったら Notion 側に "Order" 数値プロパティを作り、
      // ここで sorts に追加する感じでOK
    });

    const goals: Goal[] = res.results.map((page: any) => {
      const props = page.properties;

      // タイトル系プロパティ（Name or Goal Name を優先）
      const titleProp = props['Name'] ?? props['Goal Name'];
      const title =
        titleProp?.title?.[0]?.plain_text ??
        titleProp?.rich_text?.[0]?.plain_text ??
        'Untitled';

      // 説明（Description があれば）
      const descProp = props['Description'];
      const description =
        descProp?.rich_text?.[0]?.plain_text ?? undefined;

      // Goal ID があればそれを使い、なければページIDをそのまま
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
  } catch (e) {
    console.error('Notion goals fetch error', e);
    return NextResponse.json(
      {
        error: {
          code: 'NOTION_ERROR',
          message: 'Notionからゴール一覧の取得に失敗しました。',
        },
      },
      { status: 500 },
    );
  }
}
