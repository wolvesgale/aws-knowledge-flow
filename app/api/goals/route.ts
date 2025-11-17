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
      sorts: [
        {
          property: 'Goal ID', // Notion側のプロパティ名に合わせる
          direction: 'ascending',
        },
      ],
    });

    const goals: Goal[] = res.results
      .map((page: any) => {
        const props = page.properties;

        const titleProp = props['Name'] ?? props['Goal Name'];
        const descProp = props['Description'];

        const title =
          titleProp?.title?.[0]?.plain_text ??
          titleProp?.rich_text?.[0]?.plain_text ??
          'Untitled';

        const description =
          descProp?.rich_text?.[0]?.plain_text ?? undefined;

        const goalIdProp = props['Goal ID'];
        const goalId =
          goalIdProp?.rich_text?.[0]?.plain_text ??
          page.id.replace(/-/g, ''); // 保険

        return {
          id: goalId,
          title,
          description,
        } as Goal;
      })
      // 非表示フラグやStatusでフィルタしたかったらここで
      .filter(Boolean);

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
