import Link from "next/link";

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-sm"
      aria-label="Main"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-100 transition hover:text-white"
        >
          Training Library
        </Link>
        <div className="flex items-center gap-1" role="navigation">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            Home
          </Link>
          <Link
            href="/admin/courses"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
