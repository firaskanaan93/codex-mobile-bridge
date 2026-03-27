import Link from "next/link";
import { notFound } from "next/navigation";
import { listThreadsByProject } from "@/lib/codex-thread-index";
import { decodeProjectKey } from "@/lib/project-key";
import { formatDateTime, formatRelative } from "@/lib/date";

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
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-black/35 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <Link className="text-sm text-cyan-200/80 transition hover:text-white" href="/projects">
          ← Back to projects
        </Link>
        <div className="mt-5 space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
            Workspace
          </p>
          <h1 className="break-all text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            {cwd}
          </h1>
          <p className="text-sm leading-7 text-white/62">
            These are the non-archived Codex threads tied to this working
            directory.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/threads/${thread.id}`}
            className="block rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition hover:border-lime-300/25 hover:bg-white/7"
          >
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-white/45">
              <span>{formatDateTime(thread.updatedAt)}</span>
              <span>{formatRelative(thread.updatedAt)}</span>
            </div>
            <h2 className="mb-3 line-clamp-3 text-lg font-semibold tracking-tight text-white sm:text-xl">
              {thread.title}
            </h2>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-white/45">
              <span>Thread {thread.id}</span>
              <span>Created {formatDateTime(thread.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
