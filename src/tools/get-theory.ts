import type { ContentIndex } from "../content/index.js";
import type { Topic } from "../types.js";

export function getTheory(
  contentIndex: ContentIndex,
  params: { topic: Topic }
): object {
  const content = contentIndex.getTheoryContent(params.topic);
  if (!content) {
    return { error: `Theory not found for topic: ${params.topic}` };
  }
  return { topic: params.topic, content };
}
