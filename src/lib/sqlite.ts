import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

interface SqliteOptions {
  json?: boolean;
  readonly?: boolean;
}

function buildArgs(dbPath: string, options: SqliteOptions): string[] {
  const args: string[] = [];

  if (options.json) {
    args.push("-json");
  }

  if (options.readonly) {
    args.push("-readonly");
  }

  args.push(dbPath);

  return args;
}

export function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function ensureParentDirectory(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

export function runSqlite(dbPath: string, sql: string, options: SqliteOptions = {}) {
  if (!options.readonly) {
    ensureParentDirectory(dbPath);
  }

  const result = spawnSync("sqlite3", buildArgs(dbPath, options), {
    encoding: "utf8",
    input: sql,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "sqlite3 command failed");
  }

  return result.stdout;
}

export function runSqliteJson<T>(
  dbPath: string,
  sql: string,
  options: Omit<SqliteOptions, "json"> = {},
): T[] {
  const raw = runSqlite(dbPath, sql, { ...options, json: true }).trim();

  if (!raw) {
    return [];
  }

  return JSON.parse(raw) as T[];
}
