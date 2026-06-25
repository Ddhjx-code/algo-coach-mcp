import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  return startDir;
}

const PACKAGE_ROOT = findPackageRoot(__dirname);

export const DATA_DIR = resolve(PACKAGE_ROOT, "data");
export const PROBLEMS_DIR = resolve(PACKAGE_ROOT, "problems");
