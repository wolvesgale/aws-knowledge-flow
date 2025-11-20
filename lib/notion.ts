// lib/notion.ts

import { Client } from '@notionhq/client';

const NOTION_SECRET = process.env.NOTION_SECRET!;
const NOTION_DB_GOALS = process.env.NOTION_DATABASE_GOALS_ID!;
const NOTION_DB_QUESTIONS = process.env.NOTION_DATABASE_QUESTIONS_ID!;
const NOTION_DB_SERVICES = process.env.NOTION_DATABASE_SERVICES_ID!;

export const notion = new Client({ auth: NOTION_SECRET });

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

// 追加: Services
export async function fetchServicesFromNotion(goalId?: number) {
  const filter =
    typeof goalId === 'number'
      ? {
          property: 'Goal ID',
          number: { equals: goalId },
        }
      : undefined;

  const res = await notion.databases.query({
    database_id: NOTION_DB_SERVICES,
    filter,
    sorts: [{ property: 'Service Name', direction: 'ascending' }],
  });

  const services = res.results.map((page: any) => {
    const nameProp = page.properties['Service Name'];
    const name =
      nameProp?.type === 'title' && nameProp.title?.length > 0
        ? nameProp.title[0].plain_text
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

    const urlProp = page.properties['Docs URL'];
    const docsUrl =
      urlProp?.type === 'url' && typeof urlProp.url === 'string'
        ? urlProp.url
        : '';

    const tagsProp = page.properties['Tags'];
    const tags =
      tagsProp?.type === 'multi_select' && tagsProp.multi_select
        ? tagsProp.multi_select.map((t: any) => t.name)
        : [];

    return {
      id: page.id,
      goalId: goalIdValue,
      name,
      description,
      docsUrl,
      tags,
    };
  });

  return services;
}
