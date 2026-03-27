import { notFound } from "next/navigation";
import { ThreadView } from "@/components/thread-view";
import { getThreadById } from "@/lib/codex-thread-index";
import { encodeProjectKey } from "@/lib/project-key";
import { getMergedTimeline } from "@/lib/timeline";

export const dynamic = "force-dynamic";

interface ThreadPageProps {
  params: Promise<{
    threadId: string;
  }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;
  const thread = await getThreadById(threadId);

  if (!thread) {
    notFound();
  }

  const initialItems = await getMergedTimeline(threadId);

  return (
    <ThreadView
      threadId={thread.id}
      projectKey={encodeProjectKey(thread.cwd)}
      projectCwd={thread.cwd}
      threadTitle={thread.title}
      initialItems={initialItems}
    />
  );
}
