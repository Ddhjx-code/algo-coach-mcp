import type { ContentIndex } from "../content/index.js";
import type { Difficulty, Topic } from "../types.js";

export function pickProblem(
  contentIndex: ContentIndex,
  params: { topic?: Topic; difficulty?: Difficulty }
): object {
  const { topic, difficulty } = params;

  let problems = topic
    ? contentIndex.getProblemsForTopic(topic)
    : contentIndex.getAllProblems();

  if (difficulty) {
    problems = problems.filter((p) => p.difficulty === difficulty);
  }

  if (problems.length === 0) {
    return { error: "No problems found matching criteria" };
  }

  const randomIndex = Math.floor(Math.random() * problems.length);
  const problem = problems[randomIndex];

  return {
    slug: problem.slug,
    title: problem.title,
    number: problem.number,
    difficulty: problem.difficulty,
    topic: problem.topic,
    leetcodeSlug: problem.leetcodeSlug,
    description: problem.description,
    algorithms: problem.algorithms,
  };
}
