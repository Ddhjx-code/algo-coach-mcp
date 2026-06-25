import type { ProblemEntry, Topic } from "../types.js";
import type { CheckpointEntry } from "./types.js";
import { TOPIC_NAMES } from "./types.js";
import { mapTagsToTopic, extractAlgorithms } from "./tag-mapper.js";

export function htmlToText(html: string): string {
  return html
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code: string) => {
      const cleaned = code
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');
      return "\n```\n" + cleaned.trim() + "\n```\n";
    })
    .replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<sup>([\s\S]*?)<\/sup>/gi, "^$1")
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, "_$1")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, "[$1]")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildDescription(
  cnHtml: string | null,
  comHtml: string | null
): string {
  const cn = cnHtml ? htmlToText(cnHtml) : null;
  const en = comHtml ? htmlToText(comHtml) : null;

  if (cn && en) {
    return `${cn}\n\n---\n\n**English:**\n\n${en}`;
  }
  return cn ?? en ?? "";
}

export function buildSlug(frontendId: number, title: string): string {
  const padded = String(frontendId).padStart(4, "0");
  return `${padded}.${title}`;
}

export function transformEntry(entry: CheckpointEntry): ProblemEntry {
  const title = entry.cnTitle ?? entry.comTitle ?? entry.titleSlug;
  return {
    slug: buildSlug(entry.frontendId, title),
    title,
    leetcodeSlug: entry.titleSlug,
    number: entry.frontendId,
    topic: mapTagsToTopic(entry.tags),
    difficulty: entry.difficulty,
    algorithms: extractAlgorithms(entry.tags),
    description: buildDescription(entry.cnContent, entry.comContent),
    solutions: {},
    keyPoints: entry.hints,
  };
}

export function mergeWithExisting(
  newEntries: ProblemEntry[],
  existing: ProblemEntry[]
): ProblemEntry[] {
  const existingByNumber = new Map(existing.map((e) => [e.number, e]));

  return newEntries.map((entry) => {
    const old = existingByNumber.get(entry.number);
    if (!old) return entry;

    const hasSolutions =
      Object.keys(old.solutions).length > 0;
    const hasKeyPoints = old.keyPoints.length > 0;

    if (!hasSolutions && !hasKeyPoints) return entry;

    return {
      ...entry,
      solutions: hasSolutions ? old.solutions : entry.solutions,
      keyPoints: hasKeyPoints ? old.keyPoints : entry.keyPoints,
    };
  });
}

interface TopicOrderEntry {
  id: Topic;
  name: string;
  theoryFile: string;
  summaryFile: string;
  order: number;
  problems: string[];
}

export function buildTopicOrder(
  entries: ProblemEntry[],
  existingTopics: TopicOrderEntry[]
): TopicOrderEntry[] {
  const existingMap = new Map(existingTopics.map((t) => [t.id, t]));

  const grouped = new Map<Topic, string[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.topic) ?? [];
    list.push(entry.slug);
    grouped.set(entry.topic, list);
  }

  const allTopics: Topic[] = [
    "array",
    "linked-list",
    "hash-table",
    "string",
    "two-pointers",
    "stack-queue",
    "binary-tree",
    "backtracking",
    "greedy",
    "dynamic-programming",
    "monotonic-stack",
    "graph",
  ];

  return allTopics
    .filter((id) => grouped.has(id))
    .map((id, idx) => {
      const existing = existingMap.get(id);
      return {
        id,
        name: existing?.name ?? TOPIC_NAMES[id],
        theoryFile: existing?.theoryFile ?? "",
        summaryFile: existing?.summaryFile ?? "",
        order: existing?.order ?? idx + 1,
        problems: grouped.get(id) ?? [],
      };
    });
}

export function buildProblemMeta(
  entries: ProblemEntry[]
): Record<string, { difficulty: string; algorithms: string[] }> {
  const meta: Record<string, { difficulty: string; algorithms: string[] }> = {};
  for (const e of entries) {
    meta[e.slug] = { difficulty: e.difficulty, algorithms: e.algorithms };
  }
  return meta;
}
