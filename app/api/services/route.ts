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

    // Goal が指定されていれば Related Goals で絞り込み
    const filter =
      goalId != null
        ? {
            property: 'Related Goals',
            relation: {
              contains: goalId,
            },
          }
        : undefined;

    const res = await notion.databases.query({
      database_id: NOTION_DB_SERVICES,
      filter,
      sorts: [
        {
          property: 'Service ID', // ← Notion 側と完全一致させる
          direction: 'ascending',
        },
      ],
    });

    const services: Service[] = res.results.map((page: any) => {
      const props = page.properties;

      // ★ 列名に依存せず「title 型のプロパティ」を自動検出
      const titleProp: any = Object.values(props).find(
        (p: any) => p && p.type === 'title',
      );

      const name =
        titleProp?.title && Array.isArray(titleProp.title) && titleProp.title.length > 0
          ? titleProp.title[0].plain_text
          : 'No name';

      const summaryProp = props['Summary'];
      const description =
        summaryProp?.type === 'rich_text' &&
        Array.isArray(summaryProp.rich_text) &&
        summaryProp.rich_text.length > 0
          ? summaryProp.rich_text.map((t: any) => t.plain_text).join('')
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
    console.error('[api/services] Notion query error', err);

    // ここでも 500 ではなく 200 + スタブで返す
    return NextResponse.json(
      {
        services: FALLBACK_SERVICES,
        source: 'fallback_error',
        error:
          err?.message ??
          (typeof err === 'string' ? err : 'unknown_notions_error'),
      },
      { status: 200 },
    );
  }
}
