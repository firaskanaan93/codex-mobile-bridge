import Link from "next/link";
import { notFound } from "next/navigation";
import { listThreadsByProject } from "@/lib/codex-thread-index";
import { decodeProjectKey } from "@/lib/project-key";
import { formatRelative } from "@/lib/date";

export const dynamic = "force-dynamic";

interface ProjectThreadsPageProps {
  params: Promise<{
    projectKey: string;
  }>;
}

export default async function ProjectThreadsPage({
  params,
}: ProjectThreadsPageProps) {
  const { projectKey } = await params;
  const threads = await listThreadsByProject(projectKey);

  if (threads.length === 0) {
    notFound();
  }

  const cwd = decodeProjectKey(projectKey);

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl w-full">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 w-full">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:border-primary/30 active:scale-95 transition-all duration-200 shrink-0"
            >
              <ArrowLeftIcon />
            </Link>
            <div className="flex-1 min-w-0">
              <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-1">
                <Link href="/projects" className="hover:text-text-secondary transition-colors whitespace-nowrap">
                  Projects
                </Link>
                <span className="shrink-0">/</span>
                <span className="truncate">{cwd}</span>
              </nav>
              <h1 className="text-base font-medium text-text-primary truncate">
                {cwd}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Thread List */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-5 w-full flex-1">
        <div className="space-y-2.5">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/threads/${thread.id}`}
              className="group block rounded-xl border border-border bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 hover:border-secondary/40 hover:from-white/[0.07] active:scale-[0.98] transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-primary line-clamp-2 leading-snug">
                    {thread.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="font-mono bg-surface px-1.5 py-0.5 rounded">#{thread.id.slice(0, 6)}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-border" />
                    <time className="truncate">{formatRelative(thread.updatedAt)}</time>
                  </div>
                </div>
                <div className="text-text-tertiary group-hover:text-secondary group-hover:translate-x-0.5 transition-all shrink-0">
                  <ChevronRightIcon />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
