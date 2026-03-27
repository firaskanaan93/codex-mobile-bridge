import { getThreadById } from "@/lib/codex-thread-index";
import { readTranscript } from "@/lib/codex-transcript";
import type { TimelineItem } from "@/lib/types";

export async function getMergedTimeline(threadId: string): Promise<TimelineItem[]> {
  const thread = await getThreadById(threadId);

  if (!thread) {
    throw new Error("Thread not found.");
  }

  const transcriptItems = await readTranscript(thread.rolloutPath);

  return transcriptItems.sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
}
