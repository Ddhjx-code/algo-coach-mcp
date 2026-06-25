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
