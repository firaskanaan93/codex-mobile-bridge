import { NextResponse } from "next/server";
import { getThreadById } from "@/lib/codex-thread-index";
import { validateMessageBody } from "@/lib/mobile-queue";
import { QueuedOnlyTransport } from "@/lib/outbound";
import type { TimelineItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface MessageRouteProps {
  params: Promise<{
    threadId: string;
  }>;
}

export async function POST(request: Request, { params }: MessageRouteProps) {
  const { threadId } = await params;
  const thread = await getThreadById(threadId);

  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  try {
    const payload = (await request.json()) as { body?: unknown };
    const body = validateMessageBody(payload.body);
    const queuedMessage = await new QueuedOnlyTransport().send(threadId, body);

    const item: TimelineItem = {
      id: queuedMessage.id,
      source: "mobile_queue",
      role: "user",
      body: queuedMessage.body,
      timestamp: queuedMessage.createdAt,
      status: queuedMessage.status,
    };

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to queue the message.",
      },
      { status: 422 },
    );
  }
}
