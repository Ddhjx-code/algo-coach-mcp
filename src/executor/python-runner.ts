import { execFile } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import type { TestCase, ExecutionResult } from "../types.js";

const DEFAULT_TIMEOUT_MS = 5000;

export async function runPythonCode(
  userCode: string,
  functionName: string,
  testCases: TestCase[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ExecutionResult> {
  const script = buildTestScript(userCode, functionName, testCases);
  const tempDir = mkdtempSync(resolve(tmpdir(), "algo-coach-"));
  const scriptPath = resolve(tempDir, "run.py");

  writeFileSync(scriptPath, script, "utf-8");

  const startTime = Date.now();

  try {
    const output = await executeWithTimeout(scriptPath, timeoutMs);
    const elapsed = Date.now() - startTime;
    return parseOutput(output, testCases, elapsed);
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if (isTimeoutError(err)) {
      return {
        passed: false,
        totalCases: testCases.length,
        passedCases: 0,
        stdout: "",
        stderr: "Error: timeout - execution exceeded time limit",
        timeMs: elapsed,
      };
    }
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    return {
      passed: false,
      totalCases: testCases.length,
      passedCases: 0,
      stdout: "",
      stderr,
      timeMs: elapsed,
    };
  } finally {
    try {
      unlinkSync(scriptPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

function hasClassSolution(code: string): boolean {
  return /^class\s+Solution\b/m.test(code);
}

function buildTestScript(
  userCode: string,
  functionName: string,
  testCases: TestCase[]
): string {
  const casesJson = JSON.stringify(
    testCases.map((c) => ({
      input: c.input,
      expected: c.expected,
      description: c.description,
    }))
  );

  const escapedJson = casesJson.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');

  const callExpr = hasClassSolution(userCode)
    ? `Solution().${functionName}(*case["input"])`
    : `${functionName}(*case["input"])`;

  return `import json
import sys
from typing import *
from collections import *

# User code
${userCode}

# Test runner
cases = json.loads("""${escapedJson}""")
results = []

for i, case in enumerate(cases):
    try:
        actual = ${callExpr}
        passed = actual == case["expected"]
        results.append({
            "index": i,
            "passed": passed,
            "actual": actual,
            "expected": case["expected"],
            "description": case["description"]
        })
    except Exception as e:
        results.append({
            "index": i,
            "passed": False,
            "actual": None,
            "expected": case["expected"],
            "description": case["description"],
            "error": str(e)
        })

print(json.dumps(results))
`;
}

function executeWithTimeout(
  scriptPath: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      [scriptPath],
      { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed || error.code === "ETIMEDOUT") {
            reject({ timeout: true, stderr: "timeout" });
          } else {
            reject({ stderr: stderr || error.message });
          }
          return;
        }
        resolve(stdout);
      }
    );
  });
}

function isTimeoutError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "timeout" in err &&
    (err as { timeout: boolean }).timeout === true
  );
}

function parseOutput(
  stdout: string,
  testCases: TestCase[],
  timeMs: number
): ExecutionResult {
  try {
    const results = JSON.parse(stdout.trim()) as Array<{
      index: number;
      passed: boolean;
      actual: unknown;
      expected: unknown;
      description: string;
      error?: string;
    }>;

    const passedCases = results.filter((r) => r.passed).length;
    const firstFailed = results.find((r) => !r.passed);

    return {
      passed: passedCases === testCases.length,
      totalCases: testCases.length,
      passedCases,
      failedCase: firstFailed
        ? {
            input: testCases[firstFailed.index].input,
            expected: firstFailed.expected,
            actual: firstFailed.actual,
            description: firstFailed.description,
          }
        : undefined,
      stdout: "",
      stderr: "",
      timeMs,
    };
  } catch {
    return {
      passed: false,
      totalCases: testCases.length,
      passedCases: 0,
      stdout,
      stderr: "Failed to parse test runner output",
      timeMs,
    };
  }
}
