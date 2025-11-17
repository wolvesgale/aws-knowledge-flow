// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AWS Knowledge Flow Console',
  description: 'やりたいことから辿れる AWS ナビゲーションコンソール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}
      >
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {/* 上部ナビ（AWS コンソール風） */}
          <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-gradient-to-tr from-orange-500 to-amber-300 text-[11px] font-bold text-slate-950">
                    KF
                  </span>
                  <div className="leading-tight">
                    <div className="font-semibold tracking-wide text-amber-400">
                      AWS Knowledge Flow
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ナレッジフロー / AWS ナビゲーションコンソール
                    </div>
                  </div>
                </div>
                <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                  リージョン: ap-northeast-1 (Tokyo)
                </span>
              </div>

              <nav className="flex items-center gap-4 text-[11px] text-slate-300">
                <a href="/" className="hover:text-white">
                  ホーム
                </a>
                <a href="/flow" className="hover:text-white">
                  フロー
                </a>
              </nav>
            </div>
          </header>

          {/* コンテンツ領域 */}
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
