import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Topic, TopicMeta } from "../types.js";
import { DATA_DIR } from "../paths.js";

const DATA_PATH = resolve(DATA_DIR, "topic-order.json");

interface TopicOrderEntry {
  id: Topic;
  name: string;
  theoryFile: string;
  summaryFile: string;
  order: number;
  problems: string[];
}

export function loadTopicMapping(): TopicMeta[] {
  const raw = readFileSync(DATA_PATH, "utf-8");
  const entries: TopicOrderEntry[] = JSON.parse(raw);
  return entries
    .map((e) => ({
      id: e.id,
      name: e.name,
      theoryFile: e.theoryFile,
      summaryFile: e.summaryFile,
      problems: e.problems,
      order: e.order,
    }))
    .sort((a, b) => a.order - b.order);
}

export function getTopicForProblem(
  topics: TopicMeta[],
  slug: string
): Topic | undefined {
  for (const topic of topics) {
    if (topic.problems.includes(slug)) {
      return topic.id;
    }
  }
  return undefined;
}
