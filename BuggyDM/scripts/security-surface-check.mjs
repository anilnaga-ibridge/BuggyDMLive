import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function walk(directory) {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

function count(source, expression) {
  return [...source.matchAll(expression)].length;
}

const apiRoot = join(root, "src/app/api");
for (const file of walk(apiRoot).filter((path) => path.endsWith("route.ts"))) {
  const source = readFileSync(file, "utf8");
  const route = relative(root, file);
  const handlers = count(
    source,
    /export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g,
  );
  const guards =
    route === "src/app/api/auth/login/route.ts"
      ? count(source, /await signInAdmin\s*\(/g)
      : count(source, /await authorizeApi\s*\(/g);
  if (handlers === 0 || handlers !== guards) {
    failures.push(
      `${route} has ${handlers} handlers and ${guards} API permission guards`,
    );
  }
}

const actionsRoot = join(root, "src/app/actions");
for (const file of walk(actionsRoot).filter((path) => path.endsWith(".ts"))) {
  if (file.endsWith("/auth.ts")) continue;
  const source = readFileSync(file, "utf8");
  const actions = count(source, /export async function \w+\s*\(/g);
  const guards = count(source, /await requirePermission\s*\(/g);
  if (actions === 0 || actions !== guards) {
    failures.push(
      `${relative(root, file)} has ${actions} server actions and ${guards} permission guards`,
    );
  }
}

if (existsSync(join(root, "src/middleware.ts"))) {
  failures.push("src/middleware.ts must not be restored; Next.js 16 uses src/proxy.ts");
}
if (!existsSync(join(root, "src/proxy.ts"))) {
  failures.push("src/proxy.ts is missing");
}

if (failures.length > 0) {
  console.error("Security surface check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Security surface check passed.");
}
