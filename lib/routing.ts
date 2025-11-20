// app/lib/routing.ts

export type MatchType = 'AnyOf' | 'AllOf' | 'NoneOf' | 'Always';

export type NextNodeType = 'Question' | 'Goal' | 'End';

export type RoutingRule = {
  id: string;
  fromQuestionId: string;   // Questions DB 側の QID or Notion ページID
  matchType: MatchType;
  matchChoices: string[];   // choice ラベル or choice ID
  nextNodeType: NextNodeType;
  nextQuestionId?: string;
  nextGoalIds?: string[];
  priority: number;
};

// ===== ここからルール判定ロジック =====

export function matchRule(
  rule: RoutingRule,
  answer: string | string[],
): boolean {
  if (rule.matchType === 'Always') return true;

  const answers = Array.isArray(answer) ? answer : [answer];

  const has = (choice: string) => answers.includes(choice);

  switch (rule.matchType) {
    case 'AnyOf':
      return rule.matchChoices.some(has);
    case 'AllOf':
      return rule.matchChoices.every(has);
    case 'NoneOf':
      return !rule.matchChoices.some(has);
    default:
      return false;
  }
}

export function decideNextNode(
  currentQuestionId: string,
  answer: string | string[],
  rules: RoutingRule[],
):
  | { type: 'question'; questionId: string }
  | { type: 'goal'; goalIds: string[] }
  | { type: 'end' }
  | null {
  const candidates = rules
    .filter((r) => r.fromQuestionId === currentQuestionId)
    .sort((a, b) => a.priority - b.priority);

  const matched = candidates.find((r) => matchRule(r, answer));
  if (!matched) return null;

  if (matched.nextNodeType === 'Question' && matched.nextQuestionId) {
    return { type: 'question', questionId: matched.nextQuestionId };
  }

  if (matched.nextNodeType === 'Goal') {
    return { type: 'goal', goalIds: matched.nextGoalIds ?? [] };
  }

  return { type: 'end' };
}
