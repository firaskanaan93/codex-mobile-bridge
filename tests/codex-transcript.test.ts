import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readTranscript } from "@/lib/codex-transcript";

test("readTranscript parses user, assistant, and event items", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-viewer-transcript-"));
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
          content: [{ type: "input_text", text: "hello from mobile" }],
        },
      }),
      JSON.stringify({
        timestamp: "2026-03-27T18:00:10.000Z",
        type: "event_msg",
        payload: {
          type: "agent_message",
          message: "Checking the repository structure now.",
        },
      }),
      JSON.stringify({
        timestamp: "2026-03-27T18:00:20.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Here is the result." }],
        },
      }),
    ].join("\n"),
    "utf8",
  );

  const items = await readTranscript(transcriptPath);

  assert.deepEqual(
    items.map((item) => item.role),
    ["user", "event", "assistant"],
  );
  assert.equal(items[1]?.body, "Checking the repository structure now.");
});

test("readTranscript hides an event when it is the same text as the next assistant message", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-viewer-transcript-"));
  const transcriptPath = path.join(directory, "rollout.jsonl");

  writeFileSync(
    transcriptPath,
    [
      JSON.stringify({
        timestamp: "2026-03-27T18:01:00.000Z",
        type: "event_msg",
        payload: {
          type: "agent_message",
          message: "Same visible text.",
        },
      }),
      JSON.stringify({
        timestamp: "2026-03-27T18:01:01.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Same visible text." }],
        },
      }),
    ].join("\n"),
    "utf8",
  );

  const items = await readTranscript(transcriptPath);

  assert.deepEqual(
    items.map((item) => item.role),
    ["assistant"],
  );
  assert.equal(items[0]?.body, "Same visible text.");
});
