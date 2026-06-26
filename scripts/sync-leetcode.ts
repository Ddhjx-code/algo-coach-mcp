import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { LeetCodeClient } from "../src/sync/leetcode-client.js";
import {
  loadCheckpoint,
  saveCheckpoint,
  createCheckpoint,
} from "../src/sync/checkpoint.js";
import {
  transformEntry,
  mergeWithExisting,
  buildTopicOrder,
  buildProblemMeta,
  parseExamplesFromHtml,
} from "../src/sync/transformer.js";
import { DIFFICULTY_MAP } from "../src/sync/types.js";
import type { CheckpointEntry } from "../src/sync/types.js";
import type { ProblemEntry } from "../src/types.js";

const DATA_DIR = resolve(import.meta.dirname ?? ".", "../data");
const CHECKPOINT_PATH = resolve(DATA_DIR, ".sync-checkpoint.json");
const CONTENT_INDEX_PATH = resolve(DATA_DIR, "content-index.json");
const TOPIC_ORDER_PATH = resolve(DATA_DIR, "topic-order.json");
const PROBLEM_META_PATH = resolve(DATA_DIR, "problem-meta.json");
const TEST_CASES_DIR = resolve(DATA_DIR, "test-cases");

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    resume: args.includes("--resume") || args.includes("-r"),
    limit: parseInt(args[args.indexOf("--limit") + 1]) || 0,
    skipCn: args.includes("--skip-cn"),
    skipCom: args.includes("--skip-com"),
    dryRun: args.includes("--dry-run"),
    rps: parseFloat(args[args.indexOf("--rps") + 1]) || 2,
  };
}

function loadExistingData(): {
  problems: ProblemEntry[];
  theories: Record<string, string>;
  topics: Array<{
    id: string;
    name: string;
    theoryFile: string;
    summaryFile: string;
    order: number;
    problems: string[];
  }>;
} {
  try {
    const index = JSON.parse(readFileSync(CONTENT_INDEX_PATH, "utf-8"));
    const topics = JSON.parse(readFileSync(TOPIC_ORDER_PATH, "utf-8"));
    return {
      problems: index.problems ?? [],
      theories: index.theories ?? {},
      topics,
    };
  } catch {
    return { problems: [], theories: {}, topics: [] };
  }
}

async function main() {
  const opts = parseArgs();
  const client = new LeetCodeClient(opts.rps);

  console.log("[sync] Fetching problem list from LeetCode...");
  const list = await client.fetchProblemList();

  const freeProblems = list.stat_status_pairs
    .filter((p) => !p.paid_only)
    .sort((a, b) => a.stat.frontend_question_id - b.stat.frontend_question_id);

  console.log(
    `[sync] Total: ${list.num_total}, Free: ${freeProblems.length}`
  );

  let checkpoint = opts.resume ? loadCheckpoint(CHECKPOINT_PATH) : null;
  if (!checkpoint) {
    checkpoint = createCheckpoint(freeProblems.length);
  }

  const toFetch = opts.limit
    ? freeProblems.slice(0, opts.limit)
    : freeProblems;

  let fetched = 0;
  const alreadyCached = toFetch.filter(
    (p) =>
      checkpoint!.entries[p.stat.question__title_slug]?.comFetched &&
      checkpoint!.entries[p.stat.question__title_slug]?.cnFetched
  ).length;

  console.log(
    `[sync] To fetch: ${toFetch.length}, Already cached: ${alreadyCached}`
  );

  const remaining = toFetch.length - alreadyCached;
  if (remaining > 0) {
    const etaMinutes = Math.ceil((remaining * 2) / (opts.rps * 60));
    console.log(`[sync] ETA: ~${etaMinutes} minutes`);
  }

  for (const problem of toFetch) {
    const slug = problem.stat.question__title_slug;
    const frontendId = problem.stat.frontend_question_id;
    const existing = checkpoint.entries[slug];

    if (existing?.comFetched && existing?.cnFetched) {
      continue;
    }

    const entry: CheckpointEntry = existing ?? {
      titleSlug: slug,
      frontendId,
      comFetched: false,
      cnFetched: false,
      comContent: null,
      cnContent: null,
      cnTitle: null,
      comTitle: null,
      tags: [],
      difficulty: DIFFICULTY_MAP[problem.difficulty.level],
      exampleTestcases: null,
      codeSnippets: null,
      hints: [],
      paidOnly: false,
    };

    if (!opts.skipCom && !entry.comFetched) {
      const detail = await client.fetchQuestionDetail(slug, "com");
      if (detail) {
        entry.comFetched = true;
        entry.comContent = detail.content;
        entry.comTitle = detail.title;
        entry.tags = detail.topicTags;
        entry.exampleTestcases = detail.exampleTestcases;
        entry.codeSnippets = detail.codeSnippets;
        entry.hints = detail.hints;
        if (detail.isPaidOnly) entry.paidOnly = true;
      } else {
        entry.comFetched = true;
        entry.error = "fetch failed (com)";
      }
    }

    if (!opts.skipCn && !entry.cnFetched) {
      const detail = await client.fetchQuestionDetail(slug, "cn");
      if (detail) {
        entry.cnFetched = true;
        entry.cnContent = detail.translatedContent ?? detail.content;
        entry.cnTitle = detail.translatedTitle ?? detail.title;
        if (!entry.tags.length) entry.tags = detail.topicTags;
        if (!entry.exampleTestcases)
          entry.exampleTestcases = detail.exampleTestcases;
        if (!entry.codeSnippets)
          entry.codeSnippets = detail.codeSnippets;
        if (!entry.hints.length) entry.hints = detail.hints;
      } else {
        entry.cnFetched = true;
        entry.error = (entry.error ? entry.error + "; " : "") + "fetch failed (cn)";
      }
    }

    checkpoint.entries[slug] = entry;
    fetched++;

    if (fetched % 10 === 0) {
      saveCheckpoint(CHECKPOINT_PATH, checkpoint);
    }
    if (fetched % 50 === 0 || fetched === remaining) {
      console.log(
        `[sync] [${fetched}/${remaining}] ${slug} (${entry.difficulty})`
      );
    }
  }

  saveCheckpoint(CHECKPOINT_PATH, checkpoint);
  console.log(`[sync] Fetch complete. ${fetched} new problems fetched.`);

  if (opts.dryRun) {
    console.log("[sync] Dry run — skipping file writes.");
    return;
  }

  console.log("[sync] Transforming data...");

  const newEntries = Object.values(checkpoint.entries)
    .filter((e) => !e.paidOnly && (e.comContent || e.cnContent))
    .map(transformEntry)
    .sort((a, b) => a.number - b.number);

  const existing = loadExistingData();
  const merged = mergeWithExisting(newEntries, existing.problems);

  const contentIndex = {
    problems: merged,
    theories: existing.theories,
  };

  const topicOrder = buildTopicOrder(merged, existing.topics as never);
  const problemMeta = buildProblemMeta(merged);

  console.log(
    `[sync] Writing content-index.json (${merged.length} problems, ${(JSON.stringify(contentIndex).length / 1024).toFixed(0)}KB)`
  );
  writeFileSync(CONTENT_INDEX_PATH, JSON.stringify(contentIndex), "utf-8");

  console.log(`[sync] Writing topic-order.json (${topicOrder.length} topics)`);
  writeFileSync(
    TOPIC_ORDER_PATH,
    JSON.stringify(topicOrder, null, 2),
    "utf-8"
  );

  console.log(
    `[sync] Writing problem-meta.json (${Object.keys(problemMeta).length} entries)`
  );
  writeFileSync(
    PROBLEM_META_PATH,
    JSON.stringify(problemMeta, null, 2),
    "utf-8"
  );

  mkdirSync(TEST_CASES_DIR, { recursive: true });
  let testCasesWritten = 0;
  for (const entry of Object.values(checkpoint.entries)) {
    if (entry.paidOnly) continue;
    const html = entry.cnContent ?? entry.comContent;
    const examples = parseExamplesFromHtml(html);
    const filePath = resolve(TEST_CASES_DIR, `${entry.titleSlug}.json`);
    const slug = `${String(entry.frontendId).padStart(4, "0")}.${entry.cnTitle ?? entry.comTitle ?? entry.titleSlug}`;

    if (examples.length > 0) {
      const suite = {
        problemSlug: slug,
        functionName: "solution",
        cases: examples.map((ex, i) => ({
          input: ex.input,
          expected: ex.output,
          description: `example ${i + 1}`,
          category: "basic",
        })),
      };
      writeFileSync(filePath, JSON.stringify(suite, null, 2), "utf-8");
      testCasesWritten++;
    } else if (entry.exampleTestcases) {
      const suite = {
        problemSlug: slug,
        functionName: "solution",
        cases: entry.exampleTestcases
          .split("\n")
          .filter((line) => line.trim())
          .map((input, i) => ({
            input: input.trim(),
            expected: null,
            description: `example ${i + 1}`,
            category: "basic",
          })),
      };
      writeFileSync(filePath, JSON.stringify(suite, null, 2), "utf-8");
      testCasesWritten++;
    }
  }
  console.log(
    `[sync] Writing test-cases/ (${testCasesWritten} files)`
  );

  console.log("[sync] Done!");
  printSummary(merged, topicOrder);
}

function printSummary(
  problems: ProblemEntry[],
  topics: Array<{ id: string; name: string; problems: string[] }>
) {
  console.log("\n--- Summary ---");
  console.log(`Total problems: ${problems.length}`);
  console.log(
    `Easy: ${problems.filter((p) => p.difficulty === "easy").length}, ` +
      `Medium: ${problems.filter((p) => p.difficulty === "medium").length}, ` +
      `Hard: ${problems.filter((p) => p.difficulty === "hard").length}`
  );
  console.log("\nTopics:");
  for (const t of topics) {
    console.log(`  ${t.name} (${t.id}): ${t.problems.length} problems`);
  }
}

main().catch((err) => {
  console.error("[sync] Fatal error:", err);
  process.exit(1);
});
