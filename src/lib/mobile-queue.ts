import { randomUUID } from "node:crypto";
import { getQueueDatabasePath } from "@/lib/config";
import { runSqlite, runSqliteJson, sqlString } from "@/lib/sqlite";
import type { QueuedMessageRecord } from "@/lib/types";

interface QueueRow {
  id: string;
  threadId: string;
  body: string;
  status: "pending" | "failed";
  createdAt: string;
  updatedAt: string;
}

let initializedDatabasePath: string | null = null;

function getDatabasePath(): string {
  return getQueueDatabasePath();
}

function initializeQueueDatabase(): void {
  const databasePath = getDatabasePath();

  if (initializedDatabasePath === databasePath) {
    return;
  }

  runSqlite(
    databasePath,
    `
      create table if not exists queued_messages (
        id text primary key,
        thread_id text not null,
        body text not null,
        status text not null check (status in ('pending', 'failed')),
        created_at text not null,
        updated_at text not null
      );

      create index if not exists queued_messages_thread_id_created_at_idx
        on queued_messages (thread_id, created_at);
    `,
  );

  initializedDatabasePath = databasePath;
}

function mapQueueRow(row: QueueRow): QueuedMessageRecord {
  return {
    id: row.id,
    threadId: row.threadId,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function validateMessageBody(body: unknown): string {
  if (typeof body !== "string") {
    throw new Error("Message body must be a string.");
  }

  const trimmed = body.trim();

  if (!trimmed) {
    throw new Error("Message body is required.");
  }

  if (trimmed.length > 10_000) {
    throw new Error("Message body is too long.");
  }

  return trimmed;
}

export async function queueMessage(
  threadId: string,
  body: string,
): Promise<QueuedMessageRecord> {
  initializeQueueDatabase();

  const id = randomUUID();
  const now = new Date().toISOString();

  runSqlite(
    getDatabasePath(),
    `
      insert into queued_messages (
        id,
        thread_id,
        body,
        status,
        created_at,
        updated_at
      ) values (
        ${sqlString(id)},
        ${sqlString(threadId)},
        ${sqlString(body)},
        'pending',
        ${sqlString(now)},
        ${sqlString(now)}
      );
    `,
  );

  return {
    id,
    threadId,
    body,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listQueuedMessages(
  threadId: string,
): Promise<QueuedMessageRecord[]> {
  initializeQueueDatabase();

  return runSqliteJson<QueueRow>(
    getDatabasePath(),
    `
      select
        id,
        thread_id as threadId,
        body,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      from queued_messages
      where thread_id = ${sqlString(threadId)}
      order by created_at asc;
    `,
  ).map(mapQueueRow);
}
