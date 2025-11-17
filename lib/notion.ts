// lib/notion.ts
import { Client } from '@notionhq/client';

const secret = process.env.NOTION_SECRET;
export const NOTION_DB_GOALS = process.env.NOTION_DATABASE_GOALS_ID ?? '';
export const NOTION_DB_SERVICES =
  process.env.NOTION_DATABASE_SERVICES_ID ?? '';
export const NOTION_DB_QUESTIONS =
  process.env.NOTION_DATABASE_QUESTIONS_ID ?? '';

export const notion = secret
  ? new Client({ auth: secret })
  : null;
