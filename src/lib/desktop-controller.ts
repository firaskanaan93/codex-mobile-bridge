import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  getCodexDesktopAppName,
  getDesktopControllerMode,
} from "@/lib/config";
import { readTranscript } from "@/lib/codex-transcript";
import type {
  DesktopSendRequest,
  DesktopSendResult,
  DesktopSendStatus,
  TimelineItem,
} from "@/lib/types";

const execFileAsync = promisify(execFile);
const TRANSCRIPT_OBSERVE_TIMEOUT_MS = 20_000;
const TRANSCRIPT_OBSERVE_INTERVAL_MS = 400;
const UI_BOOT_DELAY_MS = 900;
const UI_PASTE_DELAY_MS = 300;
const COMPOSER_X_RATIO = 0.5;
const COMPOSER_Y_OFFSET = 110;
const TERMINAL_TOGGLE_DELAY_MS = 250;

type ControllerMode = ReturnType<typeof getDesktopControllerMode>;

type TranscriptBaseline = {
  length: number;
  latestTimestamp: string;
};

let activeSendStartedAt = 0;

function nowIso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildResult(
  status: DesktopSendStatus,
  message: string,
  startedAt: string,
  completedAt: string,
  observedThreadId?: string,
): DesktopSendResult {
  return {
    ok: status === "accepted",
    status,
    message,
    startedAt,
    completedAt,
    observedThreadId,
  };
}

function buildMockResult(
  mode: ControllerMode,
  request: DesktopSendRequest,
  startedAt: string,
): DesktopSendResult {
  const completedAt = nowIso();

  switch (mode) {
    case "mock-success":
      return buildResult(
        "accepted",
        "Mock UI controller sent the message from the Codex composer.",
        startedAt,
        completedAt,
        request.threadId,
      );
    case "mock-busy":
      return buildResult(
        "desktop_busy",
        "Mock UI controller is already sending another message.",
        startedAt,
        completedAt,
      );
    case "mock-unavailable":
      return buildResult(
        "desktop_unavailable",
        "Mock UI controller could not reach Codex.app.",
        startedAt,
        completedAt,
      );
    case "mock-thread-open-failed":
      return buildResult(
        "thread_open_failed",
        "Mock UI controller could not open the requested thread.",
        startedAt,
        completedAt,
      );
    case "mock-composer-not-found":
      return buildResult(
        "composer_not_found",
        "Mock UI controller could not focus the composer.",
        startedAt,
        completedAt,
      );
    case "mock-send-failed":
      return buildResult(
        "send_failed",
        "Mock UI controller could not confirm the send.",
        startedAt,
        completedAt,
      );
    default:
      return buildResult(
        "desktop_unavailable",
        "Unsupported controller mode.",
        startedAt,
        completedAt,
      );
  }
}

function snapshotTranscript(items: TimelineItem[]): TranscriptBaseline {
  return {
    length: items.length,
    latestTimestamp: items.at(-1)?.timestamp ?? "",
  };
}

async function readTranscriptBaseline(
  rolloutPath: string,
): Promise<TranscriptBaseline> {
  try {
    return snapshotTranscript(await readTranscript(rolloutPath));
  } catch {
    return {
      length: 0,
      latestTimestamp: "",
    };
  }
}

async function observeTranscriptForNewUserMessage(
  rolloutPath: string,
  body: string,
  baseline: TranscriptBaseline,
): Promise<boolean> {
  const startedAt = Date.now();
  const normalizedBody = body.trim();

  while (Date.now() - startedAt < TRANSCRIPT_OBSERVE_TIMEOUT_MS) {
    try {
      const items = await readTranscript(rolloutPath);
      const appendedItems = items.slice(baseline.length);

      const found = appendedItems.some(
        (item) =>
          item.role === "user" &&
          item.body.trim() === normalizedBody &&
          item.timestamp >= baseline.latestTimestamp,
      );

      if (found) {
        return true;
      }
    } catch {
      // Ignore transient transcript races while Codex updates the file.
    }

    await sleep(TRANSCRIPT_OBSERVE_INTERVAL_MS);
  }

  return false;
}

async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execFileAsync("osascript", ["-e", script], {
    maxBuffer: 1024 * 1024,
  });

  return stdout.trim();
}

function escapeAppleScriptString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function buildComposerSendScript(
  threadId: string,
  body: string,
  options: {
    toggleTerminalFirst?: boolean;
  } = {},
): string {
  const escapedAppName = escapeAppleScriptString(getCodexDesktopAppName());
  const escapedThreadId = escapeAppleScriptString(threadId);
  const escapedBody = escapeAppleScriptString(body);
  const terminalToggleBlock = options.toggleTerminalFirst
    ? `
  tell application "System Events"
    keystroke "j" using {command down}
  end tell
  delay ${TERMINAL_TOGGLE_DELAY_MS / 1000}
`
    : "";

  return `
set targetThread to "${escapedThreadId}"
set targetMessage to "${escapedBody}"
set oldClipboard to the clipboard

try
  do shell script "open -a '" & "${escapedAppName}" & "'"
  delay 0.35
  do shell script "open 'codex://threads/" & targetThread & "'"
  delay ${UI_BOOT_DELAY_MS / 1000}

  tell application "${escapedAppName}" to activate
  delay 0.25
${terminalToggleBlock}

  tell application "System Events"
    if not (exists process "${escapedAppName}") then error "desktop-unavailable"

    tell process "${escapedAppName}"
      set frontmost to true
      if not (exists window 1) then error "thread-open-failed"
      set winPos to position of window 1
      set winSize to size of window 1
    end tell
  end tell

  set x0 to item 1 of winPos
  set y0 to item 2 of winPos
  set w to item 1 of winSize
  set h to item 2 of winSize
  set composeX to x0 + (w * ${COMPOSER_X_RATIO})
  set composeY to y0 + h - ${COMPOSER_Y_OFFSET}

  set the clipboard to targetMessage

  tell application "System Events"
    click at {composeX, composeY}
    delay 0.25
    keystroke "a" using {command down}
    delay 0.12
    key code 51
    delay 0.12
    keystroke "v" using {command down}
    delay ${UI_PASTE_DELAY_MS / 1000}
    key code 36
  end tell

  set the clipboard to oldClipboard
  return "OK"
on error errMsg
  set the clipboard to oldClipboard
  return "ERROR:" & errMsg
end try
`;
}

async function runUiComposerSend(
  request: DesktopSendRequest,
  startedAt: string,
): Promise<DesktopSendResult> {
  const baseline = await readTranscriptBaseline(request.rolloutPath);
  const attempts = [
    {
      toggleTerminalFirst: false,
    },
    {
      toggleTerminalFirst: true,
    },
  ];

  for (const attempt of attempts) {
    let scriptResult = "";

    try {
      scriptResult = await runAppleScript(
        buildComposerSendScript(request.threadId, request.body, {
          toggleTerminalFirst: attempt.toggleTerminalFirst,
        }),
      );
    } catch {
      return buildResult(
        "desktop_unavailable",
        "The laptop could not control Codex.app through macOS automation.",
        startedAt,
        nowIso(),
      );
    }

    if (scriptResult.startsWith("ERROR:desktop-unavailable")) {
      return buildResult(
        "desktop_unavailable",
        "Codex.app is not available on the laptop right now.",
        startedAt,
        nowIso(),
      );
    }

    if (scriptResult.startsWith("ERROR:thread-open-failed")) {
      return buildResult(
        "thread_open_failed",
        "Codex.app opened, but the requested thread did not open.",
        startedAt,
        nowIso(),
      );
    }

    if (!scriptResult.startsWith("OK")) {
      return buildResult(
        "composer_not_found",
        "Codex.app opened, but the message composer could not be controlled.",
        startedAt,
        nowIso(),
      );
    }

    const observed = await observeTranscriptForNewUserMessage(
      request.rolloutPath,
      request.body,
      baseline,
    );

    if (observed) {
      return buildResult(
        "accepted",
        attempt.toggleTerminalFirst
          ? "Message written into the Codex composer and sent after closing the terminal panel."
          : "Message written into the Codex composer and sent from the laptop UI.",
        startedAt,
        nowIso(),
        request.threadId,
      );
    }
  }

  return buildResult(
    "send_failed",
    "The message was written into Codex, but send could not be confirmed in the transcript.",
    startedAt,
    nowIso(),
  );
}

export async function sendToDesktopThread(
  request: DesktopSendRequest,
): Promise<DesktopSendResult> {
  const startedAt = nowIso();
  const mode = getDesktopControllerMode();

  if (activeSendStartedAt !== 0) {
    return buildResult(
      "desktop_busy",
      "Another mobile send is already in progress for Codex.",
      startedAt,
      nowIso(),
    );
  }

  activeSendStartedAt = Date.now();

  try {
    if (mode !== "ui-composer") {
      return buildMockResult(mode, request, startedAt);
    }

    return await runUiComposerSend(request, startedAt);
  } finally {
    activeSendStartedAt = 0;
  }
}
