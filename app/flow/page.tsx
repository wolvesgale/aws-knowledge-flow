// app/flow/page.tsx
'use client';

import { useState } from 'react';

type QuestionOption = {
  value: string;
  label: string;
};

type Question = {
  id: string;
  text: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options?: QuestionOption[];
};

type Service = {
  id: string;
  name: string;
  description?: string;
  docsUrl?: string;
  tags?: string[];
};

type FlowNode =
  | {
      type: 'question';
      question: Question;
    }
  | {
      type: 'result';
      summary: string;
      services: Service[];
    };

type HistoryItem = {
  question: Question;
  answer: string | string[];
};

type Goal = {
  id: string;
  title: string;
  description?: string;
};

// ひとまずスタブ（あとでAPI連携に差し替え）
const MOCK_GOALS: Goal[] = [
  {
    id: 'goal_csv_tool',
    title: 'CSV変換ツールを実装したい',
    description: '既存のCSVを整形・加工するツール',
  },
  {
    id: 'goal_ecs_replace',
    title: 'ECSで既存システムをリプレースしたい',
    description: 'オンプレ/EC2からECS(Fargate)への移行',
  },
];

// これもスタブ：最初の質問と、次のノードを決める簡易ロジック
const firstQuestion: Question = {
  id: 'q_env',
  text: 'どのような環境で利用しますか？',
  type: 'single_choice',
  options: [
    { value: 'dev', label: '検証・開発環境が中心' },
    { value: 'prod', label: '本番システムとして使いたい' },
  ],
};

function getNextNode(history: HistoryItem[]): FlowNode {
  if (history.length === 0) {
    return { type: 'question', question: firstQuestion };
  }

  // 2問目の仮質問
  if (history.length === 1) {
    const q2: Question = {
      id: 'q_db',
      text: 'データベースはどのように利用する予定ですか？',
      type: 'single_choice',
      options: [
        { value: 'rds', label: 'RDSなどのマネージドDB' },
        { value: 'ddb', label: 'DynamoDBなどのNoSQL' },
        { value: 'none', label: '今回はDBを使わない' },
      ],
    };
    return { type: 'question', question: q2 };
  }

  // 3問目まで答えたら、仮の結果を出す
  return {
    type: 'result',
    summary:
      '回答内容に基づき、仮の提案結果を表示しています（後でLambda＋Notion連携に差し替え）。',
    services: [
      {
        id: 'svc_ecs',
        name: 'Amazon ECS on Fargate',
        description: 'コンテナ本番環境向けのマネージドコンテナ実行基盤です。',
        docsUrl: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/',
        tags: ['Compute', 'コンテナ'],
      },
      {
        id: 'svc_rds',
        name: 'Amazon RDS',
        description: 'リレーショナルデータベースをフルマネージドで提供します。',
        docsUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/',
        tags: ['Database', 'RDB'],
      },
    ],
  };
}

export default function FlowPage() {
  const [goals] = useState<Goal[]>(MOCK_GOALS);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentNode, setCurrentNode] = useState<FlowNode | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<string | string[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const startFlow = (goalId: string) => {
    setSelectedGoalId(goalId);
    setHistory([]);
    setError(null);
    const first = getNextNode([]);
    setCurrentNode(first);
    setPendingAnswer(null);
  };

  const handleNext = () => {
    if (!currentNode || currentNode.type !== 'question') return;
    if (pendingAnswer == null || pendingAnswer === '') {
      setError('回答を入力してください');
      return;
    }

    const newHistory: HistoryItem[] = [
      ...history,
      { question: currentNode.question, answer: pendingAnswer },
    ];
    setHistory(newHistory);
    setError(null);
    setPendingAnswer(null);

    const next = getNextNode(newHistory);
    setCurrentNode(next);
  };

  const handleRestart = () => {
    setSelectedGoalId(null);
    setHistory([]);
    setCurrentNode(null);
    setPendingAnswer(null);
    setError(null);
  };

  const renderCurrentNode = () => {
    if (!selectedGoalId) {
      return (
        <div className="p-4 text-sm text-slate-400">
          左の「やりたいこと」からゴールを選択してください。
        </div>
      );
    }

    if (!currentNode) {
      return (
        <div className="p-4 text-sm text-slate-400">
          最初の質問を読み込んでいます…
        </div>
      );
    }

    if (currentNode.type === 'question') {
      const q = currentNode.question;
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-50">{q.text}</h2>

          {q.type === 'single_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                >
                  <input
                    type="radio"
                    className="h-4 w-4"
                    name={q.id}
                    value={opt.value}
                    checked={pendingAnswer === opt.value}
                    onChange={(e) => setPendingAnswer(e.target.value)}
                  />
                  <span className="text-slate-100">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'text' && (
            <textarea
              className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-400"
              rows={4}
              value={(pendingAnswer as string) ?? ''}
              onChange={(e) => setPendingAnswer(e.target.value)}
              placeholder="自由記述で回答を入力してください"
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              次へ
            </button>
          </div>
        </div>
      );
    }

    // result
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">
          提案結果（Services &amp; Solutions）
        </h2>
        <p className="text-sm text-slate-300">{currentNode.summary}</p>

        <div className="space-y-3">
          {currentNode.services.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-50">
                  {s.name}
                </h3>
                {s.tags && s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {s.description && (
                <p className="mt-1 text-xs text-slate-300">{s.description}</p>
              )}
              {s.docsUrl && (
                <a
                  href={s.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-medium text-amber-300 hover:text-amber-200 hover:underline"
                >
                  公式ドキュメントを開く
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            className="text-xs text-slate-400 underline"
            onClick={handleRestart}
          >
            別のゴールからやり直す
          </button>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (history.length === 0) {
      return (
        <p className="text-xs text-slate-400">
          これまでの質問と回答の履歴がここに表示されます。
        </p>
      );
    }

    return (
      <ol className="space-y-3 text-xs">
        {history.map((h, idx) => (
          <li key={h.question.id} className="relative pl-4">
            <div className="absolute left-0 top-1 h-full w-px bg-slate-800" />
            <div className="rounded-md bg-slate-900 p-2">
              <div className="mb-1 text-[11px] font-semibold text-slate-400">
                Q{idx + 1}
              </div>
              <div className="text-slate-100">{h.question.text}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                回答:{' '}
                {Array.isArray(h.answer)
                  ? h.answer.join(', ')
                  : (h.answer as string)}
              </div>
            </div>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <div className="min-h-[70vh] rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-slate-100 shadow-xl">
      <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h1 className="text-sm font-semibold text-slate-50">
            ナレッジフロー（AWSナビゲーション）
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-400">
            「やりたいこと」と前提条件から、推奨される AWS サービスをナビゲートします。
          </p>
        </div>
        {selectedGoalId && (
          <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-300">
            Goal: {selectedGoalId}
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* 左：Goal一覧 */}
        <aside className="flex w-1/4 flex-col rounded-lg border border-slate-800 bg-slate-900 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-100">
            やりたいこと（Goal）
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto text-xs">
            {goals.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => startFlow(g.id)}
                className={`w-full rounded-md border px-3 py-2 text-left ${
                  selectedGoalId === g.id
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium">{g.title}</div>
                {g.description && (
                  <div className="mt-1 text-[11px] text-slate-400">
                    {g.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* 中央：現在のノード */}
        <main className="flex w-2/4 flex-col rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex-1 overflow-y-auto">{renderCurrentNode()}</div>
          {error && (
            <div className="mt-2 text-xs text-red-400">エラー: {error}</div>
          )}
        </main>

        {/* 右：履歴（ツリービュー的表示） */}
        <aside className="flex w-1/4 flex-col rounded-lg border border-slate-800 bg-slate-900 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-100">
            分岐履歴（ツリービュー）
          </h2>
          <div className="flex-1 overflow-y-auto">{renderHistory()}</div>
        </aside>
      </div>
    </div>
  );
}
