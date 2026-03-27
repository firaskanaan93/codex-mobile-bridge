import Link from "next/link";
import { listProjects } from "@/lib/codex-thread-index";
import { formatRelative } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl w-full">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Projects</h1>
            <p className="text-sm text-text-secondary">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-6 w-full">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.08] to-transparent p-5 sm:p-7">
          <h2 className="text-base sm:text-lg font-medium text-primary">
            Mobile Codex Viewer
          </h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            Browse local Codex projects and send instructions from mobile
            through the real Codex message box on your Mac.
          </p>
        </div>
      </section>

      {/* Project Grid */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 w-full flex-1">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
            <div className="mb-4 text-text-tertiary">
              <FolderIcon className="w-10 h-10" />
            </div>
            <h3 className="text-sm font-medium text-text-primary">
              No projects yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-text-secondary">
              Start a Codex session on your Mac to see projects appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.projectKey}
                href={`/projects/${project.projectKey}`}
                className="group rounded-xl border border-border bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-5 hover:border-primary/40 hover:from-white/[0.07] active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 text-text-tertiary">
                        <FolderIcon />
                      </div>
                      <span className="text-xs text-text-tertiary font-mono whitespace-nowrap">
                        {project.threadCount} threads
                      </span>
                    </div>
                    <h3 className="font-medium text-text-primary truncate block">
                      {project.cwd}
                    </h3>
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      Active {formatRelative(project.lastUpdatedAt)}
                    </p>
                  </div>
                  <div className="text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                    <ChevronRightIcon />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
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
