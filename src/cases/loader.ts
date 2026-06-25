import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { RealWorldCase } from "../types.js";
import { DATA_DIR } from "../paths.js";

const CASES_DIR = resolve(DATA_DIR, "cases");

export function loadCasesForAlgorithm(algorithm: string): RealWorldCase[] {
  const filePath = resolve(CASES_DIR, `${algorithm}.json`);
  if (!existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as RealWorldCase[];
  } catch {
    return [];
  }
}

export function listAvailableAlgorithms(): string[] {
  try {
    const files = readdirSync(CASES_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}
