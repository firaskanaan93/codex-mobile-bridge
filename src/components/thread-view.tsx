"use client";

import Link from "next/link";
import {
  useCallback,
  startTransition,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { formatDateTime } from "@/lib/date";
import type { DesktopSendResult, TimelineItem } from "@/lib/types";

interface ThreadViewProps {
  threadId: string;
  projectKey: string;
  projectCwd: string;
  threadTitle: string;
  initialItems: TimelineItem[];
}

function itemLabel(item: TimelineItem): string {
  if (item.role === "assistant") {
    return "Codex";
  }
  if (item.role === "event") {
    return "Event";
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const previousItemsCount = useRef(initialItems.length);

  // Scroll to bottom on mount and when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  }, []);

  // Scroll to bottom on initial load
  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      scrollToBottom(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (items.length > previousItemsCount.current) {
      // New message arrived, scroll to it
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 300);
      previousItemsCount.current = items.length;
      return () => clearTimeout(timer);
    }
  }, [items, scrollToBottom]);

  const refreshTimeline = useCallback(async () => {
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
      // Ignore polling failures
    }
  }, [threadId]);

  useEffect(() => {
    void refreshTimeline();

    const timer = window.setInterval(() => {
      void refreshTimeline();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [refreshTimeline]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setStatusMessage(null);
    setActivePhase("connecting to Codex...");

    if (!draft.trim()) {
      setError("Message is required");
      setActivePhase(null);
      return;
    }

    setIsSending(true);

    try {
      setActivePhase("sending to Codex...");

      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: draft }),
      });

      const payload = (await response.json()) as
        | DesktopSendResult
        | { error: string };

      if (!response.ok || !("status" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "Failed to send message",
        );
      }

      if (!payload.ok) {
        throw new Error(payload.message);
      }

      setDraft("");
      setStatusMessage("Sent! Waiting for reply...");
      setActivePhase(null);

      void refreshTimeline();
    } catch (submissionError) {
      setActivePhase(null);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to send message",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl w-full shrink-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-2.5 w-full">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/projects/${projectKey}`}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:border-primary/30 active:scale-95 transition-all duration-200 shrink-0"
            >
              <ArrowLeftIcon />
            </Link>
            <div className="flex-1 min-w-0">
              <nav className="flex items-center gap-1.5 text-[11px] text-text-tertiary leading-tight">
                <Link href="/projects" className="hover:text-text-secondary transition-colors whitespace-nowrap">
                  Projects
                </Link>
                <span className="shrink-0">/</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{projectCwd}</span>
              </nav>
              <h1 className="text-sm font-medium text-text-primary truncate leading-tight">
                {threadTitle}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-medium text-success hidden sm:inline">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Messages */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 overflow-y-auto overscroll-behavior-contain">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center mt-8">
            <div className="mb-4 text-text-tertiary">
              <MessageIcon />
            </div>
            <h3 className="text-sm font-medium text-text-primary">
              No messages yet
            </h3>
            <p className="mt-2 text-sm text-text-secondary max-w-xs">
              Send your first instruction to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                id={`timeline-item-${item.id}`}
                className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                  item.role === 'assistant'
                    ? 'border-primary/25 bg-primary/8'
                    : item.role === 'user'
                    ? 'border-secondary/25 bg-secondary/8'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar role={item.role} />
                    <div className="min-w-0">
                      <span className={`text-xs font-medium uppercase tracking-wide truncate block ${
                        item.role === 'assistant' ? 'text-primary' :
                        item.role === 'user' ? 'text-secondary' : 'text-text-tertiary'
                      }`}>
                        {itemLabel(item)}
                      </span>
                    </div>
                  </div>
                  <time className="text-xs text-text-tertiary font-mono shrink-0">
                    {formatDateTime(item.timestamp)}
                  </time>
                </div>
                <p className="text-sm leading-relaxed text-text-primary break-words">
                  {item.body}
                </p>
              </article>
            ))}
            {/* Scroll anchor - invisible element at the bottom */}
            <div ref={messagesEndRef} className="h-px w-full" />
            {/* Extra spacer to ensure last message is visible above composer */}
            <div className="h-[200px] w-full shrink-0" />
          </div>
        )}
      </main>

      {/* Composer - Fixed Bottom */}
      <footer
        ref={composerRef}
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/98 backdrop-blur-xl z-20 w-full"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3.5 w-full">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="rounded-xl border border-border bg-surface p-3 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <label className="block text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-2">
                Send to Codex
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your instruction..."
                rows={2}
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none resize-none leading-relaxed max-h-32"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {error && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <AlertCircleIcon />
                    <span className="truncate">{error}</span>
                  </p>
                )}
                {statusMessage && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <CheckCircleIcon />
                    <span className="truncate">{statusMessage}</span>
                  </p>
                )}
                {activePhase && !error && !statusMessage && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <SpinnerIcon />
                    <span className="truncate">{activePhase}</span>
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/25 hover:border-primary/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
              >
                {isSending ? (
                  <>
                    <SpinnerIcon />
                    <span className="hidden sm:inline">Sending...</span>
                  </>
                ) : (
                  <>
                    <SendIcon />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}

function Avatar({ role }: { role: string }) {
  if (role === "assistant") {
    return (
      <div className="flex items-center justify-center w-7 h-7 rounded-full border border-primary/30 bg-primary/15 text-primary shrink-0">
        <BotIcon />
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="flex items-center justify-center w-7 h-7 rounded-full border border-secondary/30 bg-secondary/15 text-secondary shrink-0">
        <UserIcon />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-7 h-7 rounded-full border border-border bg-white/10 text-text-secondary shrink-0">
      <EventIcon />
    </div>
  );
}

// Icons
function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
