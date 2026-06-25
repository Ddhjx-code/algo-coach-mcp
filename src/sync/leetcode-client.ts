import type {
  LeetCodeProblemListResponse,
  LeetCodeQuestionDetail,
  Site,
} from "./types.js";
import { RateLimiter, sleep } from "./rate-limiter.js";

const GRAPHQL_QUERY_COM = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    titleSlug
    difficulty
    isPaidOnly
    content
    exampleTestcases
    topicTags { name slug }
    hints
    codeSnippets { lang langSlug code }
  }
}`;

const GRAPHQL_QUERY_CN = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    translatedTitle
    titleSlug
    difficulty
    isPaidOnly
    content
    translatedContent
    exampleTestcases
    topicTags { name slug }
    hints
    codeSnippets { lang langSlug code }
  }
}`;

const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function graphqlUrl(site: Site): string {
  return site === "cn"
    ? "https://leetcode.cn/graphql"
    : "https://leetcode.com/graphql";
}

function referer(site: Site): string {
  return site === "cn" ? "https://leetcode.cn/" : "https://leetcode.com/";
}

export class LeetCodeClient {
  private limiter: RateLimiter;
  private maxRetries: number;

  constructor(requestsPerSecond: number = 2, maxRetries: number = 3) {
    this.limiter = new RateLimiter(requestsPerSecond);
    this.maxRetries = maxRetries;
  }

  async fetchProblemList(): Promise<LeetCodeProblemListResponse> {
    await this.limiter.acquire();
    const res = await this.fetchWithRetry(
      "https://leetcode.com/api/problems/algorithms/",
      { headers: { ...HEADERS, Accept: "application/json" } }
    );
    return res.json() as Promise<LeetCodeProblemListResponse>;
  }

  async fetchQuestionDetail(
    titleSlug: string,
    site: Site
  ): Promise<LeetCodeQuestionDetail | null> {
    await this.limiter.acquire();

    try {
      const res = await this.fetchWithRetry(graphqlUrl(site), {
        method: "POST",
        headers: { ...HEADERS, Referer: referer(site) },
        body: JSON.stringify({
          query: site === "cn" ? GRAPHQL_QUERY_CN : GRAPHQL_QUERY_COM,
          variables: { titleSlug },
        }),
      });

      const json = (await res.json()) as {
        data?: { question: LeetCodeQuestionDetail | null };
        errors?: Array<{ message: string }>;
      };

      if (json.errors?.length) {
        console.error(`  GraphQL error (${site}): ${json.errors[0].message}`);
        return null;
      }

      return json.data?.question ?? null;
    } catch (err) {
      console.error(
        `  Failed to fetch ${titleSlug} from ${site}:`,
        (err as Error).message
      );
      return null;
    }
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const res = await fetch(url, init);

        if (res.status === 429) {
          const wait = Math.min(60000, 5000 * 2 ** attempt);
          console.warn(`  Rate limited, waiting ${wait / 1000}s...`);
          await sleep(wait);
          continue;
        }

        if (res.status >= 500) {
          const wait = 1000 * 2 ** attempt;
          console.warn(`  Server error ${res.status}, retrying in ${wait / 1000}s...`);
          await sleep(wait);
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      } catch (err) {
        lastError = err as Error;
        if (attempt < this.maxRetries - 1) {
          const wait = 1000 * 2 ** attempt;
          await sleep(wait);
        }
      }
    }

    throw lastError ?? new Error("Fetch failed after retries");
  }
}
