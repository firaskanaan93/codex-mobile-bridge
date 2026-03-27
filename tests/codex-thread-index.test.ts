import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSqlite } from "@/lib/sqlite";
import {
  getThreadById,
  listProjects,
  listThreadsByProject,
} from "@/lib/codex-thread-index";
import { encodeProjectKey } from "@/lib/project-key";

function makeCodexDb() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-viewer-db-"));
  const databasePath = path.join(directory, "state.sqlite");

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
    `,
  );

  const transcriptPath = path.join(directory, "thread.jsonl");
  writeFileSync(transcriptPath, "", "utf8");

  runSqlite(
    databasePath,
    `
      insert into threads (
        id, rollout_path, created_at, updated_at, source, model_provider, cwd,
        title, sandbox_policy, approval_mode, archived
      ) values
      (
        'thread-a',
        '${transcriptPath}',
        100,
        300,
        'desktop',
        'openai',
        '/workspace/alpha',
        'Alpha thread',
        'danger-full-access',
        'never',
        0
      ),
      (
        'thread-b',
        '${transcriptPath}',
        120,
        200,
        'desktop',
        'openai',
        '/workspace/alpha',
        'Older alpha thread',
        'danger-full-access',
        'never',
        0
      ),
      (
        'thread-c',
        '${transcriptPath}',
        140,
        400,
        'desktop',
        'openai',
        '/workspace/beta',
        'Beta thread',
        'danger-full-access',
        'never',
        0
      );
    `,
  );

  return databasePath;
}

test("listProjects groups threads by cwd", async () => {
  process.env.CODEX_STATE_DB = makeCodexDb();

  const projects = await listProjects();

  assert.equal(projects.length, 2);
  assert.equal(projects[0]?.cwd, "/workspace/beta");
  assert.equal(projects[1]?.threadCount, 2);
});

test("listThreadsByProject returns only the selected workspace", async () => {
  process.env.CODEX_STATE_DB = makeCodexDb();

  const threads = await listThreadsByProject(encodeProjectKey("/workspace/alpha"));

  assert.deepEqual(
    threads.map((thread) => thread.id),
    ["thread-a", "thread-b"],
  );
});

test("getThreadById returns the mapped thread", async () => {
  process.env.CODEX_STATE_DB = makeCodexDb();

  const thread = await getThreadById("thread-c");

  assert.equal(thread?.cwd, "/workspace/beta");
  assert.equal(thread?.title, "Beta thread");
});
