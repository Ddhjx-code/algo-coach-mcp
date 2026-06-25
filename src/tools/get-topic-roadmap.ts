import type { ContentIndex } from "../content/index.js";

export function getTopicRoadmap(contentIndex: ContentIndex): object {
  const topics = contentIndex.getTopics();
  return {
    topics: topics.map((t) => ({
      id: t.id,
      name: t.name,
      order: t.order,
      problemCount: t.problems.length,
    })),
  };
}
