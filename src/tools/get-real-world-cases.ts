import { loadCasesForAlgorithm } from "../cases/loader.js";

export function getRealWorldCases(params: { algorithm: string }): object {
  const cases = loadCasesForAlgorithm(params.algorithm);
  if (cases.length === 0) {
    return {
      algorithm: params.algorithm,
      cases: [],
      note: "No pre-authored cases available. AI can generate contextual examples on demand.",
    };
  }
  return { algorithm: params.algorithm, cases };
}
