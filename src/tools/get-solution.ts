import type { ContentIndex } from "../content/index.js";
import type { Language } from "../types.js";

export function getSolution(
  contentIndex: ContentIndex,
  params: { slug: string; language?: Language }
): object {
  const problem = contentIndex.getProblem(params.slug);
  if (!problem) {
    return { error: `Problem not found: ${params.slug}` };
  }

  const language = params.language ?? "python";
  const code = problem.solutions[language];

  return {
    slug: problem.slug,
    title: problem.title,
    language,
    code: code ?? null,
    availableLanguages: Object.keys(problem.solutions),
    keyPoints: problem.keyPoints,
  };
}
