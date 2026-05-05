import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const appRoot = process.cwd();
const backendRoots = ["app", "lib"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoredDirectories = new Set([".next", "node_modules", "public", "tests"]);

function walkDirectory(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDirectory(fullPath));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function hasUseClientDirective(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression)
    ) {
      if (statement.expression.text === "use client") {
        return true;
      }

      continue;
    }

    return false;
  }

  return false;
}

function isConsoleCall(node) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "console"
  );
}

function findConsoleCalls(sourceFile) {
  const violations = [];

  function visit(node) {
    if (isConsoleCall(node)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );

      violations.push({
        line: line + 1,
        column: character + 1,
        method: node.expression.name.text,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

const violations = [];

for (const root of backendRoots) {
  const rootPath = path.join(appRoot, root);

  if (!statSync(rootPath, { throwIfNoEntry: false })?.isDirectory()) {
    continue;
  }

  for (const filePath of walkDirectory(rootPath)) {
    const contents = readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      contents,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS,
    );

    if (hasUseClientDirective(sourceFile)) {
      continue;
    }

    for (const violation of findConsoleCalls(sourceFile)) {
      violations.push({
        filePath: path.relative(appRoot, filePath),
        ...violation,
      });
    }
  }
}

if (violations.length > 0) {
  console.error(
    "Raw console.* calls are not allowed in backend code. Use lib/observability/logger.ts instead.",
  );

  for (const violation of violations) {
    console.error(
      `${violation.filePath}:${violation.line}:${violation.column} console.${violation.method}(...)`,
    );
  }

  process.exit(1);
}

console.log("Backend logging check passed.");
