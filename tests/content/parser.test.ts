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
