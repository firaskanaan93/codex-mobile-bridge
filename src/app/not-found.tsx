import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 w-full overflow-x-hidden">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <SearchIcon />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">
          Not Found
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          The requested Codex item does not exist. It may be archived,
          removed, or unavailable from local storage.
        </p>
        <Link
          href="/projects"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary/15 border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/25 active:scale-95 transition-all duration-200"
        >
          <ArrowLeftIcon />
          Back to Projects
        </Link>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
