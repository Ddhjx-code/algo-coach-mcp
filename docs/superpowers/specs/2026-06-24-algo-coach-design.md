# Algo Coach - Interactive Algorithm Learning Agent

## Overview

An MCP Server + Claude Code Skill that transforms the leetcode-master (代码随想录) repository into an interactive algorithm coach. It combines local problem data, automated test generation, sandboxed code execution, and real-world application case mapping.

## Goals

- Present algorithm problems with context-aware difficulty progression
- Test user-submitted code locally with generated edge cases before optional LeetCode submission
- Provide structured solutions from代码随想录's 229 articles
- Map each algorithm to real-world engineering applications
- Support three learning modes: interview prep, student learning, engineering application

## Architecture

```
┌─ algo-coach-mcp (TypeScript, MCP Server) ────────────────────┐
│                                                                │
│  Tools:                                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ pick_problem(topic, difficulty, mode)                   │   │
│  │ get_hint(slug, level)                                   │   │
│  │ get_solution(slug, language)                            │   │
│  │ get_theory(topic)                                       │   │
│  │ get_real_world_cases(algorithm)                         │   │
│  │ generate_test_cases(slug)                               │   │
│  │ run_user_code(code, language, test_cases)               │   │
│  │ submit_to_leetcode(code, slug, language)                │   │
│  │ get_progress()                                          │   │
│  │ get_topic_roadmap()                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  Resources:                                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ algo://topics              - Topic list with ordering   │   │
│  │ algo://theory/{topic}      - Theory fundamentals        │   │
│  │ algo://problem/{slug}      - Problem detail + solution  │   │
│  │ algo://cases/{algorithm}   - Real-world applications    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  Internal Layers:                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐    │
│  │ Content  │  │ TestGen  │  │ Executor │  │ LeetCode  │    │
│  │ Index    │  │ Engine   │  │ Sandbox  │  │ Proxy     │    │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘    │
└───────────────────────────────────────────────────────────────┘
         ↕ stdio
┌─ algo-coach skill (Claude Code Skill) ────────────────────────┐
│  - Mode selection (interview / student / engineering)          │
│  - Session flow orchestration                                  │
│  - Progress tracking and weak-point analysis                   │
│  - Adaptive hint progression                                   │
└───────────────────────────────────────────────────────────────┘
```

## Components

### 1. Content Index

Parses the 229 markdown files from `problems/` at startup into a structured index:

```typescript
interface ProblemEntry {
  slug: string           // "0001.两数之和"
  title: string          // "两数之和"
  leetcodeSlug: string   // "two-sum"
  number: number         // 1
  topic: Topic           // "hash-table"
  difficulty: Difficulty // "easy" | "medium" | "hard"
  algorithms: string[]   // ["hash-map-lookup"]
  solutions: Map<Language, string>  // extracted code blocks
  keyPoints: string[]    // extracted from 总结 section
}

interface TopicMeta {
  name: string
  theoryFile: string     // "哈希表理论基础.md"
  summaryFile: string    // "哈希表总结.md"
  problems: ProblemEntry[]  // ordered by difficulty
  order: number          // learning sequence position
}
```

Parsing strategy:
- Extract problem number and title from H1
- Extract LeetCode slug from the link in line 1-10
- Identify topic by directory cross-referencing with README's topic groupings
- Extract code blocks by language (```CPP, ```java, ```python, etc.)
- Extract key points from ## 总结 section

### 2. Test Generation Engine

Generates boundary test cases for each problem:

```typescript
interface TestCase {
  input: any[]
  expected: any
  description: string   // "empty array", "single element", "all duplicates"
  category: "basic" | "edge" | "performance"
}

interface TestSuite {
  problemSlug: string
  functionSignature: FunctionSignature
  cases: TestCase[]
}
```

Strategy:
- **Static cases**: Pre-authored for high-frequency problems (top 50)
- **Template cases**: Per-algorithm templates (e.g., array problems always test empty, single, sorted, reverse-sorted, all-same)
- **AI-generated cases**: For remaining problems, Claude generates based on constraints in the problem description

Storage: `data/test-cases/{slug}.json`

### 3. Executor Sandbox

Runs user code safely against test cases.

**MVP (Phase 1)**: subprocess with timeout
```
subprocess.run(["python3", "-c", user_code], timeout=5, capture_output=True)
```
- Wrap user function + test assertions into a single script
- 5-second timeout per test case
- No network access (not enforced in MVP, just convention)

**V1 (Phase 2)**: Docker container
```
docker run --rm --network=none --memory=256m --cpus=1 \
  algo-coach-sandbox:python python3 /run.py
```
- Network disabled
- Memory/CPU limits
- Fresh container per execution
- Multi-language support via different images

### 4. LeetCode Proxy

Delegates to `jinzcdev/leetcode-mcp-server` or reimplements the minimal subset:
- `run_code(slug, code, language)` - run against LeetCode's test cases
- `submit_solution(slug, code, language)` - full submission

Authentication: user provides LEETCODE_SESSION cookie via env var.

### 5. Real-World Application Cases

The core differentiator. Maps algorithms to engineering scenarios:

```typescript
interface RealWorldCase {
  algorithm: string        // "sliding-window"
  title: string           // "TCP Flow Control"
  domain: string          // "networking"
  description: string     // 2-3 paragraphs explaining the connection
  codeSnippet?: string    // simplified real-world code example
  sourceProject?: string  // "Linux kernel net/ipv4/tcp_input.c"
}
```

Content sources:
1. **Pre-authored** (`data/cases/{algorithm}.json`): 10-15 core algorithms get 2-3 cases each at launch
2. **AI-generated**: Claude generates on-demand when no pre-authored case exists
3. **Community contributed**: Accept PRs to `data/cases/` following a schema

Algorithm-to-application mapping (initial set):

| Algorithm | Real-World Application |
|-----------|----------------------|
| Hash Table | Database indexing, caching (Redis), deduplication |
| Sliding Window | TCP congestion control, rate limiting, streaming analytics |
| Binary Search | Git bisect, package version resolution, database B-trees |
| BFS/DFS | Web crawlers, file system traversal, dependency resolution |
| Trie | Autocomplete, IP routing tables, spell checkers |
| Topological Sort | Build systems (Make/Bazel), task scheduling, course prerequisites |
| Dynamic Programming | Route planning (GPS), text diff (git diff), resource allocation |
| Union-Find | Network connectivity, image segmentation, Kruskal's MST |
| Monotonic Stack | Stock span problem, histogram area, temperature tracking |
| Heap/Priority Queue | OS process scheduling, event-driven simulation, K-way merge |
| Backtracking | Regex matching, constraint solvers (Sudoku), compiler optimization |
| Greedy | Huffman coding, job scheduling, coin change in vending machines |

### 6. Claude Code Skill

Orchestrates the learning session:

```markdown
# algo-coach skill

## Modes

### Interview Mode
- Timed practice (25 min per problem)
- No hints unless asked
- Post-submission: complexity analysis + optimal comparison
- Weekly mock interview sets

### Student Mode  
- Progressive hints (4 levels: direction → approach → pseudocode → solution)
- Theory review before first problem in each topic
- Encourages independent thinking before revealing answers

### Engineering Mode
- Focus on real-world application cases
- "When would you use this in production?"
- System design connections
- Performance characteristics in real systems
```

Session flow:
```
1. [Skill] Ask mode preference (or remember from last session)
2. [Skill] Present topic roadmap, suggest next topic
3. [MCP] pick_problem → return problem description
4. [User] Writes solution
5. [MCP] generate_test_cases → create edge cases
6. [MCP] run_user_code → execute locally, return results
7. [Skill] If failing: offer hints based on mode
8. [User] Iterates until passing
9. [MCP] Optional: submit_to_leetcode for official verdict
10. [MCP] get_solution → show optimal approach from代码随想录
11. [MCP] get_real_world_cases → show where this algorithm lives in production
12. [Skill] Update progress, suggest next problem
```

## Data Layout

```
algo-coach-mcp/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── content/
│   │   ├── parser.ts         # Markdown → structured data
│   │   └── index.ts          # In-memory content index
│   ├── testgen/
│   │   ├── generator.ts      # Test case generation logic
│   │   └── templates/        # Per-algorithm test templates
│   ├── executor/
│   │   ├── sandbox.ts        # Code execution abstraction
│   │   ├── python-runner.ts  # Python subprocess runner
│   │   └── docker-runner.ts  # Docker-based runner (V1)
│   ├── leetcode/
│   │   └── proxy.ts          # LeetCode API integration
│   ├── tools/                # MCP tool definitions
│   └── resources/            # MCP resource definitions
├── data/
│   ├── test-cases/           # Pre-authored test cases
│   ├── cases/                # Real-world application cases
│   ├── topic-order.json      # Learning sequence
│   └── problem-index.json    # Generated at build time
├── skill/
│   └── algo-coach.md         # Claude Code skill definition
├── problems/                 # Symlink or copy of leetcode-master/problems
└── package.json
```

## MVP Scope (Phase 1)

What's in:
- Content parser for all 229 articles
- 5 topics fully working: array, hash-table, linked-list, binary-tree, dynamic-programming
- Test case generation (template-based + AI fallback)
- Python subprocess executor with timeout
- 3-5 pre-authored real-world cases per algorithm
- Basic skill with student mode flow
- Progress stored in local JSON file

What's out:
- Docker sandboxing (use subprocess with timeout)
- LeetCode submission (just local testing)
- Multi-language execution
- Community contribution workflow
- Interview timer mode
- Weak-point analysis

## Tech Stack

- **MCP Server**: TypeScript, `@modelcontextprotocol/sdk`
- **Test Execution**: Python subprocess (MVP), Docker (V1)
- **Data Storage**: JSON files (MVP), SQLite (V1)
- **Skill**: Markdown-based Claude Code skill
- **Build**: tsup or esbuild for bundling

## Phased Delivery

### Phase 1 - MVP (2-3 weeks)
- Content parser + index
- Template-based test generation for 5 topics
- Python subprocess executor
- Core MCP tools: pick_problem, run_user_code, get_solution, get_real_world_cases
- Basic skill with student mode
- Pre-authored cases for 12 algorithms

### Phase 2 - V1 (2-3 weeks after MVP)
- Docker sandbox executor
- LeetCode API integration (run + submit)
- All 229 problems indexed and testable
- Interview mode with timer
- Engineering mode with deeper case studies
- Progress persistence + weak-point analysis

### Phase 3 - V2 (ongoing)
- Multi-language support (JS, Go, Java, C++)
- Community contribution workflow for cases
- Spaced repetition for review scheduling
- Performance benchmarking against optimal solutions
- Publishing to npm registry
