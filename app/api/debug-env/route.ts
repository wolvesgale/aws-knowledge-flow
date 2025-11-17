// app/api/debug-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Notion 関連だけ抜き出して返す
  const keys = Object.keys(process.env).filter((k) => k.includes('NOTION'));

  const envSnapshot: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = process.env[key];
    // セキュリティ的に全部は返さず、先頭だけ
    envSnapshot[key] = value
      ? `${value.slice(0, 5)}... (len=${value.length})`
      : undefined;
  }

  return NextResponse.json(
    {
      envKeys: keys,
      envSnapshot,
    },
    { status: 200 },
  );
}
