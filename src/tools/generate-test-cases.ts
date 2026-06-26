import type { ContentIndex } from "../content/index.js";
import { generateTestCases as genTests } from "../testgen/generator.js";

export function generateTestCasesTool(
  contentIndex: ContentIndex,
  params: { slug: string }
): object {
  const problem = contentIndex.getProblem(params.slug);
  if (!problem) {
    return { error: `Problem not found: ${params.slug}` };
  }
  return genTests(problem);
}
