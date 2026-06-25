import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { CheckpointData } from "./types.js";

export function loadCheckpoint(path: string): CheckpointData | null {
  try {
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as CheckpointData;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCheckpoint(path: string, data: CheckpointData): void {
  data.updatedAt = new Date().toISOString();
  const tmp = resolve(dirname(path), `.checkpoint-${Date.now()}.tmp`);
  writeFileSync(tmp, JSON.stringify(data), "utf-8");
  renameSync(tmp, path);
}

export function createCheckpoint(totalProblems: number): CheckpointData {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalProblems,
    entries: {},
  };
}
