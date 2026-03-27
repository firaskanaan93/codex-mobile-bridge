import { readFileSync } from "node:fs";
import type { TimelineItem } from "@/lib/types";

interface TranscriptRecord {
  timestamp?: string;
  type?: string;
  payload?: {
    type?: string;
    role?: string;
    phase?: string;
    message?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };
}

function extractContentText(
  content: Array<{ type?: string; text?: string }> | undefined,
): string {
  if (!content) {
    return "";
  }

  return content
    .filter((item) =>
      ["input_text", "output_text", "text"].includes(item.type ?? ""),
    )
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
}

function parseRecord(record: TranscriptRecord, index: number): TimelineItem | null {
  if (
    record.type === "response_item" &&
    record.payload?.type === "message" &&
    (record.payload.role === "user" || record.payload.role === "assistant")
  ) {
    const body = extractContentText(record.payload.content);

    if (!body) {
      return null;
    }

    return {
      id: `codex-message-${index}`,
      source: "codex",
      role: record.payload.role,
      body,
      timestamp: record.timestamp ?? new Date(0).toISOString(),
    };
  }

  if (
    record.type === "event_msg" &&
    record.payload?.type === "agent_message" &&
    record.payload.message
  ) {
    return {
      id: `codex-event-${index}`,
      source: "codex",
      role: "event",
      body: record.payload.message.trim(),
      timestamp: record.timestamp ?? new Date(0).toISOString(),
    };
  }

  return null;
}

export async function readTranscript(rolloutPath: string): Promise<TimelineItem[]> {
  const raw = readFileSync(rolloutPath, "utf8");
  const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);

  return lines
    .map((line, index) => parseRecord(JSON.parse(line) as TranscriptRecord, index))
    .filter((item): item is TimelineItem => item !== null)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}
