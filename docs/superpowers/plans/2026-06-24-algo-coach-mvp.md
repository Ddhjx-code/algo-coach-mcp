# Algo Coach MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP Server + Claude Code Skill that turns the leetcode-master repo into an interactive algorithm coach with local test execution and real-world application case mapping.

**Architecture:** TypeScript MCP Server with 4 internal layers (Content Index, TestGen, Executor, Cases) exposed via MCP tools/resources, paired with a Claude Code Skill for session orchestration. Data sourced from 229 local markdown files + pre-authored JSON.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, Node.js child_process (spawning Python), vitest for testing

---

## File Structure

```
algo-coach-mcp/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── types.ts                    # Shared type definitions
│   ├── content/
│   │   ├── parser.ts              # Markdown file parser
│   │   ├── index.ts               # Content index (in-memory store)
│   │   └── topic-mapping.ts       # README → topic assignment
│   ├── testgen/
│   │   ├── generator.ts           # Test case generation coordinator
│   │   └── templates.ts           # Per-algorithm test templates
│   ├── executor/
│   │   └── python-runner.ts       # Python subprocess executor
│   ├── cases/
│   │   └── loader.ts              # Real-world cases JSON loader
│   ├── tools/
│   │   ├── pick-problem.ts        # pick_problem tool
│   │   ├── get-solution.ts        # get_solution tool
│   │   ├── get-theory.ts          # get_theory tool
│   │   ├── get-real-world-cases.ts # get_real_world_cases tool
│   │   ├── generate-test-cases.ts # generate_test_cases tool
│   │   ├── run-user-code.ts       # run_user_code tool
│   │   └── get-topic-roadmap.ts   # get_topic_roadmap tool
│   └── resources/
│       └── index.ts               # MCP resource definitions
├── data/
│   ├── topic-order.json           # Topic learning sequence
│   ├── problem-meta.json          # Problem metadata overrides (difficulty, leetcode slugs)
│   ├── test-cases/                # Pre-authored test cases per problem
│   │   ├── two-sum.json
│   │   ├── binary-search.json
│   │   └── ...
│   └── cases/                     # Real-world application cases
│       ├── hash-table.json
│       ├── binary-search.json
│       ├── sliding-window.json
│       ├── bfs-dfs.json
│       ├── trie.json
│       ├── topological-sort.json
│       ├── dynamic-programming.json
│       ├── union-find.json
│       ├── monotonic-stack.json
│       ├── heap.json
│       ├── backtracking.json
│       └── greedy.json
├── skill/
│   └── algo-coach.md              # Claude Code skill definition
└── tests/
    ├── content/
    │   ├── parser.test.ts
    │   └── topic-mapping.test.ts
    ├── testgen/
    │   └── generator.test.ts
    ├── executor/
    │   └── python-runner.test.ts
    └── tools/
        └── pick-problem.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `algo-coach-mcp/package.json`
- Create: `algo-coach-mcp/tsconfig.json`
- Create: `algo-coach-mcp/vitest.config.ts`
- Create: `algo-coach-mcp/src/types.ts`

- [ ] **Step 1: Create package.json**

```bash
mkdir -p algo-coach-mcp && cd algo-coach-mcp
```

Create `algo-coach-mcp/package.json`:
```json
{
  "name": "algo-coach-mcp",
  "version": "0.1.0",
  "description": "Interactive algorithm coach MCP server powered by 代码随想录",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "algo-coach-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `algo-coach-mcp/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

Create `algo-coach-mcp/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create shared types**

Create `algo-coach-mcp/src/types.ts`:
```typescript
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
```

- [ ] **Step 5: Install dependencies and verify**

Run:
```bash
cd algo-coach-mcp && npm install
```
Expected: `node_modules` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add algo-coach-mcp/package.json algo-coach-mcp/tsconfig.json algo-coach-mcp/vitest.config.ts algo-coach-mcp/src/types.ts
git commit -m "feat: scaffold algo-coach-mcp project with types and config"
```

---

### Task 2: Topic Mapping (README Parser)

**Files:**
- Create: `algo-coach-mcp/src/content/topic-mapping.ts`
- Create: `algo-coach-mcp/data/topic-order.json`
- Test: `algo-coach-mcp/tests/content/topic-mapping.test.ts`

- [ ] **Step 1: Create topic-order.json**

This maps the README's topic sections to structured metadata. Create `algo-coach-mcp/data/topic-order.json`:
```json
[
  {
    "id": "array",
    "name": "数组",
    "theoryFile": "数组理论基础.md",
    "summaryFile": "数组总结篇.md",
    "order": 1,
    "problems": [
      "0704.二分查找",
      "0027.移除元素",
      "0977.有序数组的平方",
      "0209.长度最小的子数组",
      "0059.螺旋矩阵II"
    ]
  },
  {
    "id": "linked-list",
    "name": "链表",
    "theoryFile": "链表理论基础.md",
    "summaryFile": "链表总结篇.md",
    "order": 2,
    "problems": [
      "0203.移除链表元素",
      "0707.设计链表",
      "0206.翻转链表",
      "0024.两两交换链表中的节点",
      "0019.删除链表的倒数第N个节点",
      "0142.环形链表II"
    ]
  },
  {
    "id": "hash-table",
    "name": "哈希表",
    "theoryFile": "哈希表理论基础.md",
    "summaryFile": "哈希表总结.md",
    "order": 3,
    "problems": [
      "0242.有效的字母异位词",
      "1002.查找常用字符",
      "0349.两个数组的交集",
      "0202.快乐数",
      "0001.两数之和",
      "0454.四数相加II",
      "0383.赎金信",
      "0015.三数之和",
      "0018.四数之和"
    ]
  },
  {
    "id": "binary-tree",
    "name": "二叉树",
    "theoryFile": "二叉树理论基础.md",
    "summaryFile": "二叉树总结篇.md",
    "order": 4,
    "problems": [
      "0102.二叉树的层序遍历",
      "0226.翻转二叉树",
      "0101.对称二叉树",
      "0104.二叉树的最大深度",
      "0111.二叉树的最小深度",
      "0222.完全二叉树的节点个数",
      "0110.平衡二叉树",
      "0257.二叉树的所有路径",
      "0404.左叶子之和",
      "0112.路径总和",
      "0236.二叉树的最近公共祖先",
      "0700.二叉搜索树中的搜索",
      "0098.验证二叉搜索树"
    ]
  },
  {
    "id": "dynamic-programming",
    "name": "动态规划",
    "theoryFile": "动态规划理论基础.md",
    "summaryFile": "动态规划总结篇.md",
    "order": 5,
    "problems": [
      "0509.斐波那契数",
      "0070.爬楼梯",
      "0746.使用最小花费爬楼梯",
      "0062.不同路径",
      "0063.不同路径II",
      "0343.整数拆分",
      "0096.不同的二叉搜索树",
      "0416.分割等和子集",
      "0494.目标和",
      "0322.零钱兑换",
      "0300.最长上升子序列",
      "0072.编辑距离"
    ]
  }
]
```

- [ ] **Step 2: Write the failing test**

Create `algo-coach-mcp/tests/content/topic-mapping.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { loadTopicMapping, getTopicForProblem } from "../../src/content/topic-mapping.js";

describe("topic-mapping", () => {
  it("loads all 5 MVP topics from topic-order.json", () => {
    const topics = loadTopicMapping();
    expect(topics).toHaveLength(5);
    expect(topics[0].id).toBe("array");
    expect(topics[4].id).toBe("dynamic-programming");
  });

  it("returns topics ordered by the order field", () => {
    const topics = loadTopicMapping();
    const orders = topics.map((t) => t.order);
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  it("maps a problem slug to its topic", () => {
    const topics = loadTopicMapping();
    const topic = getTopicForProblem(topics, "0001.两数之和");
    expect(topic).toBe("hash-table");
  });

  it("returns undefined for unknown problem", () => {
    const topics = loadTopicMapping();
    const topic = getTopicForProblem(topics, "9999.不存在的题");
    expect(topic).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd algo-coach-mcp && npx vitest run tests/content/topic-mapping.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement topic-mapping.ts**

Create `algo-coach-mcp/src/content/topic-mapping.ts`:
```typescript
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Topic, TopicMeta } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../../data/topic-order.json");

interface TopicOrderEntry {
  id: Topic;
  name: string;
  theoryFile: string;
  summaryFile: string;
  order: number;
  problems: string[];
}

export function loadTopicMapping(): TopicMeta[] {
  const raw = readFileSync(DATA_PATH, "utf-8");
  const entries: TopicOrderEntry[] = JSON.parse(raw);
  return entries
    .map((e) => ({
      id: e.id,
      name: e.name,
      theoryFile: e.theoryFile,
      summaryFile: e.summaryFile,
      problems: e.problems,
      order: e.order,
    }))
    .sort((a, b) => a.order - b.order);
}

export function getTopicForProblem(
  topics: TopicMeta[],
  slug: string
): Topic | undefined {
  for (const topic of topics) {
    if (topic.problems.includes(slug)) {
      return topic.id;
    }
  }
  return undefined;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd algo-coach-mcp && npx vitest run tests/content/topic-mapping.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add algo-coach-mcp/src/content/topic-mapping.ts algo-coach-mcp/data/topic-order.json algo-coach-mcp/tests/content/topic-mapping.test.ts
git commit -m "feat: add topic mapping with ordered topic metadata"
```

---

### Task 3: Markdown Content Parser

**Files:**
- Create: `algo-coach-mcp/src/content/parser.ts`
- Test: `algo-coach-mcp/tests/content/parser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `algo-coach-mcp/tests/content/parser.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseProblemMarkdown } from "../../src/content/parser.js";

const SAMPLE_MD = `* [做项目](https://www.programmercarl.com/other/kstar.html)
* [刷算法](https://www.programmercarl.com/xunlian/xunlianying.html)
* [背八股](https://www.programmercarl.com/xunlian/bagu.html)


# 1. 两数之和

[力扣题目链接](https://leetcode.cn/problems/two-sum/)

给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那 两个 整数，并返回他们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素不能使用两遍。

**示例:**

给定 nums = [2, 7, 11, 15], target = 9

## 思路

使用哈希表来解决。

## 总结

本题有四个重点：
* 为什么用哈希表
* 哈希表为什么用map

## 其他语言版本

### Python：

\`\`\`python
class Solution:
    def twoSum(self, nums, target):
        records = dict()
        for index, value in enumerate(nums):
            if target - value in records:
                return [records[target - value], index]
            records[value] = index
        return []
\`\`\`

### Java：

\`\`\`java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for(int i = 0; i < nums.length; i++){
        int temp = target - nums[i];
        if(map.containsKey(temp)){
            return new int[]{map.get(temp), i};
        }
        map.put(nums[i], i);
    }
    return new int[]{};
}
\`\`\`
`;

describe("parseProblemMarkdown", () => {
  it("extracts problem number and title from H1", () => {
    const result = parseProblemMarkdown(SAMPLE_MD, "0001.两数之和");
    expect(result.number).toBe(1);
    expect(result.title).toBe("两数之和");
  });

  it("extracts leetcode slug from force link", () => {
    const result = parseProblemMarkdown(SAMPLE_MD, "0001.两数之和");
    expect(result.leetcodeSlug).toBe("two-sum");
  });

  it("extracts problem description (between H1 and first H2)", () => {
    const result = parseProblemMarkdown(SAMPLE_MD, "0001.两数之和");
    expect(result.description).toContain("给定一个整数数组");
    expect(result.description).not.toContain("使用哈希表");
  });

  it("extracts key points from 总结 section", () => {
    const result = parseProblemMarkdown(SAMPLE_MD, "0001.两数之和");
    expect(result.keyPoints).toHaveLength(2);
    expect(result.keyPoints[0]).toContain("为什么用哈希表");
  });

  it("extracts python code block", () => {
    const result = parseProblemMarkdown(SAMPLE_MD, "0001.两数之和");
    expect(result.solutions.python).toContain("class Solution");
    expect(result.solutions.python).toContain("records = dict()");
  });

  it("extracts java code block", () => {
    const result = parseProblemMarkdown(SAMPLE_MD, "0001.两数之和");
    expect(result.solutions.java).toContain("Map<Integer, Integer>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd algo-coach-mcp && npx vitest run tests/content/parser.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement parser.ts**

Create `algo-coach-mcp/src/content/parser.ts`:
```typescript
import type { Language, ProblemEntry } from "../types.js";

const LANGUAGE_MAP: Record<string, Language> = {
  python: "python",
  python3: "python",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  CPP: "cpp",
  go: "go",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
};

export function parseProblemMarkdown(
  content: string,
  fileSlug: string
): Omit<ProblemEntry, "topic" | "difficulty" | "algorithms"> {
  const lines = content.split("\n");

  const { number, title } = extractTitle(lines);
  const leetcodeSlug = extractLeetcodeSlug(lines);
  const description = extractDescription(lines);
  const keyPoints = extractKeyPoints(lines);
  const solutions = extractSolutions(content);

  return {
    slug: fileSlug,
    title,
    leetcodeSlug,
    number,
    description,
    solutions,
    keyPoints,
  };
}

function extractTitle(lines: string[]): { number: number; title: string } {
  for (const line of lines) {
    const match = line.match(/^#\s+(\d+)\.\s*(.+)/);
    if (match) {
      return { number: parseInt(match[1], 10), title: match[2].trim() };
    }
  }
  return { number: 0, title: "" };
}

function extractLeetcodeSlug(lines: string[]): string {
  for (const line of lines.slice(0, 15)) {
    const match = line.match(
      /leetcode\.cn\/problems\/([a-z0-9-]+)/
    );
    if (match) return match[1];
    const matchGlobal = line.match(
      /leetcode\.com\/problems\/([a-z0-9-]+)/
    );
    if (matchGlobal) return matchGlobal[1];
  }
  return "";
}

function extractDescription(lines: string[]): string {
  let start = -1;
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (start === -1 && lines[i].match(/^#\s+\d+\./)) {
      start = i + 1;
      continue;
    }
    if (start !== -1 && lines[i].match(/^##\s+/)) {
      end = i;
      break;
    }
  }

  if (start === -1) return "";
  return lines
    .slice(start, end)
    .join("\n")
    .trim();
}

function extractKeyPoints(lines: string[]): string[] {
  let inSummary = false;
  const points: string[] = [];

  for (const line of lines) {
    if (line.match(/^##\s+总结/)) {
      inSummary = true;
      continue;
    }
    if (inSummary && line.match(/^##\s+/)) {
      break;
    }
    if (inSummary) {
      const bullet = line.match(/^\*\s+(.+)/);
      if (bullet) {
        points.push(bullet[1].trim());
      }
    }
  }

  return points;
}

function extractSolutions(content: string): Partial<Record<Language, string>> {
  const solutions: Partial<Record<Language, string>> = {};
  const codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const langRaw = match[1];
    const code = match[2].trim();
    const lang = LANGUAGE_MAP[langRaw] || LANGUAGE_MAP[langRaw.toLowerCase()];
    if (lang && !solutions[lang]) {
      solutions[lang] = code;
    }
  }

  return solutions;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd algo-coach-mcp && npx vitest run tests/content/parser.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add algo-coach-mcp/src/content/parser.ts algo-coach-mcp/tests/content/parser.test.ts
git commit -m "feat: add markdown parser for problem content extraction"
```

---

### Task 4: Content Index

**Files:**
- Create: `algo-coach-mcp/src/content/index.ts`
- Create: `algo-coach-mcp/data/problem-meta.json`

- [ ] **Step 1: Create problem-meta.json**

This holds difficulty and algorithm annotations that can't be reliably parsed from markdown. Create `algo-coach-mcp/data/problem-meta.json`:
```json
{
  "0704.二分查找": { "difficulty": "easy", "algorithms": ["binary-search"] },
  "0027.移除元素": { "difficulty": "easy", "algorithms": ["two-pointers"] },
  "0977.有序数组的平方": { "difficulty": "easy", "algorithms": ["two-pointers"] },
  "0209.长度最小的子数组": { "difficulty": "medium", "algorithms": ["sliding-window"] },
  "0059.螺旋矩阵II": { "difficulty": "medium", "algorithms": ["simulation"] },
  "0203.移除链表元素": { "difficulty": "easy", "algorithms": ["linked-list-traversal"] },
  "0707.设计链表": { "difficulty": "medium", "algorithms": ["linked-list-design"] },
  "0206.翻转链表": { "difficulty": "easy", "algorithms": ["linked-list-reversal"] },
  "0024.两两交换链表中的节点": { "difficulty": "medium", "algorithms": ["linked-list-manipulation"] },
  "0019.删除链表的倒数第N个节点": { "difficulty": "medium", "algorithms": ["two-pointers"] },
  "0142.环形链表II": { "difficulty": "medium", "algorithms": ["fast-slow-pointers"] },
  "0242.有效的字母异位词": { "difficulty": "easy", "algorithms": ["hash-table"] },
  "1002.查找常用字符": { "difficulty": "easy", "algorithms": ["hash-table"] },
  "0349.两个数组的交集": { "difficulty": "easy", "algorithms": ["hash-table"] },
  "0202.快乐数": { "difficulty": "easy", "algorithms": ["hash-table"] },
  "0001.两数之和": { "difficulty": "easy", "algorithms": ["hash-map-lookup"] },
  "0454.四数相加II": { "difficulty": "medium", "algorithms": ["hash-table"] },
  "0383.赎金信": { "difficulty": "easy", "algorithms": ["hash-table"] },
  "0015.三数之和": { "difficulty": "medium", "algorithms": ["two-pointers", "sorting"] },
  "0018.四数之和": { "difficulty": "medium", "algorithms": ["two-pointers", "sorting"] },
  "0102.二叉树的层序遍历": { "difficulty": "medium", "algorithms": ["bfs"] },
  "0226.翻转二叉树": { "difficulty": "easy", "algorithms": ["dfs", "recursion"] },
  "0101.对称二叉树": { "difficulty": "easy", "algorithms": ["dfs", "recursion"] },
  "0104.二叉树的最大深度": { "difficulty": "easy", "algorithms": ["dfs", "recursion"] },
  "0111.二叉树的最小深度": { "difficulty": "easy", "algorithms": ["bfs", "dfs"] },
  "0222.完全二叉树的节点个数": { "difficulty": "medium", "algorithms": ["binary-search", "recursion"] },
  "0110.平衡二叉树": { "difficulty": "easy", "algorithms": ["dfs", "recursion"] },
  "0257.二叉树的所有路径": { "difficulty": "easy", "algorithms": ["dfs", "backtracking"] },
  "0404.左叶子之和": { "difficulty": "easy", "algorithms": ["dfs"] },
  "0112.路径总和": { "difficulty": "easy", "algorithms": ["dfs", "backtracking"] },
  "0236.二叉树的最近公共祖先": { "difficulty": "medium", "algorithms": ["dfs", "recursion"] },
  "0700.二叉搜索树中的搜索": { "difficulty": "easy", "algorithms": ["binary-search-tree"] },
  "0098.验证二叉搜索树": { "difficulty": "medium", "algorithms": ["dfs", "inorder"] },
  "0509.斐波那契数": { "difficulty": "easy", "algorithms": ["dynamic-programming"] },
  "0070.爬楼梯": { "difficulty": "easy", "algorithms": ["dynamic-programming"] },
  "0746.使用最小花费爬楼梯": { "difficulty": "easy", "algorithms": ["dynamic-programming"] },
  "0062.不同路径": { "difficulty": "medium", "algorithms": ["dynamic-programming"] },
  "0063.不同路径II": { "difficulty": "medium", "algorithms": ["dynamic-programming"] },
  "0343.整数拆分": { "difficulty": "medium", "algorithms": ["dynamic-programming"] },
  "0096.不同的二叉搜索树": { "difficulty": "medium", "algorithms": ["dynamic-programming"] },
  "0416.分割等和子集": { "difficulty": "medium", "algorithms": ["dynamic-programming", "knapsack"] },
  "0494.目标和": { "difficulty": "medium", "algorithms": ["dynamic-programming", "knapsack"] },
  "0322.零钱兑换": { "difficulty": "medium", "algorithms": ["dynamic-programming", "complete-knapsack"] },
  "0300.最长上升子序列": { "difficulty": "medium", "algorithms": ["dynamic-programming"] },
  "0072.编辑距离": { "difficulty": "medium", "algorithms": ["dynamic-programming"] }
}
```

- [ ] **Step 2: Implement content index**

Create `algo-coach-mcp/src/content/index.ts`:
```typescript
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProblemEntry, TopicMeta, Topic, Difficulty } from "../types.js";
import { parseProblemMarkdown } from "./parser.js";
import { loadTopicMapping, getTopicForProblem } from "./topic-mapping.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROBLEMS_DIR = resolve(__dirname, "../../../problems");
const META_PATH = resolve(__dirname, "../../data/problem-meta.json");

interface ProblemMeta {
  difficulty: Difficulty;
  algorithms: string[];
}

export class ContentIndex {
  private problems: Map<string, ProblemEntry> = new Map();
  private topics: TopicMeta[] = [];

  constructor(problemsDir?: string) {
    this.load(problemsDir ?? PROBLEMS_DIR);
  }

  private load(problemsDir: string): void {
    this.topics = loadTopicMapping();

    const metaRaw = readFileSync(META_PATH, "utf-8");
    const metaMap: Record<string, ProblemMeta> = JSON.parse(metaRaw);

    const allProblemSlugs = this.topics.flatMap((t) => t.problems);

    for (const slug of allProblemSlugs) {
      const filePath = resolve(problemsDir, `${slug}.md`);
      let content: string;
      try {
        content = readFileSync(filePath, "utf-8");
      } catch {
        continue;
      }

      const parsed = parseProblemMarkdown(content, slug);
      const topic = getTopicForProblem(this.topics, slug) ?? "array";
      const meta = metaMap[slug] ?? { difficulty: "medium", algorithms: [] };

      const entry: ProblemEntry = {
        ...parsed,
        topic,
        difficulty: meta.difficulty,
        algorithms: meta.algorithms,
      };

      this.problems.set(slug, entry);
    }
  }

  getProblem(slug: string): ProblemEntry | undefined {
    return this.problems.get(slug);
  }

  getProblemsForTopic(topic: Topic): ProblemEntry[] {
    const topicMeta = this.topics.find((t) => t.id === topic);
    if (!topicMeta) return [];
    return topicMeta.problems
      .map((slug) => this.problems.get(slug))
      .filter((p): p is ProblemEntry => p !== undefined);
  }

  getTopics(): TopicMeta[] {
    return this.topics;
  }

  getTheoryContent(topic: Topic): string {
    const topicMeta = this.topics.find((t) => t.id === topic);
    if (!topicMeta) return "";
    const filePath = resolve(PROBLEMS_DIR, topicMeta.theoryFile);
    try {
      return readFileSync(filePath, "utf-8");
    } catch {
      return "";
    }
  }

  getAllProblems(): ProblemEntry[] {
    return Array.from(this.problems.values());
  }
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd algo-coach-mcp && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add algo-coach-mcp/src/content/index.ts algo-coach-mcp/data/problem-meta.json
git commit -m "feat: add content index that loads all problem entries at startup"
```

---

### Task 5: Test Case Generation

**Files:**
- Create: `algo-coach-mcp/src/testgen/templates.ts`
- Create: `algo-coach-mcp/src/testgen/generator.ts`
- Create: `algo-coach-mcp/data/test-cases/two-sum.json`
- Create: `algo-coach-mcp/data/test-cases/binary-search.json`
- Test: `algo-coach-mcp/tests/testgen/generator.test.ts`

- [ ] **Step 1: Create pre-authored test cases**

Create `algo-coach-mcp/data/test-cases/two-sum.json`:
```json
{
  "problemSlug": "0001.两数之和",
  "functionName": "twoSum",
  "cases": [
    { "input": [[2, 7, 11, 15], 9], "expected": [0, 1], "description": "basic case from example", "category": "basic" },
    { "input": [[3, 2, 4], 6], "expected": [1, 2], "description": "target not using first element", "category": "basic" },
    { "input": [[3, 3], 6], "expected": [0, 1], "description": "duplicate values", "category": "edge" },
    { "input": [[-1, -2, -3, -4, -5], -8], "expected": [2, 4], "description": "all negative numbers", "category": "edge" },
    { "input": [[0, 4, 3, 0], 0], "expected": [0, 3], "description": "zeros in array", "category": "edge" },
    { "input": [[1000000, 500000, -1500000], -1000000], "expected": [1, 2], "description": "large numbers", "category": "performance" }
  ]
}
```

Create `algo-coach-mcp/data/test-cases/binary-search.json`:
```json
{
  "problemSlug": "0704.二分查找",
  "functionName": "search",
  "cases": [
    { "input": [[-1, 0, 3, 5, 9, 12], 9], "expected": 4, "description": "target exists in array", "category": "basic" },
    { "input": [[-1, 0, 3, 5, 9, 12], 2], "expected": -1, "description": "target not in array", "category": "basic" },
    { "input": [[5], 5], "expected": 0, "description": "single element found", "category": "edge" },
    { "input": [[5], -5], "expected": -1, "description": "single element not found", "category": "edge" },
    { "input": [[1, 2, 3, 4, 5], 1], "expected": 0, "description": "target is first element", "category": "edge" },
    { "input": [[1, 2, 3, 4, 5], 5], "expected": 4, "description": "target is last element", "category": "edge" },
    { "input": [[], 3], "expected": -1, "description": "empty array", "category": "edge" }
  ]
}
```

- [ ] **Step 2: Create test templates**

Create `algo-coach-mcp/src/testgen/templates.ts`:
```typescript
import type { TestCase } from "../types.js";

type TemplateGenerator = (problemDescription: string) => TestCase[];

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
```

- [ ] **Step 3: Write the failing test**

Create `algo-coach-mcp/tests/testgen/generator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { generateTestCases } from "../../src/testgen/generator.js";

describe("generateTestCases", () => {
  it("returns pre-authored cases when available", () => {
    const suite = generateTestCases("0001.两数之和", "hash-table");
    expect(suite.functionName).toBe("twoSum");
    expect(suite.cases.length).toBeGreaterThanOrEqual(5);
    expect(suite.cases[0].description).toBe("basic case from example");
  });

  it("returns template cases for problems without pre-authored tests", () => {
    const suite = generateTestCases("0242.有效的字母异位词", "hash-table");
    expect(suite.cases.length).toBeGreaterThan(0);
    expect(suite.cases.some((c) => c.category === "edge")).toBe(true);
  });

  it("includes problem slug in returned suite", () => {
    const suite = generateTestCases("0704.二分查找", "array");
    expect(suite.problemSlug).toBe("0704.二分查找");
    expect(suite.functionName).toBe("search");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd algo-coach-mcp && npx vitest run tests/testgen/generator.test.ts`
Expected: FAIL

- [ ] **Step 5: Implement generator.ts**

Create `algo-coach-mcp/src/testgen/generator.ts`:
```typescript
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { TestSuite, TestCase } from "../types.js";
import { TOPIC_TEMPLATES } from "./templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_CASES_DIR = resolve(__dirname, "../../data/test-cases");

export function generateTestCases(
  problemSlug: string,
  topic: string
): TestSuite {
  const preAuthored = loadPreAuthored(problemSlug);
  if (preAuthored) return preAuthored;

  const templateCases = TOPIC_TEMPLATES[topic] ?? [];
  return {
    problemSlug,
    functionName: "solution",
    cases: templateCases,
  };
}

function loadPreAuthored(problemSlug: string): TestSuite | null {
  const numberMatch = problemSlug.match(/^(\d+)\./);
  if (!numberMatch) return null;

  const files = findTestCaseFile(problemSlug);
  if (!files) return null;

  try {
    const raw = readFileSync(files, "utf-8");
    return JSON.parse(raw) as TestSuite;
  } catch {
    return null;
  }
}

function findTestCaseFile(problemSlug: string): string | null {
  const slugFromMeta = problemSlug.replace(/^\d+\./, "");

  const possibleNames = [
    slugFromMeta,
    problemSlug,
  ];

  for (const name of possibleNames) {
    const path = resolve(TEST_CASES_DIR, `${name}.json`);
    if (existsSync(path)) return path;
  }

  const leetcodeSlugMap: Record<string, string> = {
    "0001.两数之和": "two-sum",
    "0704.二分查找": "binary-search",
  };

  const mapped = leetcodeSlugMap[problemSlug];
  if (mapped) {
    const path = resolve(TEST_CASES_DIR, `${mapped}.json`);
    if (existsSync(path)) return path;
  }

  return null;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd algo-coach-mcp && npx vitest run tests/testgen/generator.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 7: Commit**

```bash
git add algo-coach-mcp/src/testgen/ algo-coach-mcp/data/test-cases/ algo-coach-mcp/tests/testgen/
git commit -m "feat: add test case generation with pre-authored cases and topic templates"
```

---

### Task 6: Python Subprocess Executor

**Files:**
- Create: `algo-coach-mcp/src/executor/python-runner.ts`
- Test: `algo-coach-mcp/tests/executor/python-runner.test.ts`

- [ ] **Step 1: Write the failing test**

Create `algo-coach-mcp/tests/executor/python-runner.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { runPythonCode } from "../../src/executor/python-runner.js";
import type { TestCase } from "../../src/types.js";

describe("runPythonCode", () => {
  it("runs passing code and reports success", async () => {
    const code = `
def twoSum(nums, target):
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []
`;
    const cases: TestCase[] = [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: "basic", category: "basic" },
    ];

    const result = await runPythonCode(code, "twoSum", cases);
    expect(result.passed).toBe(true);
    expect(result.passedCases).toBe(1);
    expect(result.totalCases).toBe(1);
  });

  it("reports failure with details on wrong answer", async () => {
    const code = `
def twoSum(nums, target):
    return [0, 0]
`;
    const cases: TestCase[] = [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: "basic", category: "basic" },
    ];

    const result = await runPythonCode(code, "twoSum", cases);
    expect(result.passed).toBe(false);
    expect(result.passedCases).toBe(0);
    expect(result.failedCase).toBeDefined();
    expect(result.failedCase!.expected).toEqual([0, 1]);
    expect(result.failedCase!.actual).toEqual([0, 0]);
  });

  it("handles timeout for infinite loops", async () => {
    const code = `
def solution(n):
    while True:
        pass
`;
    const cases: TestCase[] = [
      { input: [1], expected: 1, description: "infinite", category: "basic" },
    ];

    const result = await runPythonCode(code, "solution", cases, 2000);
    expect(result.passed).toBe(false);
    expect(result.stderr).toContain("timeout");
  }, 10000);

  it("handles runtime errors gracefully", async () => {
    const code = `
def solution(nums):
    return nums[999]
`;
    const cases: TestCase[] = [
      { input: [[1, 2, 3]], expected: 1, description: "out of bounds", category: "basic" },
    ];

    const result = await runPythonCode(code, "solution", cases);
    expect(result.passed).toBe(false);
    expect(result.stderr).toContain("IndexError");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd algo-coach-mcp && npx vitest run tests/executor/python-runner.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement python-runner.ts**

Create `algo-coach-mcp/src/executor/python-runner.ts`:
```typescript
import { execFile } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import type { TestCase, ExecutionResult } from "../types.js";

const DEFAULT_TIMEOUT_MS = 5000;

export async function runPythonCode(
  userCode: string,
  functionName: string,
  testCases: TestCase[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ExecutionResult> {
  const script = buildTestScript(userCode, functionName, testCases);
  const tempDir = mkdtempSync(resolve(tmpdir(), "algo-coach-"));
  const scriptPath = resolve(tempDir, "run.py");

  writeFileSync(scriptPath, script, "utf-8");

  const startTime = Date.now();

  try {
    const output = await executeWithTimeout(scriptPath, timeoutMs);
    const elapsed = Date.now() - startTime;
    return parseOutput(output, testCases, elapsed);
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if (isTimeoutError(err)) {
      return {
        passed: false,
        totalCases: testCases.length,
        passedCases: 0,
        stdout: "",
        stderr: "Error: timeout - execution exceeded time limit",
        timeMs: elapsed,
      };
    }
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    return {
      passed: false,
      totalCases: testCases.length,
      passedCases: 0,
      stdout: "",
      stderr,
      timeMs: elapsed,
    };
  } finally {
    try {
      unlinkSync(scriptPath);
    } catch {}
  }
}

function buildTestScript(
  userCode: string,
  functionName: string,
  testCases: TestCase[]
): string {
  const casesJson = JSON.stringify(testCases.map((c) => ({ input: c.input, expected: c.expected, description: c.description })));

  return `
import json
import sys

# User code
${userCode}

# Test runner
cases = json.loads('''${casesJson}''')
results = []

for i, case in enumerate(cases):
    try:
        actual = ${functionName}(*case["input"])
        passed = actual == case["expected"]
        results.append({
            "index": i,
            "passed": passed,
            "actual": actual,
            "expected": case["expected"],
            "description": case["description"]
        })
    except Exception as e:
        results.append({
            "index": i,
            "passed": False,
            "actual": None,
            "expected": case["expected"],
            "description": case["description"],
            "error": str(e)
        })

print(json.dumps(results))
`;
}

function executeWithTimeout(
  scriptPath: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      [scriptPath],
      { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed || error.code === "ETIMEDOUT") {
            reject({ timeout: true, stderr: "timeout" });
          } else {
            reject({ stderr: stderr || error.message });
          }
          return;
        }
        resolve(stdout);
      }
    );
  });
}

function isTimeoutError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "timeout" in err && (err as { timeout: boolean }).timeout === true;
}

function parseOutput(
  stdout: string,
  testCases: TestCase[],
  timeMs: number
): ExecutionResult {
  try {
    const results = JSON.parse(stdout.trim()) as Array<{
      index: number;
      passed: boolean;
      actual: unknown;
      expected: unknown;
      description: string;
      error?: string;
    }>;

    const passedCases = results.filter((r) => r.passed).length;
    const firstFailed = results.find((r) => !r.passed);

    return {
      passed: passedCases === testCases.length,
      totalCases: testCases.length,
      passedCases,
      failedCase: firstFailed
        ? {
            input: testCases[firstFailed.index].input,
            expected: firstFailed.expected,
            actual: firstFailed.actual,
            description: firstFailed.description,
          }
        : undefined,
      stdout: "",
      stderr: "",
      timeMs,
    };
  } catch {
    return {
      passed: false,
      totalCases: testCases.length,
      passedCases: 0,
      stdout,
      stderr: "Failed to parse test runner output",
      timeMs,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd algo-coach-mcp && npx vitest run tests/executor/python-runner.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add algo-coach-mcp/src/executor/python-runner.ts algo-coach-mcp/tests/executor/python-runner.test.ts
git commit -m "feat: add Python subprocess executor with timeout and result parsing"
```

---

### Task 7: Real-World Cases Data

**Files:**
- Create: `algo-coach-mcp/data/cases/hash-table.json`
- Create: `algo-coach-mcp/data/cases/binary-search.json`
- Create: `algo-coach-mcp/data/cases/sliding-window.json`
- Create: `algo-coach-mcp/data/cases/bfs-dfs.json`
- Create: `algo-coach-mcp/data/cases/trie.json`
- Create: `algo-coach-mcp/data/cases/topological-sort.json`
- Create: `algo-coach-mcp/data/cases/dynamic-programming.json`
- Create: `algo-coach-mcp/data/cases/union-find.json`
- Create: `algo-coach-mcp/data/cases/monotonic-stack.json`
- Create: `algo-coach-mcp/data/cases/heap.json`
- Create: `algo-coach-mcp/data/cases/backtracking.json`
- Create: `algo-coach-mcp/data/cases/greedy.json`
- Create: `algo-coach-mcp/src/cases/loader.ts`

- [ ] **Step 1: Create cases JSON files (3 shown, create all 12)**

Create `algo-coach-mcp/data/cases/hash-table.json`:
```json
[
  {
    "algorithm": "hash-table",
    "title": "Redis In-Memory Cache",
    "domain": "databases",
    "description": "Redis uses hash tables as its core data structure for key-value storage. When you call SET/GET, Redis computes a hash of your key to find the bucket in O(1). It uses chaining for collision resolution and incrementally rehashes (doubles the table) when the load factor exceeds 1. This is exactly the same tradeoff you face in two-sum: trading space (the hash map) for O(1) lookup time.",
    "codeSnippet": "# Simplified Redis-like lookup\nclass KVStore:\n    def __init__(self, size=1024):\n        self.buckets = [[] for _ in range(size)]\n\n    def _hash(self, key):\n        return hash(key) % len(self.buckets)\n\n    def set(self, key, value):\n        idx = self._hash(key)\n        for i, (k, v) in enumerate(self.buckets[idx]):\n            if k == key:\n                self.buckets[idx][i] = (key, value)\n                return\n        self.buckets[idx].append((key, value))\n\n    def get(self, key):\n        idx = self._hash(key)\n        for k, v in self.buckets[idx]:\n            if k == key:\n                return v\n        return None",
    "sourceProject": "Redis (src/dict.c)"
  },
  {
    "algorithm": "hash-table",
    "title": "Database Index Lookup",
    "domain": "databases",
    "description": "When a SQL database creates a hash index on a column, it builds a hash table mapping column values to row pointers. A query like SELECT * WHERE email = 'x@y.com' becomes a hash lookup instead of a full table scan. PostgreSQL uses hash indexes for equality comparisons, giving O(1) lookup vs O(n) sequential scan. The same principle as solving 'two-sum' — pre-build a lookup structure to avoid repeated scanning.",
    "sourceProject": "PostgreSQL (src/backend/access/hash/)"
  },
  {
    "algorithm": "hash-table",
    "title": "Network Packet Deduplication",
    "domain": "networking",
    "description": "Network switches use bloom filters (a probabilistic hash structure) to detect duplicate packets. When a packet arrives, its hash is checked against the filter. If present, the packet is dropped as a duplicate. This prevents broadcast storms in Ethernet networks. The core idea matches 'contains duplicate' problems — use hashing to answer 'have I seen this before?' in O(1).",
    "sourceProject": "Open vSwitch (lib/packets.c)"
  }
]
```

Create `algo-coach-mcp/data/cases/binary-search.json`:
```json
[
  {
    "algorithm": "binary-search",
    "title": "Git Bisect",
    "domain": "developer-tools",
    "description": "git bisect uses binary search to find the commit that introduced a bug. Given a 'good' commit and a 'bad' commit, it picks the midpoint, asks you to test it, and eliminates half the range each step. For 1000 commits, you find the culprit in ~10 steps instead of 1000. This is the same algorithm as LeetCode 704 applied to commit history.",
    "codeSnippet": "# git bisect logic (simplified)\ndef bisect(commits, is_bad):\n    lo, hi = 0, len(commits) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if is_bad(commits[mid]):\n            hi = mid\n        else:\n            lo = mid + 1\n    return commits[lo]",
    "sourceProject": "Git (bisect.c)"
  },
  {
    "algorithm": "binary-search",
    "title": "Package Version Resolution",
    "domain": "package-managers",
    "description": "npm/pip resolve version constraints (>=1.2.0 <2.0.0) by binary searching sorted version lists. When checking compatibility, they binary search for the upper and lower bounds of acceptable versions. This is identical to LeetCode 34 (Find First and Last Position of Element in Sorted Array).",
    "sourceProject": "npm (node-semver)"
  },
  {
    "algorithm": "binary-search",
    "title": "Database B-Tree Lookup",
    "domain": "databases",
    "description": "B-trees in databases use binary search within each node to find the correct child pointer. A node with 100 keys uses binary search (7 comparisons) instead of linear scan (50 average). This is why database indexes are fast — every level of the B-tree uses the same binary search logic you practice in LeetCode 704.",
    "sourceProject": "SQLite (btree.c)"
  }
]
```

Create `algo-coach-mcp/data/cases/dynamic-programming.json`:
```json
[
  {
    "algorithm": "dynamic-programming",
    "title": "Git Diff (Edit Distance)",
    "domain": "developer-tools",
    "description": "git diff computes the minimum number of insertions and deletions to transform one file into another — this is exactly the edit distance problem (LeetCode 72). The Myers diff algorithm uses a DP approach to find the shortest edit script. Every time you run 'git diff', you're witnessing dynamic programming at work.",
    "codeSnippet": "# Simplified edit distance (core of diff)\ndef edit_distance(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i-1] == b[j-1]:\n                dp[i][j] = dp[i-1][j-1]\n            else:\n                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\n    return dp[m][n]",
    "sourceProject": "Git (xdiff/xdiffi.c)"
  },
  {
    "algorithm": "dynamic-programming",
    "title": "GPS Route Planning (Shortest Path)",
    "domain": "mapping",
    "description": "Navigation apps find optimal routes using dynamic programming principles. Dijkstra's algorithm (used in Google Maps) builds shortest paths incrementally — the optimal path to node C uses already-computed optimal paths to nodes A and B. This 'optimal substructure' is exactly the DP property you exploit in problems like LeetCode 62 (Unique Paths).",
    "sourceProject": "OSRM (Open Source Routing Machine)"
  },
  {
    "algorithm": "dynamic-programming",
    "title": "Text Wrapping (Knuth-Plass)",
    "domain": "typography",
    "description": "LaTeX's paragraph layout algorithm uses DP to minimize the 'ugliness' of line breaks across an entire paragraph, rather than greedily wrapping line by line. It considers all possible break points and finds the globally optimal solution — the same exhaustive-but-efficient approach as the knapsack problem (LeetCode 416).",
    "sourceProject": "TeX (tex.web, §851-§864)"
  }
]
```

- [ ] **Step 2: Create remaining 9 case files**

Create the following files with 2-3 cases each (same JSON structure):
- `algo-coach-mcp/data/cases/sliding-window.json` — TCP flow control, rate limiting, streaming analytics
- `algo-coach-mcp/data/cases/bfs-dfs.json` — web crawlers, file system traversal, dependency resolution
- `algo-coach-mcp/data/cases/trie.json` — autocomplete, IP routing, spell checkers
- `algo-coach-mcp/data/cases/topological-sort.json` — build systems, task scheduling, course prerequisites
- `algo-coach-mcp/data/cases/union-find.json` — network connectivity, image segmentation, Kruskal's MST
- `algo-coach-mcp/data/cases/monotonic-stack.json` — stock span, histogram area, temperature tracking
- `algo-coach-mcp/data/cases/heap.json` — OS scheduling, event simulation, K-way merge
- `algo-coach-mcp/data/cases/backtracking.json` — regex matching, constraint solvers, compiler optimization
- `algo-coach-mcp/data/cases/greedy.json` — Huffman coding, job scheduling, coin change

Each file follows this schema:
```json
[
  {
    "algorithm": "<algorithm-slug>",
    "title": "<Real-World System Name>",
    "domain": "<category>",
    "description": "<2-3 sentences connecting the algorithm to the system>",
    "codeSnippet": "<optional simplified code>",
    "sourceProject": "<optional source reference>"
  }
]
```

- [ ] **Step 3: Implement cases loader**

Create `algo-coach-mcp/src/cases/loader.ts`:
```typescript
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RealWorldCase } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CASES_DIR = resolve(__dirname, "../../data/cases");

export function loadCasesForAlgorithm(algorithm: string): RealWorldCase[] {
  const filePath = resolve(CASES_DIR, `${algorithm}.json`);
  if (!existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as RealWorldCase[];
  } catch {
    return [];
  }
}

export function listAvailableAlgorithms(): string[] {
  const { readdirSync } = require("node:fs");
  try {
    const files: string[] = readdirSync(CASES_DIR);
    return files
      .filter((f: string) => f.endsWith(".json"))
      .map((f: string) => f.replace(".json", ""));
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add algo-coach-mcp/data/cases/ algo-coach-mcp/src/cases/loader.ts
git commit -m "feat: add real-world application cases for 12 algorithms"
```

---

### Task 8: MCP Server Entry + Tools

**Files:**
- Create: `algo-coach-mcp/src/index.ts`
- Create: `algo-coach-mcp/src/tools/pick-problem.ts`
- Create: `algo-coach-mcp/src/tools/get-solution.ts`
- Create: `algo-coach-mcp/src/tools/get-theory.ts`
- Create: `algo-coach-mcp/src/tools/get-real-world-cases.ts`
- Create: `algo-coach-mcp/src/tools/generate-test-cases.ts`
- Create: `algo-coach-mcp/src/tools/run-user-code.ts`
- Create: `algo-coach-mcp/src/tools/get-topic-roadmap.ts`
- Create: `algo-coach-mcp/src/resources/index.ts`

- [ ] **Step 1: Create tool implementations**

Create `algo-coach-mcp/src/tools/pick-problem.ts`:
```typescript
import type { ContentIndex } from "../content/index.js";
import type { Difficulty, Topic } from "../types.js";

export function pickProblem(
  contentIndex: ContentIndex,
  params: { topic?: Topic; difficulty?: Difficulty }
): object {
  const { topic, difficulty } = params;

  let problems = topic
    ? contentIndex.getProblemsForTopic(topic)
    : contentIndex.getAllProblems();

  if (difficulty) {
    problems = problems.filter((p) => p.difficulty === difficulty);
  }

  if (problems.length === 0) {
    return { error: "No problems found matching criteria" };
  }

  const randomIndex = Math.floor(Math.random() * problems.length);
  const problem = problems[randomIndex];

  return {
    slug: problem.slug,
    title: problem.title,
    number: problem.number,
    difficulty: problem.difficulty,
    topic: problem.topic,
    leetcodeSlug: problem.leetcodeSlug,
    description: problem.description,
    algorithms: problem.algorithms,
  };
}
```

Create `algo-coach-mcp/src/tools/get-solution.ts`:
```typescript
import type { ContentIndex } from "../content/index.js";
import type { Language } from "../types.js";

export function getSolution(
  contentIndex: ContentIndex,
  params: { slug: string; language?: Language }
): object {
  const problem = contentIndex.getProblem(params.slug);
  if (!problem) {
    return { error: `Problem not found: ${params.slug}` };
  }

  const language = params.language ?? "python";
  const code = problem.solutions[language];

  return {
    slug: problem.slug,
    title: problem.title,
    language,
    code: code ?? null,
    availableLanguages: Object.keys(problem.solutions),
    keyPoints: problem.keyPoints,
  };
}
```

Create `algo-coach-mcp/src/tools/get-theory.ts`:
```typescript
import type { ContentIndex } from "../content/index.js";
import type { Topic } from "../types.js";

export function getTheory(
  contentIndex: ContentIndex,
  params: { topic: Topic }
): object {
  const content = contentIndex.getTheoryContent(params.topic);
  if (!content) {
    return { error: `Theory not found for topic: ${params.topic}` };
  }

  return {
    topic: params.topic,
    content,
  };
}
```

Create `algo-coach-mcp/src/tools/get-real-world-cases.ts`:
```typescript
import { loadCasesForAlgorithm } from "../cases/loader.js";

export function getRealWorldCases(params: { algorithm: string }): object {
  const cases = loadCasesForAlgorithm(params.algorithm);
  if (cases.length === 0) {
    return {
      algorithm: params.algorithm,
      cases: [],
      note: "No pre-authored cases available. AI can generate contextual examples on demand.",
    };
  }

  return {
    algorithm: params.algorithm,
    cases,
  };
}
```

Create `algo-coach-mcp/src/tools/generate-test-cases.ts`:
```typescript
import type { ContentIndex } from "../content/index.js";
import { generateTestCases as genTests } from "../testgen/generator.js";

export function generateTestCasesTool(
  contentIndex: ContentIndex,
  params: { slug: string }
): object {
  const problem = contentIndex.getProblem(params.slug);
  if (!problem) {
    return { error: `Problem not found: ${params.slug}` };
  }

  const suite = genTests(params.slug, problem.topic);
  return suite;
}
```

Create `algo-coach-mcp/src/tools/run-user-code.ts`:
```typescript
import { runPythonCode } from "../executor/python-runner.js";
import type { TestCase } from "../types.js";

export async function runUserCode(params: {
  code: string;
  functionName: string;
  testCases: TestCase[];
  language?: string;
  timeoutMs?: number;
}): Promise<object> {
  const { code, functionName, testCases, language, timeoutMs } = params;

  if (language && language !== "python") {
    return { error: `Language '${language}' not yet supported. MVP supports Python only.` };
  }

  const result = await runPythonCode(code, functionName, testCases, timeoutMs);
  return result;
}
```

Create `algo-coach-mcp/src/tools/get-topic-roadmap.ts`:
```typescript
import type { ContentIndex } from "../content/index.js";

export function getTopicRoadmap(contentIndex: ContentIndex): object {
  const topics = contentIndex.getTopics();

  return {
    topics: topics.map((t) => ({
      id: t.id,
      name: t.name,
      order: t.order,
      problemCount: t.problems.length,
      hasTheory: true,
    })),
  };
}
```

- [ ] **Step 2: Create MCP resources**

Create `algo-coach-mcp/src/resources/index.ts`:
```typescript
import type { ContentIndex } from "../content/index.js";
import { loadCasesForAlgorithm } from "../cases/loader.js";

export function registerResources(contentIndex: ContentIndex) {
  return {
    "algo://topics": () => {
      const topics = contentIndex.getTopics();
      return JSON.stringify(topics.map((t) => ({ id: t.id, name: t.name, order: t.order, problemCount: t.problems.length })));
    },
    "algo://theory/{topic}": (topic: string) => {
      return contentIndex.getTheoryContent(topic as any) || "Not found";
    },
    "algo://problem/{slug}": (slug: string) => {
      const problem = contentIndex.getProblem(slug);
      return problem ? JSON.stringify(problem) : "Not found";
    },
    "algo://cases/{algorithm}": (algorithm: string) => {
      const cases = loadCasesForAlgorithm(algorithm);
      return JSON.stringify(cases);
    },
  };
}
```

- [ ] **Step 3: Create MCP server entry point**

Create `algo-coach-mcp/src/index.ts`:
```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ContentIndex } from "./content/index.js";
import { pickProblem } from "./tools/pick-problem.js";
import { getSolution } from "./tools/get-solution.js";
import { getTheory } from "./tools/get-theory.js";
import { getRealWorldCases } from "./tools/get-real-world-cases.js";
import { generateTestCasesTool } from "./tools/generate-test-cases.js";
import { runUserCode } from "./tools/run-user-code.js";
import { getTopicRoadmap } from "./tools/get-topic-roadmap.js";

const contentIndex = new ContentIndex();

const server = new Server(
  { name: "algo-coach-mcp", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "pick_problem",
      description: "Pick a random problem by topic and/or difficulty",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", enum: ["array", "linked-list", "hash-table", "binary-tree", "dynamic-programming"] },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
      },
    },
    {
      name: "get_solution",
      description: "Get the solution code and key points for a problem",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Problem slug, e.g. '0001.两数之和'" },
          language: { type: "string", enum: ["python", "java", "cpp", "go", "javascript"] },
        },
        required: ["slug"],
      },
    },
    {
      name: "get_theory",
      description: "Get the theory/fundamentals article for a topic",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", enum: ["array", "linked-list", "hash-table", "binary-tree", "dynamic-programming"] },
        },
        required: ["topic"],
      },
    },
    {
      name: "get_real_world_cases",
      description: "Get real-world engineering application cases for an algorithm",
      inputSchema: {
        type: "object",
        properties: {
          algorithm: { type: "string", description: "Algorithm slug, e.g. 'hash-table', 'binary-search', 'dynamic-programming'" },
        },
        required: ["algorithm"],
      },
    },
    {
      name: "generate_test_cases",
      description: "Generate test cases (including edge cases) for a problem",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Problem slug" },
        },
        required: ["slug"],
      },
    },
    {
      name: "run_user_code",
      description: "Run user-submitted Python code against test cases locally",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "User's Python code" },
          functionName: { type: "string", description: "Name of the function to test" },
          testCases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                input: { type: "array" },
                expected: {},
                description: { type: "string" },
                category: { type: "string" },
              },
            },
          },
          timeoutMs: { type: "number", description: "Timeout in milliseconds (default 5000)" },
        },
        required: ["code", "functionName", "testCases"],
      },
    },
    {
      name: "get_topic_roadmap",
      description: "Get the ordered topic roadmap for learning progression",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: object;

    switch (name) {
      case "pick_problem":
        result = pickProblem(contentIndex, args as any);
        break;
      case "get_solution":
        result = getSolution(contentIndex, args as any);
        break;
      case "get_theory":
        result = getTheory(contentIndex, args as any);
        break;
      case "get_real_world_cases":
        result = getRealWorldCases(args as any);
        break;
      case "generate_test_cases":
        result = generateTestCasesTool(contentIndex, args as any);
        break;
      case "run_user_code":
        result = await runUserCode(args as any);
        break;
      case "get_topic_roadmap":
        result = getTopicRoadmap(contentIndex);
        break;
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err}` }] };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: "algo://topics", name: "Topic list", mimeType: "application/json" },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "algo://topics") {
    const topics = contentIndex.getTopics();
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(topics.map((t) => ({ id: t.id, name: t.name, order: t.order, problemCount: t.problems.length }))),
      }],
    };
  }

  return { contents: [{ uri, mimeType: "text/plain", text: "Resource not found" }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd algo-coach-mcp && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add algo-coach-mcp/src/index.ts algo-coach-mcp/src/tools/ algo-coach-mcp/src/resources/
git commit -m "feat: add MCP server with 7 tools and resource endpoints"
```

---

### Task 9: Claude Code Skill

**Files:**
- Create: `algo-coach-mcp/skill/algo-coach.md`

- [ ] **Step 1: Create the skill definition**

Create `algo-coach-mcp/skill/algo-coach.md`:
```markdown
---
name: algo-coach
description: Interactive algorithm practice coach. Presents problems, tests your code, explains solutions, and shows real-world applications.
---

# Algo Coach - Interactive Algorithm Practice

You are an algorithm coach powered by 代码随想录 (LeetCode-Master). You guide users through algorithm practice with testing, hints, and real-world context.

## Setup

This skill requires the `algo-coach-mcp` MCP server to be running. Ensure it's configured in your MCP settings.

## Session Flow

### 1. Greet and Select Mode

Ask the user which mode they prefer:
- **Student Mode** (default): Progressive hints, theory review, encouragement
- **Interview Mode**: Timed, minimal hints, complexity analysis after
- **Engineering Mode**: Focus on real-world applications and system design connections

### 2. Topic Selection

Use `get_topic_roadmap` to present available topics:
1. Array (数组)
2. Linked List (链表)
3. Hash Table (哈希表)
4. Binary Tree (二叉树)
5. Dynamic Programming (动态规划)

If the user is new, recommend starting with Array. If continuing, suggest the next topic in sequence.

### 3. Theory Review (Student Mode)

Before the first problem in a new topic, use `get_theory` to present the theoretical foundation. Summarize key concepts in 3-5 bullet points.

### 4. Present Problem

Use `pick_problem` with the selected topic. Present:
- Problem title and number
- Full description
- Constraints
- Example input/output

Do NOT show the solution yet.

### 5. User Writes Code

Wait for the user to write their solution. They should write a Python function.

### 6. Test the Code

Use `generate_test_cases` to get test cases for the problem, then use `run_user_code` to execute their code against these cases.

Report results clearly:
- If all pass: Congratulate, show stats
- If some fail: Show the first failing case, give a hint based on mode:
  - **Student**: "Think about what happens when the input is [edge case]. What does your algorithm do?"
  - **Interview**: Just show the failing case, no hints unless asked
  - **Engineering**: "In production, this edge case corresponds to [real scenario]"

### 7. Iterate

Let the user fix and resubmit until all tests pass.

### 8. Solution Review

After passing (or if user gives up), use `get_solution` to show the optimal approach from 代码随想录. Highlight:
- Time/space complexity
- Key insights (from keyPoints)
- Comparison with user's approach

### 9. Real-World Connection

Use `get_real_world_cases` with the problem's algorithm to show where this appears in production systems. Present 1-2 cases with:
- The system/project that uses it
- How the algorithm applies
- A code snippet if available

### 10. Next Problem

Suggest the next problem in the topic sequence, or let the user choose.

## Hint Progression (Student Mode)

When the user is stuck, offer hints in 4 levels:
1. **Direction**: "Consider using a [data structure/approach]"
2. **Approach**: "The key insight is [general strategy]"
3. **Pseudocode**: "Here's the algorithm outline: ..."
4. **Solution**: Show the full solution from get_solution

Only advance to the next level when the user asks for more help.

## Commands

The user can say:
- "hint" / "提示" — get the next hint level
- "solution" / "答案" — skip to the solution
- "next" / "下一题" — move to next problem
- "cases" / "应用" — show real-world applications
- "theory" / "理论" — review topic fundamentals
- "skip" / "跳过" — skip this problem
```

- [ ] **Step 2: Commit**

```bash
git add algo-coach-mcp/skill/algo-coach.md
git commit -m "feat: add Claude Code skill for interactive session orchestration"
```

---

### Task 10: Integration Test and Build Verification

**Files:**
- Create: `algo-coach-mcp/tests/tools/pick-problem.test.ts`

- [ ] **Step 1: Write integration test**

Create `algo-coach-mcp/tests/tools/pick-problem.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { ContentIndex } from "../../src/content/index.js";
import { pickProblem } from "../../src/tools/pick-problem.js";
import { getSolution } from "../../src/tools/get-solution.js";
import { getTopicRoadmap } from "../../src/tools/get-topic-roadmap.js";

describe("MCP tools integration", () => {
  let contentIndex: ContentIndex;

  beforeAll(() => {
    contentIndex = new ContentIndex();
  });

  it("pick_problem returns a valid problem for hash-table topic", () => {
    const result = pickProblem(contentIndex, { topic: "hash-table" }) as any;
    expect(result.slug).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.topic).toBe("hash-table");
    expect(result.description.length).toBeGreaterThan(0);
  });

  it("pick_problem filters by difficulty", () => {
    const result = pickProblem(contentIndex, { topic: "array", difficulty: "easy" }) as any;
    expect(result.difficulty).toBe("easy");
  });

  it("get_solution returns python code", () => {
    const result = getSolution(contentIndex, { slug: "0001.两数之和", language: "python" }) as any;
    expect(result.code).toContain("def");
    expect(result.keyPoints.length).toBeGreaterThan(0);
  });

  it("get_topic_roadmap returns all 5 topics in order", () => {
    const result = getTopicRoadmap(contentIndex) as any;
    expect(result.topics).toHaveLength(5);
    expect(result.topics[0].id).toBe("array");
    expect(result.topics[4].id).toBe("dynamic-programming");
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `cd algo-coach-mcp && npx vitest run tests/tools/pick-problem.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 3: Run full test suite**

Run: `cd algo-coach-mcp && npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Build the project**

Run: `cd algo-coach-mcp && npm run build`
Expected: `dist/index.js` created without errors

- [ ] **Step 5: Test the MCP server starts**

Run: `cd algo-coach-mcp && echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js 2>/dev/null | head -1`
Expected: JSON response with server capabilities

- [ ] **Step 6: Commit**

```bash
git add algo-coach-mcp/tests/tools/pick-problem.test.ts
git commit -m "test: add integration tests for MCP tools"
```

---

### Task 11: Configuration and Documentation

**Files:**
- Create: `algo-coach-mcp/README.md`

- [ ] **Step 1: Create README with setup instructions**

Create `algo-coach-mcp/README.md`:
```markdown
# algo-coach-mcp

Interactive algorithm coach MCP server powered by 代码随想录 (LeetCode-Master).

## Quick Start

```bash
cd algo-coach-mcp
npm install
npm run build
```

### Add to Claude Code

```bash
claude mcp add --transport stdio algo-coach -- node /path/to/algo-coach-mcp/dist/index.js
```

Or add to `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "algo-coach": {
      "command": "node",
      "args": ["/path/to/algo-coach-mcp/dist/index.js"]
    }
  }
}
```

### Install the Skill

Copy `skill/algo-coach.md` to your Claude Code skills directory, or invoke it directly.

## Available Tools

| Tool | Description |
|------|-------------|
| `pick_problem` | Pick a random problem by topic/difficulty |
| `get_solution` | Get solution code and key points |
| `get_theory` | Get theoretical fundamentals for a topic |
| `get_real_world_cases` | Real-world engineering applications |
| `generate_test_cases` | Generate boundary test cases |
| `run_user_code` | Execute Python code against tests locally |
| `get_topic_roadmap` | Get the learning progression |

## Development

```bash
npm run dev        # Run with tsx (hot reload)
npm test           # Run tests
npm run build      # Build for production
```
```

- [ ] **Step 2: Commit**

```bash
git add algo-coach-mcp/README.md
git commit -m "docs: add README with setup and usage instructions"
```

---

## Summary

| Task | Component | Files Created |
|------|-----------|--------------|
| 1 | Project scaffolding | package.json, tsconfig, vitest.config, types.ts |
| 2 | Topic mapping | topic-mapping.ts, topic-order.json |
| 3 | Markdown parser | parser.ts |
| 4 | Content index | index.ts, problem-meta.json |
| 5 | Test generation | generator.ts, templates.ts, test-cases/*.json |
| 6 | Python executor | python-runner.ts |
| 7 | Real-world cases | 12 case JSON files, loader.ts |
| 8 | MCP server + tools | index.ts, 7 tool files, resources |
| 9 | Claude Code skill | algo-coach.md |
| 10 | Integration test | pick-problem.test.ts |
| 11 | Documentation | README.md |

Total: 11 tasks, ~40 files, estimated 3-4 hours of implementation time.
