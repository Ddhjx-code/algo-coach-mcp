# algo-coach-mcp

[![npm version](https://img.shields.io/npm/v/algo-coach-mcp)](https://www.npmjs.com/package/algo-coach-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Interactive algorithm coach MCP server powered by [代码随想录 (LeetCode-Master)](https://github.com/youngyangyang04/leetcode-master).

Turns 45 structured algorithm tutorial articles into an interactive practice environment with local code testing and real-world application case mapping.

## Features

- **Interactive Practice** — Pick problems by topic and difficulty, write code, get instant feedback
- **Local Code Execution** — Run and test your Python solutions locally, no online judge needed
- **Progressive Hints** — 4-level hint system: direction → approach → pseudocode → full solution
- **Real-World Cases** — See how algorithms apply in production systems (Redis, Kafka, React, etc.)
- **3 Practice Modes** — Student (guided), Interview (timed), Engineering (system design focus)
- **Theory Review** — Structured fundamentals from 代码随想录 before each topic

## Quick Start

### Use with Claude Code (Recommended)

**One command setup** — no local installation needed:

```bash
claude mcp add --transport stdio algo-coach -- npx -y --registry https://registry.npmjs.org/ algo-coach-mcp@latest
```

Restart Claude Code, then start practicing:

```
> /algo-coach
```

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

### Install the Skill (Optional)

Copy `.claude/skill/algo-coach.md` to your Claude Code skills directory for the full interactive session flow with auto-setup.

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

| # | Topic | Problems |
|---|-------|----------|
| 1 | Array (数组) | 5 |
| 2 | Linked List (链表) | 6 |
| 3 | Hash Table (哈希表) | 9 |
| 4 | Binary Tree (二叉树) | 13 |
| 5 | Dynamic Programming (动态规划) | 12 |

## Real-World Algorithm Cases

12 algorithms mapped to production engineering scenarios:

`hash-table` · `binary-search` · `sliding-window` · `bfs-dfs` · `trie` · `topological-sort` · `dynamic-programming` · `union-find` · `monotonic-stack` · `heap` · `backtracking` · `greedy`

## Development

```bash
npm install
npm run dev        # Run with tsx (hot reload)
npm test           # Run tests
npm run build      # Build for production
```

## Architecture

```
src/
├── index.ts           # MCP server entry (stdio transport)
├── paths.ts           # Package root resolution
├── types.ts           # Shared type definitions
├── content/           # Markdown parsing and indexing
├── testgen/           # Test case generation
├── executor/          # Python subprocess runner
├── cases/             # Real-world case loader
├── tools/             # MCP tool implementations
└── resources/         # MCP resource handlers
```

## License

MIT
