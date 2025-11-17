// app/flow/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Question, Service, FlowNode } from '../../lib/flow-logic';

type HistoryItem = {
  question: Question;
  answer: string | string[];
};

type Goal = {
  id: string;
  title: string;
  description?: string;
};

export default function FlowPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentNode, setCurrentNode] = useState<FlowNode | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<string | string[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingGoals, setLoadingGoals] = useState(false);

  // ▼ ゴール一覧を API から取得
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoadingGoals(true);
        const res = await fetch('/api/goals');
        if (!res.ok) {
          throw new Error('failed to fetch goals');
        }
        const data = await res.json();
        setGoals(data.goals ?? []);
      } catch (e) {
        console.error(e);
        setError('ゴール一覧の取得に失敗しました');
      } finally {
        setLoadingGoals(false);
      }
    };

    fetchGoals();
  }, []);

  const startFlow = async (goalId: string) => {
    setSelectedGoalId(goalId);
    setHistory([]);
    setError(null);
    setPendingAnswer(null);
    setCurrentNode(null);

    try {
      const res = await fetch('/api/flow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      if (!res.ok) {
        throw new Error('failed to start flow');
      }
      const data = await res.json();
      setCurrentNode(data.node as FlowNode);
    } catch (e) {
      console.error(e);
      setError('フロー開始時にエラーが発生しました');
    }
  };

  const handleNext = async () => {
    if (!currentNode || currentNode.type !== 'question') return;
    if (!selectedGoalId) return;

    if (pendingAnswer == null || pendingAnswer === '') {
      setError('回答を入力してください');
      return;
    }

    const newHistory: HistoryItem[] = [
      ...history,
      { question: currentNode.question, answer: pendingAnswer },
    ];

    // クライアント側の履歴はUI表示用として保持
    setHistory(newHistory);
    setError(null);

    const answersPayload = newHistory.map((h) => ({
      questionId: h.question.id,
      value: h.answer,
    }));

    setPendingAnswer(null);

    try {
      const res = await fetch('/api/flow/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoalId,
          answers: answersPayload,
        }),
      });
      if (!res.ok) {
        throw new Error('failed to get next node');
      }
      const data = await res.json();
      setCurrentNode(data.node as FlowNode);
    } catch (e) {
      console.error(e);
      setError('次のステップ取得時にエラーが発生しました');
    }
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

          {q.type === 'single_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
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

          {error && (
            <div className="text-xs text-red-400">エラー: {error}</div>
          )}
        </div>
      );
    }

    // result
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">
          提案結果（Services &amp; Solutions）
        </h2>
        <p className="text-sm text-slate-300">{currentNode.summary}</p>

        <div className="space-y-3">
          {currentNode.services.map((s: Service) => (
            <div
              key={s.id}
              className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">
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
                  className="mt-2 inline-flex text-xs font-medium text-amber-300 hover:underline"
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
            <div className="absolute left-0 top-1 h-full w-px bg-slate-700" />
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
    <div className="flex h-screen gap-4 bg-slate-950 p-4 text-slate-100">
      {/* 左：Goal一覧 */}
      <aside className="flex w-1/4 flex-col rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-100">
          やりたいこと（Goal）
        </h2>
        <div className="flex-1 space-y-2 overflow-y-auto text-xs">
          {loadingGoals && (
            <div className="text-[11px] text-slate-500">読み込み中…</div>
          )}
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
      <main className="flex w-2/4 flex-col rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">
            ナレッジフロー（AWSナビゲーション）
          </h1>
          {selectedGoalId && (
            <span className="rounded-full border border-amber-400 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
              Goal: {selectedGoalId}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">{renderCurrentNode()}</div>

        {error && (
          <div className="mt-2 text-xs text-red-400">エラー: {error}</div>
        )}
      </main>

      {/* 右：履歴（ツリービュー的表示） */}
      <aside className="flex w-1/4 flex-col rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-100">
          分岐履歴（ツリービュー）
        </h2>
        <div className="flex-1 overflow-y-auto">{renderHistory()}</div>
      </aside>
    </div>
  );
}
