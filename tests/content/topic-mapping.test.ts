import { describe, it, expect } from "vitest";
import { loadTopicMapping, getTopicForProblem } from "../../src/content/topic-mapping.js";

describe("topic-mapping", () => {
  it("loads topics from topic-order.json", () => {
    const topics = loadTopicMapping();
    expect(topics.length).toBeGreaterThan(0);
    for (const t of topics) {
      expect(t.id).toBeDefined();
      expect(t.name).toBeDefined();
      expect(typeof t.order).toBe("number");
      expect(Array.isArray(t.problems)).toBe(true);
    }
  });

  it("returns topics ordered by the order field", () => {
    const topics = loadTopicMapping();
    const orders = topics.map((t) => t.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("maps a problem slug to its topic", () => {
    const topics = loadTopicMapping();
    const firstTopic = topics[0];
    if (firstTopic.problems.length > 0) {
      const topic = getTopicForProblem(topics, firstTopic.problems[0]);
      expect(topic).toBe(firstTopic.id);
    }
  });

  it("returns undefined for unknown problem", () => {
    const topics = loadTopicMapping();
    const topic = getTopicForProblem(topics, "9999.不存在的题");
    expect(topic).toBeUndefined();
  });
});
