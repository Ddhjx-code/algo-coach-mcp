export type Difficulty = "easy" | "medium" | "hard";

export type Language = "cpp" | "java" | "python" | "go" | "javascript" | "typescript";

export type Topic =
  | "array"
  | "linked-list"
  | "hash-table"
  | "string"
  | "two-pointers"
  | "stack-queue"
  | "binary-tree"
  | "backtracking"
  | "greedy"
  | "dynamic-programming"
  | "monotonic-stack"
  | "graph";

export interface ProblemEntry {
  slug: string;
  title: string;
  leetcodeSlug: string;
  number: number;
  topic: Topic;
  difficulty: Difficulty;
  algorithms: string[];
  description: string;
  solutions: Partial<Record<Language, string>>;
  keyPoints: string[];
}

export interface TopicMeta {
  id: Topic;
  name: string;
  theoryFile: string;
  summaryFile: string;
  problems: string[];
  order: number;
}

export interface TestCase {
  input: unknown[];
  expected: unknown;
  description: string;
  category: "basic" | "edge" | "performance";
}

export interface TestSuite {
  problemSlug: string;
  functionName: string;
  cases: TestCase[];
}

export interface RealWorldCase {
  algorithm: string;
  title: string;
  domain: string;
  description: string;
  codeSnippet?: string;
  sourceProject?: string;
}

export interface ExecutionResult {
  passed: boolean;
  totalCases: number;
  passedCases: number;
  failedCase?: {
    input: unknown[];
    expected: unknown;
    actual: unknown;
    description: string;
  };
  stdout: string;
  stderr: string;
  timeMs: number;
}
