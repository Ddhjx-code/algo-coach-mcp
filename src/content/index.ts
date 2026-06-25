import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ProblemEntry, TopicMeta, Topic, Difficulty } from "../types.js";
import { parseProblemMarkdown } from "./parser.js";
import { loadTopicMapping, getTopicForProblem } from "./topic-mapping.js";
import { DATA_DIR, PROBLEMS_DIR } from "../paths.js";

const CONTENT_INDEX_PATH = resolve(DATA_DIR, "content-index.json");
const DEFAULT_PROBLEMS_DIR = PROBLEMS_DIR;
const META_PATH = resolve(DATA_DIR, "problem-meta.json");

interface ProblemMeta {
  difficulty: Difficulty;
  algorithms: string[];
}

interface ContentIndexData {
  problems: ProblemEntry[];
  theories: Record<string, string>;
}

export class ContentIndex {
  private problems: Map<string, ProblemEntry> = new Map();
  private topics: TopicMeta[] = [];
  private theories: Record<string, string> = {};

  constructor(problemsDir?: string) {
    this.topics = loadTopicMapping();

    if (!problemsDir && existsSync(CONTENT_INDEX_PATH)) {
      this.loadFromIndex();
    } else {
      this.loadFromFilesystem(problemsDir ?? DEFAULT_PROBLEMS_DIR);
    }
  }

  private loadFromIndex(): void {
    const raw = readFileSync(CONTENT_INDEX_PATH, "utf-8");
    const data: ContentIndexData = JSON.parse(raw);

    for (const entry of data.problems) {
      this.problems.set(entry.slug, entry);
    }

    this.theories = data.theories;
  }

  private loadFromFilesystem(problemsDir: string): void {
    const metaRaw = readFileSync(META_PATH, "utf-8");
    const metaMap: Record<string, ProblemMeta> = JSON.parse(metaRaw);

    const allProblemSlugs = this.topics.flatMap((t) => t.problems);

    for (const slug of allProblemSlugs) {
      const filePath = resolve(problemsDir, `${slug}.md`);
      let content: string;
      try {
        content = readFileSync(filePath, "utf-8");
      } catch {
        continue;
      }

      const parsed = parseProblemMarkdown(content, slug);
      const topic = getTopicForProblem(this.topics, slug) ?? "array";
      const meta = metaMap[slug] ?? { difficulty: "medium", algorithms: [] };

      const entry: ProblemEntry = {
        ...parsed,
        topic,
        difficulty: meta.difficulty,
        algorithms: meta.algorithms,
      };

      this.problems.set(slug, entry);
    }
  }

  getProblem(slug: string): ProblemEntry | undefined {
    return this.problems.get(slug);
  }

  getProblemsForTopic(topic: Topic): ProblemEntry[] {
    const topicMeta = this.topics.find((t) => t.id === topic);
    if (!topicMeta) return [];
    return topicMeta.problems
      .map((slug) => this.problems.get(slug))
      .filter((p): p is ProblemEntry => p !== undefined);
  }

  getTopics(): TopicMeta[] {
    return this.topics;
  }

  getTheoryContent(topic: Topic): string {
    if (this.theories[topic]) {
      return this.theories[topic];
    }

    const topicMeta = this.topics.find((t) => t.id === topic);
    if (!topicMeta) return "";
    const filePath = resolve(DEFAULT_PROBLEMS_DIR, topicMeta.theoryFile);
    try {
      return readFileSync(filePath, "utf-8");
    } catch {
      return "";
    }
  }

  getAllProblems(): ProblemEntry[] {
    return Array.from(this.problems.values());
  }
}
