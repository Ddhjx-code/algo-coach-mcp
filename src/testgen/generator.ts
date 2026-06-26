import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ProblemEntry, TestSuite } from "../types.js";
import { TOPIC_TEMPLATES } from "./templates.js";
import { DATA_DIR } from "../paths.js";

const TEST_CASES_DIR = resolve(DATA_DIR, "test-cases");

export function generateTestCases(problem: ProblemEntry): TestSuite {
  const preAuthored = loadPreAuthored(problem.leetcodeSlug, problem.slug);
  const functionName = extractFunctionName(problem);

  if (preAuthored) {
    return { ...preAuthored, functionName };
  }

  const templateCases = TOPIC_TEMPLATES[problem.topic] ?? [];
  return {
    problemSlug: problem.slug,
    functionName,
    cases: templateCases,
  };
}

function loadPreAuthored(leetcodeSlug: string, slug: string): TestSuite | null {
  const candidates = [leetcodeSlug, slug];

  const dotIdx = slug.indexOf(".");
  if (dotIdx > 0) {
    candidates.push(slug.slice(dotIdx + 1));
  }

  for (const name of candidates) {
    const filePath = resolve(TEST_CASES_DIR, `${name}.json`);
    if (!existsSync(filePath)) continue;

    try {
      const raw = readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as TestSuite;
    } catch {
      continue;
    }
  }

  return null;
}

function extractFunctionName(problem: ProblemEntry): string {
  const pythonCode = problem.solutions.python ?? problem.solutions.javascript;
  if (pythonCode) {
    const match = pythonCode.match(/def\s+(\w+)\s*\(/);
    if (match && match[1] !== "__init__") return match[1];

    const jsMatch = pythonCode.match(/(?:var|const|function)\s+(\w+)\s*[=(]/);
    if (jsMatch) return jsMatch[1];
  }

  const javaCode = problem.solutions.java ?? problem.solutions.cpp;
  if (javaCode) {
    const match = javaCode.match(/(?:public|private)\s+\w+[\w<>\[\], ]*\s+(\w+)\s*\(/);
    if (match && match[1] !== "Solution") return match[1];
  }

  return "solution";
}
