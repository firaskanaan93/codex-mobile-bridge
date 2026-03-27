import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="rounded-[2rem] border border-white/10 bg-black/35 p-10 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-cyan-200/75">
          Not Found
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white">
          The requested Codex item does not exist.
        </h1>
        <p className="mb-6 text-sm leading-7 text-white/65">
          The thread may be archived, removed, or unavailable from the current
          local Codex storage.
        </p>
        <Link
          className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/16"
          href="/projects"
        >
          Return to projects
        </Link>
      </div>
    </div>
  );
}
