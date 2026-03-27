"use client";

import Link from "next/link";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
  type FormEvent,
} from "react";
import { formatDateTime } from "@/lib/date";
import type { TimelineItem } from "@/lib/types";

interface ThreadViewProps {
  threadId: string;
  projectKey: string;
  projectCwd: string;
  threadTitle: string;
  initialItems: TimelineItem[];
}

function itemTone(item: TimelineItem): string {
  if (item.role === "assistant") {
    return "border-cyan-400/35 bg-cyan-300/10 text-white";
  }

  if (item.role === "event") {
    return "border-white/10 bg-white/5 text-white/75";
  }

  if (item.source === "mobile_queue") {
    return "border-amber-400/40 bg-amber-300/12 text-white";
  }

  return "border-lime-400/35 bg-lime-300/10 text-white";
}

function itemLabel(item: TimelineItem): string {
  if (item.role === "assistant") {
    return "Codex";
  }

  if (item.role === "event") {
    return "Event";
  }

  if (item.source === "mobile_queue") {
    return "You from mobile";
  }

  return "You";
}

export function ThreadView({
  threadId,
  projectKey,
  projectCwd,
  threadTitle,
  initialItems,
}: ThreadViewProps) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTimeline = useEffectEvent(async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}/timeline`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { items: TimelineItem[] };

      startTransition(() => {
        setItems(payload.items);
      });
    } catch {
      // Ignore polling failures. They should not break the current view.
    }
  });

  useEffect(() => {
    void refreshTimeline();

    const timer = window.setInterval(() => {
      void refreshTimeline();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: draft }),
      });

      const payload = (await response.json()) as
        | { item: TimelineItem }
        | { error: string };

      if (!response.ok || !("item" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "Failed to queue the message.",
        );
      }

      setDraft("");

      startTransition(() => {
        setItems((currentItems) =>
          [...currentItems, payload.item].sort((left, right) =>
            left.timestamp.localeCompare(right.timestamp),
          ),
        );
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to queue the message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
          <Link className="transition hover:text-white" href="/projects">
            Projects
          </Link>
          <span>/</span>
          <Link
            className="truncate transition hover:text-white"
            href={`/projects/${projectKey}`}
          >
            {projectCwd}
          </Link>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">
            Codex Thread
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {threadTitle}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-white/65">
            Mobile messages are queued locally and marked as pending. This screen
            does not claim that Codex has received them.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 pb-36">
        {items.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/4 p-8 text-sm text-white/65">
            No timeline items were found for this thread yet.
          </div>
        ) : null}

        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-[1.6rem] border p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${itemTone(item)}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-white/55">
              <span>{itemLabel(item)}</span>
              <div className="flex items-center gap-2">
                {item.status ? (
                  <span className="rounded-full border border-current px-2 py-1 text-[10px]">
                    {item.status}
                  </span>
                ) : null}
                <time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-inherit sm:text-[15px]">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#08121b]/92 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <form
            className="rounded-[1.8rem] border border-amber-300/20 bg-black/45 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            onSubmit={handleSubmit}
          >
            <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-amber-100/70">
              Queue Message For This Thread
            </label>
            <textarea
              className="min-h-28 w-full resize-none rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/40"
              name="body"
              placeholder="Write the next message you want queued from mobile."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="text-xs text-white/55">
                {error ? <span className="text-rose-200">{error}</span> : null}
              </div>
              <button
                className="rounded-full border border-amber-300/35 bg-amber-200/12 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-200/18 disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isSending}
                type="submit"
              >
                {isSending ? "Queueing..." : "Queue message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
