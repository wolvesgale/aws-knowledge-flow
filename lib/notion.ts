// lib/notion.ts
import { Client } from '@notionhq/client';

if (!process.env.NOTION_SECRET) {
  // Amplify / 本番でも必ず設定しておくこと
  throw new Error('NOTION_SECRET is not set');
}

export const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

export const NOTION_DB_GOALS = process.env.NOTION_DATABASE_GOALS_ID!;
export const NOTION_DB_SERVICES = process.env.NOTION_DATABASE_SERVICES_ID!;
