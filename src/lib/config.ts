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

export function getQueueDatabasePath(): string {
  return expandHome(
    process.env.APP_QUEUE_DB ?? path.join(process.cwd(), ".data", "mobile-codex.sqlite"),
  );
}
