import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSqlite } from "@/lib/sqlite";
import { GET as getTimeline } from "@/app/api/threads/[threadId]/timeline/route";
import { POST as postMessage } from "@/app/api/threads/[threadId]/messages/route";

function setupCodexFixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-viewer-api-"));
  const databasePath = path.join(directory, "state.sqlite");
  const queuePath = path.join(directory, "queue.sqlite");
  const transcriptPath = path.join(directory, "rollout.jsonl");

  writeFileSync(
    transcriptPath,
    [
      JSON.stringify({
        timestamp: "2026-03-27T18:00:00.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "first user line" }],
        },
      }),
      JSON.stringify({
        timestamp: "2026-03-27T18:00:05.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "first assistant line" }],
        },
      }),
    ].join("\n"),
    "utf8",
  );

  runSqlite(
    databasePath,
    `
      create table threads (
        id text primary key,
        rollout_path text not null,
        created_at integer not null,
        updated_at integer not null,
        source text not null,
        model_provider text not null,
        cwd text not null,
        title text not null,
        sandbox_policy text not null,
        approval_mode text not null,
        tokens_used integer not null default 0,
        has_user_event integer not null default 0,
        archived integer not null default 0,
        archived_at integer,
        git_sha text,
        git_branch text,
        git_origin_url text,
        cli_version text not null default '',
        first_user_message text not null default '',
        agent_nickname text,
        agent_role text,
        memory_mode text not null default 'enabled',
        model text,
        reasoning_effort text,
        agent_path text
      );

      insert into threads (
        id, rollout_path, created_at, updated_at, source, model_provider, cwd,
        title, sandbox_policy, approval_mode, archived
      ) values (
        'thread-1',
        '${transcriptPath}',
        100,
        200,
        'desktop',
        'openai',
        '/workspace/mobile',
        'Thread for API tests',
        'danger-full-access',
        'never',
        0
      );
    `,
  );

  process.env.CODEX_STATE_DB = databasePath;
  process.env.APP_QUEUE_DB = queuePath;
}

test("POST /api/threads/[threadId]/messages queues a pending message", async () => {
  setupCodexFixture();

  const response = await postMessage(
    new Request("http://localhost/api/threads/thread-1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "queued from test" }),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ threadId: "thread-1" }) },
  );

  assert.equal(response.status, 201);

  const payload = (await response.json()) as {
    item: { status: string; body: string };
  };

  assert.equal(payload.item.status, "pending");
  assert.equal(payload.item.body, "queued from test");
});

test("POST /api/threads/[threadId]/messages rejects empty messages", async () => {
  setupCodexFixture();

  const response = await postMessage(
    new Request("http://localhost/api/threads/thread-1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "   " }),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ threadId: "thread-1" }) },
  );

  assert.equal(response.status, 422);
});

test("GET /api/threads/[threadId]/timeline returns transcript and queued items", async () => {
  setupCodexFixture();

  await postMessage(
    new Request("http://localhost/api/threads/thread-1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "queued from test" }),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ threadId: "thread-1" }) },
  );

  const response = await getTimeline(new Request("http://localhost"), {
    params: Promise.resolve({ threadId: "thread-1" }),
  });

  assert.equal(response.status, 200);

  const payload = (await response.json()) as {
    items: Array<{ source: string; body: string }>;
  };

  assert.equal(payload.items.length, 3);
  assert.equal(
    payload.items.some((item) => item.source === "mobile_queue"),
    true,
  );
});
