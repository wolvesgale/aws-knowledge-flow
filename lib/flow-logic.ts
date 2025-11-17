// lib/flow-logic.ts

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

export type FlowNode =
  | {
      type: 'question';
      question: Question;
    }
  | {
      type: 'result';
      summary: string;
      services: Service[];
    };

export type Answer = {
  questionId: string;
  value: string | string[];
};

// ★ ここは今まで page.tsx にいた firstQuestion / getNextNode を移植
const firstQuestion: Question = {
  id: 'q_env',
  text: 'どのような環境で利用しますか？',
  type: 'single_choice',
  options: [
    { value: 'dev', label: '検証・開発環境が中心' },
    { value: 'prod', label: '本番システムとして使いたい' },
  ],
};

export function getNextNode(answers: Answer[]): FlowNode {
  // answer の数だけ見て、これまでと同じ挙動を再現する簡易ロジック

  if (answers.length === 0) {
    // 最初の質問
    return { type: 'question', question: firstQuestion };
  }

  if (answers.length === 1) {
    // 2問目の仮質問
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

  // 3問目以降 → 結果を返す（今は固定）
  const services: Service[] = [
    {
      id: 'svc_ecs',
      name: 'Amazon ECS on Fargate',
      description: 'コンテナ本番環境向けのマネージドコンテナ実行基盤です。',
      docsUrl:
        'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/',
      tags: ['Compute', 'コンテナ'],
    },
    {
      id: 'svc_rds',
      name: 'Amazon RDS',
      description: 'リレーショナルデータベースをフルマネージドで提供します。',
      docsUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/',
      tags: ['Database', 'RDB'],
    },
  ];

  return {
    type: 'result',
    summary:
      '回答内容に基づき、仮の提案結果を表示しています（後でLambda＋Notion連携に差し替え）。',
    services,
  };
}

/**
 * ★ 将来 Notion を使うとき
 *
 * - answers を見て Notion から次の Question を取ってくる
 * - もしくは Services & Solutions DB から結果を組み立てる
 *
 * という処理を、このファイル内の getNextNode を書き換えるだけで済む。
 */
