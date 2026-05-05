import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const repoRoot = gitOutput(["rev-parse", "--show-toplevel"]);
const envPath = resolve(repoRoot, "apps/web/.env.local");

if (!existsSync(envPath)) {
  console.error("Missing apps/web/.env.local.");
  console.error("Run: npm run bootstrap:worktree");
  process.exit(1);
}
