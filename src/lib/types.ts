export type TimelineRole = "user" | "assistant" | "event";

export type TimelineSource = "codex";

export type DesktopSendStatus =
  | "accepted"
  | "desktop_busy"
  | "desktop_unavailable"
  | "thread_open_failed"
  | "composer_not_found"
  | "send_failed";

export interface ProjectSummary {
  cwd: string;
  projectKey: string;
  threadCount: number;
  lastUpdatedAt: string;
}

export interface ThreadSummary {
  id: string;
  cwd: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  rolloutPath: string;
}

export interface TimelineItem {
  id: string;
  source: TimelineSource;
  role: TimelineRole;
  body: string;
  timestamp: string;
}

export interface DesktopSendRequest {
  threadId: string;
  cwd: string;
  body: string;
  rolloutPath: string;
}

export interface DesktopSendResult {
  ok: boolean;
  status: DesktopSendStatus;
  message: string;
  startedAt: string;
  completedAt: string;
  observedThreadId?: string;
}
