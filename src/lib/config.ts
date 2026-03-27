import path from "node:path";
import os from "node:os";

function expandHome(filePath: string): string {
  if (filePath === "~") {
    return os.homedir();
  }

  if (filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }

  return filePath;
}

export function getCodexHome(): string {
  return expandHome(process.env.CODEX_HOME ?? "~/.codex");
}

export function getCodexStateDatabasePath(): string {
  return expandHome(
    process.env.CODEX_STATE_DB ?? path.join(getCodexHome(), "state_5.sqlite"),
  );
}

export function getCodexDesktopAppName(): string {
  return process.env.CODEX_DESKTOP_APP_NAME?.trim() || "Codex";
}

export function getDesktopControllerMode():
  | "ui-composer"
  | "mock-success"
  | "mock-busy"
  | "mock-unavailable"
  | "mock-thread-open-failed"
  | "mock-composer-not-found"
  | "mock-send-failed" {
  switch (process.env.CODEX_DESKTOP_CONTROLLER_MODE) {
    case "mock-success":
    case "mock-busy":
    case "mock-unavailable":
    case "mock-thread-open-failed":
    case "mock-composer-not-found":
    case "mock-send-failed":
      return process.env.CODEX_DESKTOP_CONTROLLER_MODE;
    default:
      return "ui-composer";
  }
}
