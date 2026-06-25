import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseProblemMarkdown } from "../src/content/parser.js";
import type { ProblemEntry, Difficulty, Topic } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PROBLEMS_DIR = resolve(ROOT, "problems");
const DATA_DIR = resolve(ROOT, "data");
const TOPIC_ORDER_PATH = resolve(DATA_DIR, "topic-order.json");
const META_PATH = resolve(DATA_DIR, "problem-meta.json");
const OUTPUT_PATH = resolve(DATA_DIR, "content-index.json");

interface TopicOrderEntry {
  id: Topic;
  name: string;
  theoryFile: string;
  summaryFile: string;
  order: number;
  problems: string[];
}

interface ProblemMeta {
  difficulty: Difficulty;
  algorithms: string[];
}

interface ContentIndexData {
  problems: ProblemEntry[];
  theories: Record<string, string>;
}

function main() {
  if (!existsSync(PROBLEMS_DIR)) {
    console.error(
      "Error: problems/ directory not found. Clone leetcode-master/problems into the project root first."
    );
    process.exit(1);
  }

  const topicEntries: TopicOrderEntry[] = JSON.parse(
    readFileSync(TOPIC_ORDER_PATH, "utf-8")
  );
  const metaMap: Record<string, ProblemMeta> = JSON.parse(
    readFileSync(META_PATH, "utf-8")
  );

  const problems: ProblemEntry[] = [];
  let skipped = 0;

  for (const topic of topicEntries) {
    for (const slug of topic.problems) {
      const filePath = resolve(PROBLEMS_DIR, `${slug}.md`);
      if (!existsSync(filePath)) {
        skipped++;
        continue;
      }

      const content = readFileSync(filePath, "utf-8");
      const parsed = parseProblemMarkdown(content, slug);
      const meta = metaMap[slug] ?? { difficulty: "medium" as Difficulty, algorithms: [] };

      problems.push({
        ...parsed,
        topic: topic.id,
        difficulty: meta.difficulty,
        algorithms: meta.algorithms,
      });
    }
  }

  const theories: Record<string, string> = {};
  for (const topic of topicEntries) {
    const theoryPath = resolve(PROBLEMS_DIR, topic.theoryFile);
    if (existsSync(theoryPath)) {
      theories[topic.id] = readFileSync(theoryPath, "utf-8");
    }
  }

  const output: ContentIndexData = { problems, theories };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output), "utf-8");

  const sizeKB = Math.round(Buffer.byteLength(JSON.stringify(output)) / 1024);
  console.log(
    `Built content-index.json: ${problems.length} problems, ${Object.keys(theories).length} theories, ${sizeKB}KB`
  );
  if (skipped > 0) {
    console.log(`Skipped ${skipped} problems (markdown not found)`);
  }
}

main();
