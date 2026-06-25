import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { TestSuite } from "../types.js";
import { TOPIC_TEMPLATES } from "./templates.js";
import { DATA_DIR } from "../paths.js";

const TEST_CASES_DIR = resolve(DATA_DIR, "test-cases");

const SLUG_TO_FILE: Record<string, string> = {
  "0001.两数之和": "two-sum",
  "0704.二分查找": "binary-search",
};

export function generateTestCases(problemSlug: string, topic: string): TestSuite {
  const preAuthored = loadPreAuthored(problemSlug);
  if (preAuthored) return preAuthored;

  const templateCases = TOPIC_TEMPLATES[topic] ?? [];
  return {
    problemSlug,
    functionName: "solution",
    cases: templateCases,
  };
}

function loadPreAuthored(problemSlug: string): TestSuite | null {
  const fileName = SLUG_TO_FILE[problemSlug];
  if (!fileName) return null;

  const filePath = resolve(TEST_CASES_DIR, `${fileName}.json`);
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as TestSuite;
  } catch {
    return null;
  }
}
