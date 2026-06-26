import { describe, it, expect } from "vitest";
import { generateTestCases } from "../../src/testgen/generator.js";
import type { ProblemEntry } from "../../src/types.js";

function makeProblem(overrides: Partial<ProblemEntry> = {}): ProblemEntry {
  return {
    slug: "0001.两数之和",
    title: "两数之和",
    leetcodeSlug: "two-sum",
    number: 1,
    topic: "hash-table",
    difficulty: "easy",
    algorithms: ["hash-table"],
    description: "Given an array of integers...",
    solutions: {
      python: "class Solution:\n    def twoSum(self, nums, target):\n        pass",
    },
    keyPoints: [],
    ...overrides,
  };
}

describe("generateTestCases", () => {
  it("returns pre-authored cases when available", () => {
    const problem = makeProblem();
    const suite = generateTestCases(problem);
    expect(suite.cases.length).toBeGreaterThan(0);
    expect(suite.problemSlug).toBe("0001.两数之和");
  });

  it("extracts functionName from python solution", () => {
    const problem = makeProblem();
    const suite = generateTestCases(problem);
    expect(suite.functionName).toBe("twoSum");
  });

  it("returns template cases for problems without pre-authored tests", () => {
    const problem = makeProblem({
      slug: "9999.fake-problem",
      leetcodeSlug: "fake-problem",
      number: 9999,
      solutions: {},
    });
    const suite = generateTestCases(problem);
    expect(suite.cases.length).toBeGreaterThan(0);
    expect(suite.cases.some((c) => c.category === "edge")).toBe(true);
  });

  it("falls back to 'solution' when no function name found", () => {
    const problem = makeProblem({
      slug: "9999.fake-problem",
      leetcodeSlug: "fake-problem",
      number: 9999,
      solutions: {},
    });
    const suite = generateTestCases(problem);
    expect(suite.functionName).toBe("solution");
  });

  it("extracts functionName from java solution", () => {
    const problem = makeProblem({
      solutions: {
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n    }\n}",
      },
    });
    const suite = generateTestCases(problem);
    expect(suite.functionName).toBe("twoSum");
  });
});
