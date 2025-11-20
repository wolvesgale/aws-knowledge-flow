// lib/notion.ts
import { Client } from '@notionhq/client';

const NOTION_SECRET = process.env.NOTION_SECRET!;

// --- Goals
export const NOTION_DB_GOALS =
  process.env.NOTION_DATABASE_GOALS_ID!;

// --- Questions
export const NOTION_DB_QUESTIONS =
  process.env.NOTION_DATABASE_QUESTIONS_ID!;

// --- Services（★これが今回追加した部分）
export const NOTION_DB_SERVICES =
  process.env.NOTION_DATABASE_SERVICES_ID!;

export const notion = new Client({
  auth: NOTION_SECRET,
});

// 既存: Goals
export async function fetchGoalsFromNotion() {
  const res = await notion.databases.query({
    database_id: NOTION_DB_GOALS,
    sorts: [{ property: 'Goal ID', direction: 'ascending' }],
  });

  const goals = res.results.map((page: any) => {
    const titleProp = page.properties['Goal Name'];
    const title =
      titleProp?.type === 'title' && titleProp.title?.length > 0
        ? titleProp.title[0].plain_text
        : 'No title';

    const orderProp = page.properties['Goal ID'];
    const order =
      orderProp?.type === 'number' && typeof orderProp.number === 'number'
        ? orderProp.number
        : 0;

    const descProp = page.properties['Description'];
    const description =
      descProp?.type === 'rich_text' && descProp.rich_text?.length > 0
        ? descProp.rich_text[0].plain_text
        : '';

    return {
      id: page.id,
      title,
      description,
      order,
    };
  });

  return goals;
}

// 追加: Questions
export async function fetchQuestionsFromNotion(goalId?: number) {
  const filter =
    typeof goalId === 'number'
      ? {
          property: 'Goal ID',
          number: { equals: goalId },
        }
      : undefined;

  const res = await notion.databases.query({
    database_id: NOTION_DB_QUESTIONS,
    filter,
    sorts: [{ property: 'Order', direction: 'ascending' }],
  });

  const questions = res.results.map((page: any) => {
    const qProp = page.properties['Question'];
    const text =
      qProp?.type === 'title' && qProp.title?.length > 0
        ? qProp.title[0].plain_text
        : 'No title';

    const descProp = page.properties['Description'];
    const description =
      descProp?.type === 'rich_text' && descProp.rich_text?.length > 0
        ? descProp.rich_text[0].plain_text
        : '';

    const goalIdProp = page.properties['Goal ID'];
    const goalIdValue =
      goalIdProp?.type === 'number' && typeof goalIdProp.number === 'number'
        ? goalIdProp.number
        : null;

    const orderProp = page.properties['Order'];
    const order =
      orderProp?.type === 'number' && typeof orderProp.number === 'number'
        ? orderProp.number
        : 0;

    const typeProp = page.properties['Type'];
    const qType =
      typeProp?.type === 'select' && typeProp.select
        ? typeProp.select.name
        : 'single_choice';

    const optionsProp = page.properties['Options'];
    const options =
      optionsProp?.type === 'multi_select' && optionsProp.multi_select
        ? optionsProp.multi_select.map((o: any) => o.name)
        : [];

    return {
      id: page.id,
      goalId: goalIdValue,
      order,
      text,
      description,
      type: qType,
      options,
    };
  });

  return questions;
}

// Services & Solutions DB からサービス一覧を取得
// goalId を指定すると「Related Goals にそのIDを含むもの」に絞り込み
export async function fetchServicesFromNotion(goalId?: string) {
  if (!NOTION_DB_SERVICES || !NOTION_SECRET) {
    console.warn('[notion] services DB env is missing');
    return [];
  }

  const filters: any[] = [];

  if (goalId) {
    // Related Goals (relation) に goalId を含む行だけ
    filters.push({
      property: 'Related Goals',
      relation: {
        contains: goalId,
      },
    });
  }

  const query: any = {
    database_id: NOTION_DB_SERVICES,
    sorts: [
      {
        property: 'Service ID',
        direction: 'ascending',
      },
    ],
  };

  if (filters.length === 1) {
    query.filter = filters[0];
  }

  const res = await notion.databases.query(query);

  return res.results.map((page: any) => {
    const props = page.properties ?? {};

    const nameProp = props['Service Name'];
    const summaryProp = props['Summary'];
    const docsProp = props['Official Docs'];
    const tagsProp = props['Tags'];

    const name =
      nameProp?.type === 'title' && nameProp.title?.length > 0
        ? nameProp.title[0].plain_text
        : 'No title';

    const description =
      summaryProp?.type === 'rich_text' &&
      summaryProp.rich_text?.length > 0
        ? summaryProp.rich_text[0].plain_text
        : '';

    const docsUrl =
      docsProp?.type === 'url' ? docsProp.url ?? undefined : undefined;

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
}
