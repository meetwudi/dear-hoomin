import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function findMainCheckoutRoot(repoRoot) {
  const commonGitDir = gitOutput(["rev-parse", "--git-common-dir"]);
  const absoluteCommonGitDir = resolve(repoRoot, commonGitDir);

  return dirname(absoluteCommonGitDir);
}

const repoRoot = gitOutput(["rev-parse", "--show-toplevel"]);
const mainCheckoutRoot = findMainCheckoutRoot(repoRoot);
const envFiles = ["apps/web/.env.local"];
let copiedCount = 0;

for (const envFile of envFiles) {
  const source = resolve(mainCheckoutRoot, envFile);
  const target = resolve(repoRoot, envFile);

  if (existsSync(target)) {
    console.log(`${envFile} already exists.`);
    continue;
  }

  if (!existsSync(source)) {
    console.error(
      `${envFile} is missing, and no source copy was found at ${source}.`,
    );
    process.exitCode = 1;
    continue;
  }

  copyFileSync(source, target);
  copiedCount += 1;
  console.log(`Copied ${envFile} from ${mainCheckoutRoot}.`);
}

if (process.exitCode) {
  console.error("Worktree bootstrap did not complete.");
} else if (copiedCount === 0) {
  console.log("Worktree bootstrap already satisfied.");
} else {
  console.log("Worktree bootstrap complete.");
}
