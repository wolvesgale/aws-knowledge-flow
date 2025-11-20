// lib/flow-logic.ts
import { decideNextNode, type RoutingRule } from './routing';

export type QuestionOption = {
  value: string;
  label: string;
};

export type Question = {
  id: string;
  text: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options?: QuestionOption[];
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  docsUrl?: string;
  tags?: string[];
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
};

export type FlowNode =
  | {
      type: 'question';
      question: Question;
    }
  | {
      type: 'result';
      summary: string;
      services: Service[];
      // ゴール情報も必要ならここに載せる（page.tsx では使っていないので optional）
      goals?: Goal[];
    };

// page.tsx 側と同じ履歴型をここでも定義しておく
export type HistoryItem = {
  question: Question;
  answer: string | string[];
};
export type FlowHistoryItem = HistoryItem;

// Routing Rules を /api/routing から取得
async function fetchRoutingRules(): Promise<RoutingRule[]> {
  try {
    const res = await fetch('/api/routing');
    if (!res.ok) {
      console.error('fetchRoutingRules failed', res.status);
      return [];
    }
    const json = await res.json();
    return (json.rules ?? []) as RoutingRule[];
  } catch (err) {
    console.error('fetchRoutingRules error', err);
    return [];
  }
}

// Questions を /api/questions から取得
async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch('/api/questions');
  if (!res.ok) {
    console.error('fetchQuestions failed', res.status);
    return [];
  }
  const json = await res.json();
  return (json.questions ?? []) as Question[];
}

// Goals を /api/goals から取得
async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch('/api/goals');
  if (!res.ok) {
    console.error('fetchGoals failed', res.status);
    return [];
  }
  const json = await res.json();
  return (json.goals ?? []) as Goal[];
}

// ★ Routing Rules ベースの getNextNode
export async function getNextNode(
  history: HistoryItem[],
): Promise<FlowNode | null> {
  // 初回（履歴なし）は Questions DB の先頭を返す
  if (!history || history.length === 0) {
    const questions = await fetchQuestions();
    if (questions.length === 0) return null;

    return {
      type: 'question',
      question: questions[0],
    };
  }

  // 直近の質問と回答
  const last = history[history.length - 1];
  const currentQuestionId = last.question.id;
  const answer = last.answer;

  // Routing Rules を取得して判定
  const rules = await fetchRoutingRules();
  const result = decideNextNode(currentQuestionId, answer, rules);

  if (!result) return null;

  // 次が Question の場合
  if (result.type === 'question') {
    const questions = await fetchQuestions();
    const nextQ = questions.find((q) => q.id === result.questionId);
    if (!nextQ) return null;

    return {
      type: 'question',
      question: nextQ,
    };
  }

  // 次が Goal の場合
  if (result.type === 'goal') {
    const goals = await fetchGoals();
    const matched = goals.filter((g) => result.goalIds.includes(g.id));

    return {
      type: 'result',
      summary: 'ルールベース判断での提案結果です',
      // Services は page.tsx 側で /api/services を叩いて上書きする
      services: [],
      goals: matched,
    };
  }

  // End などその他
  return null;
}
