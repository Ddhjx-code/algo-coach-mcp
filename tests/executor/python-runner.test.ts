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
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        description: "basic",
        category: "basic",
      },
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
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        description: "basic",
        category: "basic",
      },
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

  it("runs class Solution style code (LeetCode format)", async () => {
    const code = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        lookup = {}
        for i, num in enumerate(nums):
            if target - num in lookup:
                return [lookup[target - num], i]
            lookup[num] = i
        return []
`;
    const cases: TestCase[] = [
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        description: "basic",
        category: "basic",
      },
    ];

    const result = await runPythonCode(code, "twoSum", cases);
    expect(result.passed).toBe(true);
    expect(result.passedCases).toBe(1);
  });

  it("handles runtime errors gracefully", async () => {
    const code = `
def solution(nums):
    return nums[999]
`;
    const cases: TestCase[] = [
      {
        input: [[1, 2, 3]],
        expected: 1,
        description: "out of bounds",
        category: "basic",
      },
    ];

    const result = await runPythonCode(code, "solution", cases);
    expect(result.passed).toBe(false);
  });
});
