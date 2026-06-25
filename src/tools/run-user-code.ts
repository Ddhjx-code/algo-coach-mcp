import { runPythonCode } from "../executor/python-runner.js";
import type { TestCase } from "../types.js";

export async function runUserCode(params: {
  code: string;
  functionName: string;
  testCases: TestCase[];
  language?: string;
  timeoutMs?: number;
}): Promise<object> {
  const { code, functionName, testCases, language, timeoutMs } = params;

  if (language && language !== "python") {
    return { error: `Language '${language}' not yet supported. MVP supports Python only.` };
  }

  return await runPythonCode(code, functionName, testCases, timeoutMs);
}
