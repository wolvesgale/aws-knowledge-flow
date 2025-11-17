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
  | { type: 'question'; question: Question }
  | { type: 'result'; summary: string; services: Service[] };

type HistoryItem = {
  question: Question;
  answer: string | string[];
};

type Goal = {
  id: string;
  title: string;
  description?: string;
};

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

  if (history.length === 1) {
    return {
      type: 'question',
      question: {
        id: 'q_db',
        text: 'データベースはどのように利用する予定ですか？',
        type: 'single_choice',
        options: [
          { value: 'rds', label: 'RDSなどのマネージドDB' },
          { value: 'ddb', label: 'DynamoDBなどのNoSQL' },
          { value: 'none', label: '今回はDBを使わない' },
        ],
      },
    };
  }

  return {
    type: 'result',
    summary: '回答内容に基づき、仮の提案結果を表示しています。',
    services: [
      {
        id: 'svc_ecs',
        name: 'Amazon ECS on Fargate',
        description: 'コンテナ本番環境向けのマネージド実行環境。',
        docsUrl:
          'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/',
        tags: ['Compute', 'コンテナ'],
      },
      {
        id: 'svc_rds',
        name: 'Amazon RDS',
        description: 'リレーショナルデータベースのフルマネージドサービス。',
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

    const newHistory = [
      ...history,
      { question: currentNode.question, answer: pendingAnswer },
    ];

    setHistory(newHistory);
    setError(null);
    setPendingAnswer(null);
    setCurrentNode(getNextNode(newHistory));
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
          <h2 className="text-lg font-semibold text-slate-100">{q.text}</h2>

          {q.type === 'single_choice' && (
            <div className="space-y-2">
              {q.options!.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-750"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.value}
                    checked={pendingAnswer === opt.value}
                    onChange={(e) => setPendingAnswer(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate-100">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
            >
              次へ
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-400">エラー: {error}</div>
          )}
        </div>
      );
    }

    // --- 結果画面 ---
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">
          提案結果（Services &amp; Solutions）
        </h2>
        <p className="text-sm text-slate-300">{currentNode.summary}</p>

        <div className="space-y-3">
          {currentNode.services.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">
                  {s.name}
                </h3>

                {s.tags && (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200"
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
                  className="mt-2 inline-flex text-xs font-medium text-amber-300 hover:underline"
                  target="_blank"
                >
                  公式ドキュメントを開く
                </a>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleRestart}
          className="text-xs text-slate-400 underline"
        >
          別のゴールからやり直す
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-screen gap-4 bg-slate-900 p-4 text-slate-100">
      {/* 左：ゴール一覧 */}
      <aside className="flex w-1/4 flex-col rounded-lg border border-slate-700 bg-slate-800 p-3">
        <h2 className="mb2 text-sm font-semibold text-slate-200">
          やりたいこと（Goal）
        </h2>

        <div className="flex-1 space-y-2 overflow-y-auto text-xs">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => startFlow(g.id)}
              className={`w-full rounded-md border px-3 py-2 text-left ${
                selectedGoalId === g.id
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-750'
              }`}
            >
              <div className="font-medium">{g.title}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                {g.description}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* 中央：質問 or 結果 */}
      <main className="flex w-2/4 flex-col rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-200">
            ナレッジフロー（AWSナビゲーション）
          </h1>

          {selectedGoalId && (
            <span className="rounded-full border border-amber-400 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
              Goal: {selectedGoalId}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">{renderCurrentNode()}</div>
      </main>

      {/* 右：履歴 */}
      <aside className="flex w-1/4 flex-col rounded-lg border border-slate-700 bg-slate-800 p-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">
          分岐履歴（ツリービュー）
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 text-xs">
          {history.length === 0 ? (
            <p className="text-slate-400">
              これまでの質問と回答の履歴がここに表示されます。
            </p>
          ) : (
            history.map((h, idx) => (
              <div key={idx} className="rounded-md bg-slate-900 p-2">
                <div className="text-[11px] font-semibold text-slate-400">
                  Q{idx + 1}
                </div>
                <div className="text-slate-100">{h.question.text}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  回答:{' '}
                  {Array.isArray(h.answer)
                    ? h.answer.join(', ')
                    : h.answer}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
