"use client";

import { Search, X } from "lucide-react";
import { useSearchQuery } from "@/components/SearchQueryContext";

export function TopNav() {
  const { searchQuery, setSearchQuery } = useSearchQuery();

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search"
        className={`h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-8 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-200 ${searchQuery ? "pr-9" : "pr-3"}`}
        aria-label="Search"
      />
      {searchQuery ? (
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-neutral-200/80 hover:text-neutral-800"
          aria-label="Clear search"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
