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
import { getResourceContent } from "./resources/index.js";

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
        type: "object" as const,
        properties: {
          topic: { type: "string", enum: ["array", "linked-list", "hash-table", "string", "two-pointers", "stack-queue", "binary-tree", "backtracking", "greedy", "dynamic-programming", "monotonic-stack", "graph"] },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
      },
    },
    {
      name: "get_solution",
      description: "Get the solution code and key points for a problem",
      inputSchema: {
        type: "object" as const,
        properties: {
          slug: { type: "string", description: "Problem slug, e.g. '0001.两数之和'" },
          language: { type: "string", enum: ["python", "java", "cpp", "go", "javascript", "typescript"] },
        },
        required: ["slug"],
      },
    },
    {
      name: "get_theory",
      description: "Get the theory/fundamentals article for a topic",
      inputSchema: {
        type: "object" as const,
        properties: {
          topic: { type: "string", enum: ["array", "linked-list", "hash-table", "string", "two-pointers", "stack-queue", "binary-tree", "backtracking", "greedy", "dynamic-programming", "monotonic-stack", "graph"] },
        },
        required: ["topic"],
      },
    },
    {
      name: "get_real_world_cases",
      description: "Get real-world engineering application cases for an algorithm",
      inputSchema: {
        type: "object" as const,
        properties: {
          algorithm: { type: "string", description: "Algorithm slug, e.g. 'hash-table', 'binary-search'" },
        },
        required: ["algorithm"],
      },
    },
    {
      name: "generate_test_cases",
      description: "Generate test cases (including edge cases) for a problem",
      inputSchema: {
        type: "object" as const,
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
        type: "object" as const,
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
          language: { type: "string", description: "Language (only 'python' supported currently)" },
          timeoutMs: { type: "number", description: "Timeout in milliseconds (default 5000)" },
        },
        required: ["code", "functionName", "testCases"],
      },
    },
    {
      name: "get_topic_roadmap",
      description: "Get the ordered topic roadmap for learning progression",
      inputSchema: { type: "object" as const, properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: object;

    switch (name) {
      case "pick_problem":
        result = pickProblem(contentIndex, (args ?? {}) as any);
        break;
      case "get_solution":
        result = getSolution(contentIndex, (args ?? {}) as any);
        break;
      case "get_theory":
        result = getTheory(contentIndex, (args ?? {}) as any);
        break;
      case "get_real_world_cases":
        result = getRealWorldCases((args ?? {}) as any);
        break;
      case "generate_test_cases":
        result = generateTestCasesTool(contentIndex, (args ?? {}) as any);
        break;
      case "run_user_code":
        result = await runUserCode((args ?? {}) as any);
        break;
      case "get_topic_roadmap":
        result = getTopicRoadmap(contentIndex);
        break;
      default:
        return { content: [{ type: "text" as const, text: `Unknown tool: ${name}` }] };
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: "algo://topics", name: "Topic list with ordering", mimeType: "application/json" },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const text = getResourceContent(contentIndex, uri);
  return {
    contents: [{ uri, mimeType: "application/json", text }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
