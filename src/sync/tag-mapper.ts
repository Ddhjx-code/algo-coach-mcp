import type { Topic } from "../types.js";

const TAG_TO_TOPIC: Record<string, Topic> = {
  "array": "array",
  "sorting": "array",
  "matrix": "array",
  "prefix-sum": "array",
  "counting": "array",
  "enumeration": "array",
  "simulation": "array",

  "linked-list": "linked-list",

  "hash-table": "hash-table",

  "string": "string",
  "string-matching": "string",

  "two-pointers": "two-pointers",
  "sliding-window": "two-pointers",
  "binary-search": "two-pointers",

  "stack": "stack-queue",
  "queue": "stack-queue",
  "monotonic-queue": "stack-queue",

  "tree": "binary-tree",
  "binary-tree": "binary-tree",
  "binary-search-tree": "binary-tree",
  "segment-tree": "binary-tree",
  "binary-indexed-tree": "binary-tree",
  "trie": "binary-tree",

  "backtracking": "backtracking",
  "recursion": "backtracking",
  "divide-and-conquer": "backtracking",

  "greedy": "greedy",

  "dynamic-programming": "dynamic-programming",
  "memoization": "dynamic-programming",

  "monotonic-stack": "monotonic-stack",

  "graph": "graph",
  "depth-first-search": "graph",
  "breadth-first-search": "graph",
  "union-find": "graph",
  "shortest-path": "graph",
  "topological-sort": "graph",
  "minimum-spanning-tree": "graph",
  "strongly-connected-component": "graph",
  "eulerian-circuit": "graph",
};

const TOPIC_PRIORITY: Topic[] = [
  "monotonic-stack",
  "graph",
  "dynamic-programming",
  "greedy",
  "backtracking",
  "binary-tree",
  "stack-queue",
  "two-pointers",
  "string",
  "hash-table",
  "linked-list",
  "array",
];

export function mapTagsToTopic(
  tags: Array<{ name: string; slug: string }>
): Topic {
  const matched = new Set<Topic>();

  for (const tag of tags) {
    const topic = TAG_TO_TOPIC[tag.slug];
    if (topic) matched.add(topic);
  }

  if (matched.size === 0) return "array";

  for (const topic of TOPIC_PRIORITY) {
    if (matched.has(topic)) return topic;
  }

  return "array";
}

export function extractAlgorithms(
  tags: Array<{ name: string; slug: string }>
): string[] {
  return tags.map((t) => t.slug);
}
