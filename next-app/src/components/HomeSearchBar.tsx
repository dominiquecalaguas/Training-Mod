"use client";

import { X } from "lucide-react";
import { useSearchQuery } from "@/components/SearchQueryContext";

/**
 * Home header search: styled with provided Rectangle 20 + magnifying glass SVGs.
 */
export function HomeSearchBar() {
  const { searchQuery, setSearchQuery } = useSearchQuery();

  return (
    <div className="relative h-[78px] w-full min-w-0 max-w-[516px] shrink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/search/rectangle-20.svg"
        alt=""
        width={516}
        height={78}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
        aria-hidden
      />
      <div className="relative z-10 flex h-full w-full items-center gap-2 px-[15px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/search/magnifying-glass.svg"
          alt=""
          width={26}
          height={26}
          className="pointer-events-none shrink-0"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anything..."
          className="min-h-[48px] min-w-0 flex-1 bg-transparent py-2 pr-1 text-sm leading-normal text-neutral-900 placeholder:italic placeholder:text-neutral-400 focus:outline-none"
          aria-label="Search courses"
        />
        {searchQuery ? (
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200/80 hover:text-neutral-800"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
