import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-neutral-200">Not found</h1>
      <p className="text-neutral-400">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600"
      >
        Go home
      </Link>
    </div>
  );
}
