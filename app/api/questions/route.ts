// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { notion, NOTION_DB_QUESTIONS } from '../../../lib/notion';
import type { Question } from '../../../lib/flow-logic';

export async function GET() {
  try {
    if (!NOTION_DB_QUESTIONS) {
      throw new Error('NOTION_DB_QUESTIONS is not configured');
    }

    const res = await notion.databases.query({
      database_id: NOTION_DB_QUESTIONS,
      // まずは filter / sort なしでシンプルに（Notion側の並び順に従う）
      // 必要になったら OrderHint で sort を足す
    });

    const questions: Question[] = res.results.map((page: any) => {
      const props = page.properties;

      const qid =
        props.QID?.rich_text?.[0]?.plain_text ??
        props.QID?.title?.[0]?.plain_text ??
        page.id;

      const text =
        props.Question?.title?.[0]?.plain_text ??
        props.Question?.rich_text?.[0]?.plain_text ??
        '';

      const typeName: string =
        props.QuestionType?.select?.name ?? 'SingleSelect';

      let type: Question['type'];
      switch (typeName) {
        case 'MultiSelect':
          type = 'multi_choice';
          break;
        case 'Text':
          type = 'text';
          break;
        default:
          // YesNo / SingleSelect などは全部 single_choice 扱い
          type = 'single_choice';
          break;
      }

      const options =
        props.Choices?.multi_select?.map((c: any) => ({
          value: c.name,
          label: c.name,
        })) ?? [];

      return {
        id: qid,
        text,
        type,
        options: type === 'text' ? undefined : options,
      };
    });

    return NextResponse.json({
      questions,
      source: 'notion',
      count: questions.length,
    });
  } catch (err: any) {
    console.error('[api/questions] error', err);
    return NextResponse.json(
      {
        questions: [],
        source: 'error',
        error: err?.body ?? err?.message ?? String(err),
      },
      { status: 200 }, // フロントからは 500 にしない（fallback しやすくする）
    );
  }
}
