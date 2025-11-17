// app/page.tsx

export default function HomePage() {
  return (
    <div className="space-y-6 text-slate-100">
      {/* ヘッダーセクション */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              AWS Knowledge Flow コンソール
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              「やりたいこと」と「前提条件」から、最適な AWS サービスと学習リソースへ
              ナビゲートします。
            </p>
            <p className="mt-1 text-xs text-slate-400">
              ※ 現在はモックデータ（CSVツール / ECS リプレース）での PoC 版です。
              後続で Notion DB ＋ Lambda 連携に置き換えていきます。
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <a
              href="/flow"
              className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
            >
              ナレッジフローを開始
              <span className="text-xs">/flow</span>
            </a>
            <span className="text-[11px] text-slate-400">
              まずは「CSV変換ツール」や「ECSリプレース」のシナリオから体験できます。
            </span>
          </div>
        </div>
      </section>

      {/* カードグリッド */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* カード1：フロー概要 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            フローの概要
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            ユーザーは「やりたいこと（Goal）」を選択すると、その Goal
            に紐づく前提質問（Questions）が順番に表示されます。回答内容に応じて、最終的に
            Services &amp; Solutions が返される構造です。
          </p>
          <ul className="mt-3 list-inside list-disc text-xs text-slate-300">
            <li>Goal &gt; Questions &gt; Result の 3段構成</li>
            <li>分岐履歴は右ペインでツリー表示</li>
            <li>将来的にはユーザーごとのプロファイルも考慮</li>
          </ul>
        </div>

        {/* カード2：Notion 連携（スレB 側） */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Notion ナレッジ DB（スレッドB）
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Notion 側では、以下 3 つのデータベースを用意します。
          </p>
          <ul className="mt-3 list-inside list-disc text-xs text-slate-300">
            <li>User Goals：やりたいことの一覧</li>
            <li>Questions：前提条件の質問カタログ</li>
            <li>Services &amp; Solutions：AWSサービス＋ソリューション</li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">
            これらは Relation
            で紐づけるだけの「カタログ」として扱い、分岐ロジックは当面 Lambda
            / Route Handler 側で持ちます。
          </p>
        </div>

        {/* カード3：今後の拡張 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            今後の拡張ロードマップ
          </h2>
          <ul className="mt-2 list-inside list-disc text-xs text-slate-300">
            <li>Notion API 連携による動的な Goal / Question 取得</li>
            <li>/api/flow/start, /api/flow/next エンドポイントの実装</li>
            <li>ユーザーごとのプロファイル／既存環境を加味した初期絞り込み</li>
            <li>学習リソース（Docs / Workshop / Hands-on）へのリンク集約</li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">
            現時点では UI とホスティング基盤（Vercel &amp; Amplify）
            を先行で整備し、後続のナレッジ設計と連携をスレッドB側で進行します。
          </p>
        </div>
      </section>
    </div>
  );
}
