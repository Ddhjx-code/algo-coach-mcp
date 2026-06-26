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

  it("pick_problem returns a valid problem", () => {
    const result = pickProblem(contentIndex, {}) as any;
    expect(result.slug).toBeDefined();
    expect(result.slug.length).toBeGreaterThan(0);
    expect(typeof result.description).toBe("string");
    expect(result.topic).toBeDefined();
  });

  it("pick_problem filters by topic when problems exist", () => {
    const topics = contentIndex.getTopics();
    if (topics.length === 0) return;

    const topicWithProblems = topics.find(
      (t) => contentIndex.getProblemsForTopic(t.id).length > 0
    );
    if (!topicWithProblems) return;

    const result = pickProblem(contentIndex, { topic: topicWithProblems.id }) as any;
    expect(result.topic).toBe(topicWithProblems.id);
  });

  it("pick_problem filters by difficulty when problems exist", () => {
    const allProblems = contentIndex.getAllProblems();
    if (allProblems.length === 0) return;

    const difficulty = allProblems[0].difficulty;
    const result = pickProblem(contentIndex, { difficulty }) as any;
    expect(result.difficulty).toBe(difficulty);
  });

  it("pick_problem includes signatures from solutions", () => {
    const allProblems = contentIndex.getAllProblems();
    const withSolutions = allProblems.find(
      (p) => Object.keys(p.solutions).length > 0
    );
    if (!withSolutions) return;

    const result = pickProblem(contentIndex, { topic: withSolutions.topic }) as any;
    if (result.signatures) {
      expect(typeof result.signatures).toBe("object");
    }
  });

  it("get_topic_roadmap returns topics in order", () => {
    const result = getTopicRoadmap(contentIndex) as any;
    expect(result.topics.length).toBeGreaterThan(0);
    const orders = result.topics.map((t: any) => t.order);
    const sorted = [...orders].sort((a: number, b: number) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("get_real_world_cases returns cases for hash-table", () => {
    const result = getRealWorldCases({ algorithm: "hash-table" }) as any;
    expect(result.cases.length).toBeGreaterThanOrEqual(2);
    expect(result.cases[0].title).toBeDefined();
    expect(result.cases[0].domain).toBeDefined();
  });
});
