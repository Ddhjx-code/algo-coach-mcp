import type { Topic, Difficulty } from "../types.js";

export interface LeetCodeProblemStat {
  question_id: number;
  question__title: string;
  question__title_slug: string;
  frontend_question_id: number;
}

export interface LeetCodeProblemListResponse {
  num_total: number;
  stat_status_pairs: Array<{
    stat: LeetCodeProblemStat;
    difficulty: { level: 1 | 2 | 3 };
    paid_only: boolean;
  }>;
}

export interface LeetCodeQuestionDetail {
  questionId: string;
  questionFrontendId: string;
  title: string;
  translatedTitle?: string | null;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  content: string | null;
  translatedContent?: string | null;
  exampleTestcases: string;
  topicTags: Array<{ name: string; slug: string }>;
  hints: string[];
  codeSnippets: Array<{ lang: string; langSlug: string; code: string }> | null;
}

export interface CheckpointEntry {
  titleSlug: string;
  frontendId: number;
  comFetched: boolean;
  cnFetched: boolean;
  comContent: string | null;
  cnContent: string | null;
  cnTitle: string | null;
  comTitle: string | null;
  tags: Array<{ name: string; slug: string }>;
  difficulty: Difficulty;
  exampleTestcases: string | null;
  hints: string[];
  paidOnly: boolean;
  error?: string;
}

export interface CheckpointData {
  version: 1;
  createdAt: string;
  updatedAt: string;
  totalProblems: number;
  entries: Record<string, CheckpointEntry>;
}

export type Site = "com" | "cn";

export const DIFFICULTY_MAP: Record<number, Difficulty> = {
  1: "easy",
  2: "medium",
  3: "hard",
};

export const TOPIC_NAMES: Record<Topic, string> = {
  "array": "数组",
  "linked-list": "链表",
  "hash-table": "哈希表",
  "string": "字符串",
  "two-pointers": "双指针",
  "stack-queue": "栈与队列",
  "binary-tree": "二叉树",
  "backtracking": "回溯",
  "greedy": "贪心",
  "dynamic-programming": "动态规划",
  "monotonic-stack": "单调栈",
  "graph": "图论",
};
