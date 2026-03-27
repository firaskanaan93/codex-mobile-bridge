import { NextResponse } from "next/server";
import { getThreadById } from "@/lib/codex-thread-index";
import { getMergedTimeline } from "@/lib/timeline";

export const dynamic = "force-dynamic";

interface TimelineRouteProps {
  params: Promise<{
    threadId: string;
  }>;
}

export async function GET(_request: Request, { params }: TimelineRouteProps) {
  const { threadId } = await params;
  const thread = await getThreadById(threadId);

  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  try {
    const items = await getMergedTimeline(threadId);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build the timeline.",
      },
      { status: 500 },
    );
  }
}
