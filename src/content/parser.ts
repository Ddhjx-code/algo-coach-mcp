import type { Language, ProblemEntry } from "../types.js";

const LANGUAGE_MAP: Record<string, Language> = {
  python: "python",
  python3: "python",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  CPP: "cpp",
  go: "go",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
};

export function parseProblemMarkdown(
  content: string,
  fileSlug: string
): Omit<ProblemEntry, "topic" | "difficulty" | "algorithms"> {
  const lines = content.split("\n");

  const { number, title } = extractTitle(lines);
  const leetcodeSlug = extractLeetcodeSlug(lines);
  const description = extractDescription(lines);
  const keyPoints = extractKeyPoints(lines);
  const solutions = extractSolutions(content);

  return {
    slug: fileSlug,
    title,
    leetcodeSlug,
    number,
    description,
    solutions,
    keyPoints,
  };
}

function extractTitle(lines: string[]): { number: number; title: string } {
  for (const line of lines) {
    const match = line.match(/^#\s+(\d+)\.\s*(.+)/);
    if (match) {
      return { number: parseInt(match[1], 10), title: match[2].trim() };
    }
  }
  return { number: 0, title: "" };
}

function extractLeetcodeSlug(lines: string[]): string {
  for (const line of lines.slice(0, 15)) {
    const match = line.match(/leetcode\.cn\/problems\/([a-z0-9-]+)/);
    if (match) return match[1];
    const matchGlobal = line.match(/leetcode\.com\/problems\/([a-z0-9-]+)/);
    if (matchGlobal) return matchGlobal[1];
  }
  return "";
}

function extractDescription(lines: string[]): string {
  let start = -1;
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (start === -1 && lines[i].match(/^#\s+\d+\./)) {
      start = i + 1;
      continue;
    }
    if (start !== -1 && lines[i].match(/^##\s+/)) {
      end = i;
      break;
    }
  }

  if (start === -1) return "";
  return lines.slice(start, end).join("\n").trim();
}

function extractKeyPoints(lines: string[]): string[] {
  let inSummary = false;
  const points: string[] = [];

  for (const line of lines) {
    if (line.match(/^##\s+总结/)) {
      inSummary = true;
      continue;
    }
    if (inSummary && line.match(/^##\s+/)) {
      break;
    }
    if (inSummary) {
      const bullet = line.match(/^\*\s+(.+)/);
      if (bullet) {
        points.push(bullet[1].trim());
      }
    }
  }

  return points;
}

function extractSolutions(content: string): Partial<Record<Language, string>> {
  const solutions: Partial<Record<Language, string>> = {};
  const codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const langRaw = match[1];
    const code = match[2].trim();
    const lang = LANGUAGE_MAP[langRaw] || LANGUAGE_MAP[langRaw.toLowerCase()];
    if (lang && !solutions[lang]) {
      solutions[lang] = code;
    }
  }

  return solutions;
}
