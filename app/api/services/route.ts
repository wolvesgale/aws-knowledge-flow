// app/api/services/route.ts
import { NextResponse } from 'next/server';
import { notion, NOTION_DB_SERVICES } from '../../../lib/notion';

type Service = {
  id: string;
  name: string;
  description?: string;
  docsUrl?: string;
  tags?: string[];
};

// Notion が使えないとき用のスタブ
const FALLBACK_SERVICES: Service[] = [
  {
    id: 'svc_ecs',
    name: 'Amazon ECS on Fargate',
    description: 'コンテナ本番環境向けのマネージドコンテナ実行基盤です。',
    docsUrl:
      'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/',
    tags: ['Compute', 'コンテナ'],
  },
  {
    id: 'svc_rds',
    name: 'Amazon RDS',
    description: 'リレーショナルデータベースをフルマネージドで提供します。',
    docsUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/',
    tags: ['Database', 'RDB'],
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('goalId') ?? undefined;

    // env 不足時は 200 + スタブで返す
    if (!notion || !NOTION_DB_SERVICES) {
      console.error('[api/services] Missing env in runtime', {
        hasNotion: !!notion,
        dbId: NOTION_DB_SERVICES,
        secretPrefix: process.env.NOTION_SECRET?.slice(0, 8) ?? null,
      });

      return NextResponse.json(
        {
          services: FALLBACK_SERVICES,
          source: 'fallback_env',
          debug: {
            hasNotion: !!notion,
            hasDbId: !!NOTION_DB_SERVICES,
            secretPrefix: process.env.NOTION_SECRET?.slice(0, 8) ?? null,
          },
        },
        { status: 200 },
      );
    }

    // goalId フィルタは一旦外して、素のクエリが通るか確認
    const res = await notion.databases.query({
      database_id: NOTION_DB_SERVICES,
      // goalId が string なので filter の条件がおかしい可能性は消しておく
      // filter は一時的にコメントアウト
      // filter: goalId
      //   ? {
      //       property: 'Related Goals',
      //       relation: { contains: goalId },
      //     }
      //   : undefined,
      sorts: [
        {
          property: 'Service ID',
          direction: 'ascending',
        },
      ],
    });

    const services: Service[] = res.results.map((page: any) => {
      const props = page.properties;

      const nameProp = props['Service Name'];
      const name =
        nameProp?.type === 'title' && nameProp.title?.length > 0
          ? nameProp.title[0].plain_text
          : 'No name';

      const summaryProp = props['Summary'];
      const description =
        summaryProp?.type === 'rich_text' &&
        summaryProp.rich_text?.length > 0
          ? summaryProp.rich_text[0].plain_text
          : '';

      const docsProp = props['Official Docs'];
      const docsUrl =
        docsProp?.type === 'url' && docsProp.url ? docsProp.url : undefined;

      const tagsProp = props['Tags'];
      const tags =
        tagsProp?.type === 'multi_select'
          ? tagsProp.multi_select.map((t: any) => t.name)
          : [];

      return {
        id: page.id,
        name,
        description,
        docsUrl,
        tags,
      };
    });

    return NextResponse.json(
      {
        services,
        source: 'notion',
        count: services.length,
      },
      { status: 200 },
    );
  } catch (err: any) {
    // ★ ここでエラーの中身もレスポンスに含める
    console.error('[api/services] Notion query error', err);

    return NextResponse.json(
      {
        services: FALLBACK_SERVICES,
        source: 'fallback_error',
        error: err?.body ?? err?.message ?? String(err),
      },
      { status: 200 },
    );
  }
}
