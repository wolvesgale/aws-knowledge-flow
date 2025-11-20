// app/flow/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getNextNode,
  type Question,
  type QuestionOption,
  type Service,
  type FlowNode,
} from '../../lib/flow-logic';

type HistoryItem = {
  question: Question;
  answer: string | string[];
};

type Goal = {
  id: string;
  title: string;
  description?: string;
};

// フロント側の保険用スタブ（API がコケたとき用）
const FALLBACK_GOALS: Goal[] = [
  {
    id: 'UC001',
    title: 'CSV変換ツールを実装したい',
    description: '既存のCSVを整形・加工するツール',
  },
  {
    id: 'UC002',
    title: 'ECSで既存システムをリプレースしたい',
    description: 'オンプレ/EC2からECS(Fargate)への移行',
  },
];

export default function FlowPage() {
  // ★ ゴール一覧は API から取得。初期値はスタブ。
  const [goals, setGoals] = useState<Goal[]>(FALLBACK_GOALS);
  const [goalsSource, setGoalsSource] = useState<string | null>(null);
  const [goalsLoading, setGoalsLoading] = useState<boolean>(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentNode, setCurrentNode] = useState<FlowNode | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<string | string[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Services 用（Notion からの上書き）
  const [servicesOverride, setServicesOverride] = useState<Service[] | null>(
    null,
  );
  const [servicesSource, setServicesSource] = useState<string | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // --- Goals を /api/goals から取得 ---
  useEffect(() => {
    let cancelled = false;

    const fetchGoals = async () => {
      try {
        setGoalsLoading(true);
        setGoalsError(null);

        const res = await fetch('/api/goals');
        if (!res.ok) {
          throw new Error(`/api/goals failed: ${res.status}`);
        }

        const data = await res.json();
        const apiGoals: Goal[] = data.goals ?? [];

        if (!cancelled && apiGoals.length > 0) {
          setGoals(apiGoals);
          setGoalsSource(data.source ?? 'notion');
        }
      } catch (e: any) {
        console.error('failed to fetch goals', e);
        if (!cancelled) {
          setGoalsError(e?.message ?? String(e));
          // ここでは setGoals は呼ばず、初期の FALLBACK_GOALS をそのまま使う
          setGoalsSource('fallback_error');
        }
      } finally {
        if (!cancelled) {
          setGoalsLoading(false);
        }
      }
    };

    fetchGoals();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- 結果ノード表示時に Services を Notion から取得 ---
  useEffect(() => {
    if (!selectedGoalId || !currentNode || currentNode.type !== 'result') {
      setServicesOverride(null);
      setServicesSource(null);
      setServicesError(null);
      setServicesLoading(false);
      return;
    }

    let cancelled = false;

    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        setServicesError(null);

        const res = await fetch(
          `/api/services?goalId=${encodeURIComponent(selectedGoalId)}`,
        );
        if (!res.ok) {
          throw new Error(`/api/services failed: ${res.status}`);
        }

        const data = await res.json();
        const apiServices: Service[] = data.services ?? [];

        if (!cancelled && apiServices.length > 0) {
          setServicesOverride(apiServices);
          setServicesSource(data.source ?? 'notion');
        }
      } catch (e: any) {
        console.error('failed to fetch services', e);
        if (!cancelled) {
          setServicesError(e?.message ?? String(e));
          setServicesOverride(null);
          setServicesSource('fallback_error');
        }
      } finally {
        if (!cancelled) {
          setServicesLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, [selectedGoalId, currentNode]);

  const startFlow = (goalId: string) => {
    setSelectedGoalId(goalId);
    setHistory([]);
    setError(null);
    const first = getNextNode([]); // 空履歴から最初の質問を取得
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
          <h2 className="text-lg font-semibold text-slate-100">{q.text}</h2>

          {q.type === 'single_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt: QuestionOption) => (
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

    // result ノード（Services は Notion 取得があれば上書き）
    const servicesToShow =
      servicesOverride && servicesOverride.length > 0
        ? servicesOverride
        : currentNode.services;

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">
          提案結果（Services &amp; Solutions）
        </h2>

        <div className="text-[11px] text-slate-500">
          {servicesLoading && 'Notion からサービス一覧を取得中…'}
          {!servicesLoading &&
            servicesSource === 'notion' &&
            'Notion DB から取得しました'}
          {!servicesLoading &&
            servicesSource &&
            servicesSource !== 'notion' &&
            'Notion 取得に失敗したためスタブを表示しています'}
        </div>

        {servicesError && (
          <div className="text-[11px] text-red-400">
            Services取得エラー: {servicesError}
          </div>
        )}

        <p className="text-sm text-slate-300">{currentNode.summary}</p>

        <div className="space-y-3">
          {servicesToShow.map((s) => (
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
        <h2 className="mb-1 text-sm font-semibold text-slate-100">
          やりたいこと（Goal）
        </h2>

        {/* 取得状況のミニ表示 */}
        <div className="mb-2 text-[11px] text-slate-500">
          {goalsLoading && 'Notionからゴールを取得中…'}
          {!goalsLoading &&
            goalsSource === 'notion' &&
            'Notion DB から取得しました'}
          {!goalsLoading &&
            goalsSource &&
            goalsSource !== 'notion' &&
            'Notion取得に失敗したためスタブを表示しています'}
        </div>

        {goalsError && (
          <div className="mb-2 text-[11px] text-red-400">
            Error: {goalsError}
          </div>
        )}

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
