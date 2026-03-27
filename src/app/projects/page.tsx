import Link from "next/link";
import { listProjects } from "@/lib/codex-thread-index";
import { formatDateTime, formatRelative } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/35 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/75">
          Mobile Codex Viewer
        </p>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Browse local Codex projects and keep mobile notes queued per thread.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            Projects are grouped from Codex thread working directories. Open one
            project to read every thread tied to that workspace.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/12 bg-white/4 p-8 text-sm text-white/65">
          No non-archived Codex projects were found in the local thread index.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.projectKey}
              href={`/projects/${project.projectKey}`}
              className="group rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,18,27,0.92),rgba(7,10,17,0.96))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-cyan-300/30"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-100/80">
                  {project.threadCount} threads
                </span>
                <span className="text-xs text-white/45">
                  {formatRelative(project.lastUpdatedAt)}
                </span>
              </div>
              <h2 className="mb-3 break-all text-lg font-semibold tracking-tight text-white">
                {project.cwd}
              </h2>
              <p className="text-sm text-white/55">
                Last activity {formatDateTime(project.lastUpdatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
