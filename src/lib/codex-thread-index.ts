import { getCodexStateDatabasePath } from "@/lib/config";
import { encodeProjectKey, decodeProjectKey } from "@/lib/project-key";
import { runSqliteJson, sqlString } from "@/lib/sqlite";
import type { ProjectSummary, ThreadSummary } from "@/lib/types";

interface ThreadRow {
  id: string;
  cwd: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  archived: number;
  rolloutPath: string;
}

function toIsoTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

function mapThread(row: ThreadRow): ThreadSummary {
  return {
    id: row.id,
    cwd: row.cwd,
    title: row.title,
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt),
    archived: Boolean(row.archived),
    rolloutPath: row.rolloutPath,
  };
}

function fetchThreads(sql: string): ThreadSummary[] {
  return runSqliteJson<ThreadRow>(getCodexStateDatabasePath(), sql, {
    readonly: true,
  }).map(mapThread);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const threads = fetchThreads(`
    select
      id,
      cwd,
      title,
      created_at as createdAt,
      updated_at as updatedAt,
      archived,
      rollout_path as rolloutPath
    from threads
    where archived = 0
    order by updated_at desc, created_at desc;
  `);

  const projectMap = new Map<string, ProjectSummary>();

  for (const thread of threads) {
    const existing = projectMap.get(thread.cwd);

    if (existing) {
      existing.threadCount += 1;

      if (thread.updatedAt > existing.lastUpdatedAt) {
        existing.lastUpdatedAt = thread.updatedAt;
      }

      continue;
    }

    projectMap.set(thread.cwd, {
      cwd: thread.cwd,
      projectKey: encodeProjectKey(thread.cwd),
      threadCount: 1,
      lastUpdatedAt: thread.updatedAt,
    });
  }

  return [...projectMap.values()].sort((left, right) =>
    right.lastUpdatedAt.localeCompare(left.lastUpdatedAt),
  );
}

export async function listThreadsByProject(
  projectKey: string,
): Promise<ThreadSummary[]> {
  const cwd = decodeProjectKey(projectKey);

  return fetchThreads(`
    select
      id,
      cwd,
      title,
      created_at as createdAt,
      updated_at as updatedAt,
      archived,
      rollout_path as rolloutPath
    from threads
    where archived = 0
      and cwd = ${sqlString(cwd)}
    order by updated_at desc, created_at desc;
  `);
}

export async function getThreadById(
  threadId: string,
): Promise<ThreadSummary | null> {
  const [thread] = fetchThreads(`
    select
      id,
      cwd,
      title,
      created_at as createdAt,
      updated_at as updatedAt,
      archived,
      rollout_path as rolloutPath
    from threads
    where id = ${sqlString(threadId)}
    limit 1;
  `);

  return thread ?? null;
}
