import { describe, it, expect } from "vitest";
import { loadTopicMapping, getTopicForProblem } from "../../src/content/topic-mapping.js";

describe("topic-mapping", () => {
  it("loads all 5 MVP topics from topic-order.json", () => {
    const topics = loadTopicMapping();
    expect(topics).toHaveLength(5);
    expect(topics[0].id).toBe("array");
    expect(topics[4].id).toBe("dynamic-programming");
  });

  it("returns topics ordered by the order field", () => {
    const topics = loadTopicMapping();
    const orders = topics.map((t) => t.order);
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  it("maps a problem slug to its topic", () => {
    const topics = loadTopicMapping();
    const topic = getTopicForProblem(topics, "0001.两数之和");
    expect(topic).toBe("hash-table");
  });

  it("returns undefined for unknown problem", () => {
    const topics = loadTopicMapping();
    const topic = getTopicForProblem(topics, "9999.不存在的题");
    expect(topic).toBeUndefined();
  });
});
