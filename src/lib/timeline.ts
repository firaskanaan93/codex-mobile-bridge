import { getThreadById } from "@/lib/codex-thread-index";
import { readTranscript } from "@/lib/codex-transcript";
import { listQueuedMessages } from "@/lib/mobile-queue";
import type { TimelineItem } from "@/lib/types";

export async function getMergedTimeline(threadId: string): Promise<TimelineItem[]> {
  const thread = await getThreadById(threadId);

  if (!thread) {
    throw new Error("Thread not found.");
  }

  const [transcriptItems, queuedMessages] = await Promise.all([
    readTranscript(thread.rolloutPath),
    listQueuedMessages(threadId),
  ]);

  const queueItems: TimelineItem[] = queuedMessages.map((message) => ({
    id: message.id,
    source: "mobile_queue",
    role: "user",
    body: message.body,
    timestamp: message.createdAt,
    status: message.status,
  }));

  return [...transcriptItems, ...queueItems].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
}
