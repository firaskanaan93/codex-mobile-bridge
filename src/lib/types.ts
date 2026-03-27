export type TimelineRole = "user" | "assistant" | "event";

export type TimelineSource = "codex" | "mobile_queue";

export type QueueStatus = "pending" | "failed";

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
  status?: QueueStatus;
}

export interface QueuedMessageRecord {
  id: string;
  threadId: string;
  body: string;
  status: QueueStatus;
  createdAt: string;
  updatedAt: string;
}
