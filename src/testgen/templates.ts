import type { TestCase } from "../types.js";

const arrayTemplates: TestCase[] = [
  { input: [[]], expected: null, description: "empty array", category: "edge" },
  { input: [[1]], expected: null, description: "single element", category: "edge" },
  { input: [[1, 1, 1, 1]], expected: null, description: "all same elements", category: "edge" },
];

const linkedListTemplates: TestCase[] = [
  { input: [[]], expected: null, description: "empty list", category: "edge" },
  { input: [[1]], expected: null, description: "single node", category: "edge" },
  { input: [[1, 2]], expected: null, description: "two nodes", category: "edge" },
];

const hashTableTemplates: TestCase[] = [
  { input: [[]], expected: null, description: "empty input", category: "edge" },
  { input: [[1]], expected: null, description: "single element", category: "edge" },
];

const binaryTreeTemplates: TestCase[] = [
  { input: [[]], expected: null, description: "empty tree (null root)", category: "edge" },
  { input: [[1]], expected: null, description: "single node tree", category: "edge" },
];

const dpTemplates: TestCase[] = [
  { input: [0], expected: null, description: "zero input", category: "edge" },
  { input: [1], expected: null, description: "minimal input", category: "edge" },
];

export const TOPIC_TEMPLATES: Record<string, TestCase[]> = {
  array: arrayTemplates,
  "linked-list": linkedListTemplates,
  "hash-table": hashTableTemplates,
  "binary-tree": binaryTreeTemplates,
  "dynamic-programming": dpTemplates,
};
