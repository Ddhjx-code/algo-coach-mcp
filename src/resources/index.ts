import type { ContentIndex } from "../content/index.js";
import type { Topic } from "../types.js";
import { loadCasesForAlgorithm } from "../cases/loader.js";

export function getResourceContent(contentIndex: ContentIndex, uri: string): string {
  if (uri === "algo://topics") {
    const topics = contentIndex.getTopics();
    return JSON.stringify(topics.map((t) => ({ id: t.id, name: t.name, order: t.order, problemCount: t.problems.length })));
  }

  const theoryMatch = uri.match(/^algo:\/\/theory\/(.+)$/);
  if (theoryMatch) {
    return contentIndex.getTheoryContent(theoryMatch[1] as Topic) || "Not found";
  }

  const problemMatch = uri.match(/^algo:\/\/problem\/(.+)$/);
  if (problemMatch) {
    const problem = contentIndex.getProblem(problemMatch[1]);
    return problem ? JSON.stringify(problem) : "Not found";
  }

  const casesMatch = uri.match(/^algo:\/\/cases\/(.+)$/);
  if (casesMatch) {
    return JSON.stringify(loadCasesForAlgorithm(casesMatch[1]));
  }

  return "Resource not found";
}
