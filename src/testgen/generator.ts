import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TestSuite } from "../types.js";
import { TOPIC_TEMPLATES } from "./templates.js";
import { DATA_DIR } from "../paths.js";

const TEST_CASES_DIR = resolve(DATA_DIR, "test-cases");

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
  const candidates = buildCandidates(problemSlug);

  for (const fileName of candidates) {
    const filePath = resolve(TEST_CASES_DIR, `${fileName}.json`);
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

function buildCandidates(problemSlug: string): string[] {
  const candidates: string[] = [];

  const dotIdx = problemSlug.indexOf(".");
  if (dotIdx > 0) {
    candidates.push(problemSlug.slice(dotIdx + 1));
  }
  candidates.push(problemSlug);

  try {
    const files = readdirSync(TEST_CASES_DIR);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const name = f.replace(".json", "");
      if (!candidates.includes(name)) {
        const slugLower = problemSlug.toLowerCase();
        if (slugLower.includes(name) || name.includes(slugLower)) {
          candidates.push(name);
        }
      }
    }
  } catch {
    // test-cases dir may not exist
  }

  return candidates;
}
