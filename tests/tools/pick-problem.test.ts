import { describe, it, expect, beforeAll } from "vitest";
import { ContentIndex } from "../../src/content/index.js";
import { pickProblem } from "../../src/tools/pick-problem.js";
import { getSolution } from "../../src/tools/get-solution.js";
import { getTopicRoadmap } from "../../src/tools/get-topic-roadmap.js";
import { getRealWorldCases } from "../../src/tools/get-real-world-cases.js";

describe("MCP tools integration", () => {
  let contentIndex: ContentIndex;

  beforeAll(() => {
    contentIndex = new ContentIndex();
  });

  it("pick_problem returns a valid problem for hash-table topic", () => {
    const result = pickProblem(contentIndex, { topic: "hash-table" }) as any;
    expect(result.slug).toBeDefined();
    expect(result.slug.length).toBeGreaterThan(0);
    expect(result.topic).toBe("hash-table");
    expect(typeof result.description).toBe("string");
  });

  it("pick_problem filters by difficulty", () => {
    const result = pickProblem(contentIndex, { topic: "array", difficulty: "easy" }) as any;
    expect(result.difficulty).toBe("easy");
  });

  it("get_solution returns python code for two-sum", () => {
    const result = getSolution(contentIndex, { slug: "0001.两数之和", language: "python" }) as any;
    expect(result.code).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
    expect(result.keyPoints.length).toBeGreaterThan(0);
  });

  it("get_topic_roadmap returns all 5 topics in order", () => {
    const result = getTopicRoadmap(contentIndex) as any;
    expect(result.topics).toHaveLength(5);
    expect(result.topics[0].id).toBe("array");
    expect(result.topics[4].id).toBe("dynamic-programming");
  });

  it("get_real_world_cases returns cases for hash-table", () => {
    const result = getRealWorldCases({ algorithm: "hash-table" }) as any;
    expect(result.cases.length).toBeGreaterThanOrEqual(2);
    expect(result.cases[0].title).toBeDefined();
    expect(result.cases[0].domain).toBeDefined();
  });
});
