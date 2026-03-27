import { NextResponse } from "next/server";
import { getThreadById } from "@/lib/codex-thread-index";
import { sendToDesktopThread } from "@/lib/desktop-controller";
import { validateMessageBody } from "@/lib/message-body";

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
    const result = await sendToDesktopThread({
      threadId: thread.id,
      cwd: thread.cwd,
      body,
      rolloutPath: thread.rolloutPath,
    });

    const statusCode =
      result.status === "accepted"
        ? 200
        : result.status === "desktop_busy"
          ? 409
          : result.status === "desktop_unavailable"
            ? 503
            : 500;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send the message.",
      },
      { status: 422 },
    );
  }
}
