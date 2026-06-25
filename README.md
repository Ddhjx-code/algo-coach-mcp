# algo-coach-mcp

[![npm version](https://img.shields.io/npm/v/algo-coach-mcp)](https://www.npmjs.com/package/algo-coach-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Interactive algorithm coach MCP server with 3000+ LeetCode problems, bilingual descriptions (Chinese/English), local code testing, and real-world engineering case mapping.

## Features

- **3000+ Problems** — Full LeetCode free problem database with bilingual descriptions
- **12 Topic Categories** — Array, Linked List, Hash Table, String, Two Pointers, Stack/Queue, Binary Tree, Backtracking, Greedy, DP, Monotonic Stack, Graph
- **Local Code Execution** — Run and test your Python solutions locally, no online judge needed
- **Progressive Hints** — 4-level hint system: direction -> approach -> pseudocode -> full solution
- **Real-World Cases** — See how algorithms apply in production systems (Redis, Kafka, React, etc.)
- **3 Practice Modes** — Student (guided), Interview (timed), Engineering (system design focus)
- **LeetCode Sync** — Built-in script to fetch and update problems from LeetCode API

## Quick Start

### Use with Claude Code (Recommended)

**One command setup** — no local installation needed:

```bash
claude mcp add --transport stdio algo-coach -- npx -y --registry https://registry.npmjs.org/ algo-coach-mcp@latest
```

Restart Claude Code, then start practicing.

### Use with other MCP clients

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "algo-coach": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "--registry", "https://registry.npmjs.org/", "algo-coach-mcp@latest"]
    }
  }
}
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `pick_problem` | Pick a random problem by topic/difficulty |
| `get_solution` | Get solution code and key points |
| `get_theory` | Get theoretical fundamentals for a topic |
| `get_real_world_cases` | Real-world engineering applications of an algorithm |
| `generate_test_cases` | Generate boundary test cases for a problem |
| `run_user_code` | Execute Python code against tests locally |
| `get_topic_roadmap` | Get the learning progression |

## Topics

| # | Topic | Description |
|---|-------|-------------|
| 1 | Array (数组) | Binary search, two pointers, sliding window |
| 2 | Linked List (链表) | Reversal, cycle detection, merge |
| 3 | Hash Table (哈希表) | Lookup, grouping, counting |
| 4 | String (字符串) | Matching, parsing, manipulation |
| 5 | Two Pointers (双指针) | Fast-slow, left-right, sliding window |
| 6 | Stack & Queue (栈与队列) | Monotonic queue, expression parsing |
| 7 | Binary Tree (二叉树) | Traversal, construction, BST |
| 8 | Backtracking (回溯) | Permutations, combinations, subsets |
| 9 | Greedy (贪心) | Interval scheduling, optimization |
| 10 | Dynamic Programming (动态规划) | Knapsack, subsequence, state machines |
| 11 | Monotonic Stack (单调栈) | Next greater element, histogram |
| 12 | Graph (图论) | BFS, DFS, union-find, topological sort |

## LeetCode Sync

Fetch all free problems from LeetCode with bilingual descriptions:

```bash
npm run sync                  # Full sync (~3000 problems, ~50 min)
npm run sync -- --limit 100   # Sync first 100 problems
npm run sync:resume           # Resume interrupted sync
```

Features: checkpoint/resume, rate limiting (2 req/s), retry logic, bilingual (CN + EN).

## Development

```bash
npm install
npm run dev        # Run with tsx (hot reload)
npm run sync       # Sync problems from LeetCode
npm run build      # Build for production
npm test           # Run tests
```

## Architecture

```
src/
├── index.ts           # MCP server entry (stdio transport)
├── paths.ts           # Package root resolution
├── types.ts           # Shared type definitions
├── content/           # Content indexing and parsing
├── sync/              # LeetCode API sync pipeline
├── testgen/           # Test case generation
├── executor/          # Python subprocess runner
├── cases/             # Real-world case loader
├── tools/             # MCP tool implementations
└── resources/         # MCP resource handlers
```

## License

MIT
