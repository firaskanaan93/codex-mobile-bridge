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
  process.env.CODEX_DESKTOP_CONTROLLER_MODE = "mock-success";
}

test("POST /api/threads/[threadId]/messages returns accepted for desktop handoff", async () => {
  setupCodexFixture();

  const response = await postMessage(
    new Request("http://localhost/api/threads/thread-1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "send from mobile" }),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ threadId: "thread-1" }) },
  );

  assert.equal(response.status, 200);

  const payload = (await response.json()) as {
    status: string;
    ok: boolean;
    observedThreadId?: string;
  };

  assert.equal(payload.ok, true);
  assert.equal(payload.status, "accepted");
  assert.equal(payload.observedThreadId, "thread-1");
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

test("POST /api/threads/[threadId]/messages surfaces controller busy state", async () => {
  setupCodexFixture();
  process.env.CODEX_DESKTOP_CONTROLLER_MODE = "mock-busy";

  const response = await postMessage(
    new Request("http://localhost/api/threads/thread-1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "send from mobile" }),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ threadId: "thread-1" }) },
  );

  assert.equal(response.status, 409);

  const payload = (await response.json()) as {
    status: string;
    ok: boolean;
  };

  assert.equal(payload.ok, false);
  assert.equal(payload.status, "desktop_busy");
});

test("GET /api/threads/[threadId]/timeline returns transcript items", async () => {
  setupCodexFixture();

  const response = await getTimeline(new Request("http://localhost"), {
    params: Promise.resolve({ threadId: "thread-1" }),
  });

  assert.equal(response.status, 200);

  const payload = (await response.json()) as {
    items: Array<{ source: string; body: string }>;
  };

  assert.equal(payload.items.length, 2);
  assert.equal(
    payload.items.every((item) => item.source === "codex"),
    true,
  );
});
