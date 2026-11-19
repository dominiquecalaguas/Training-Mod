"use client";

import { Search, X } from "lucide-react";
import { useSearchQuery } from "@/components/SearchQueryContext";
import styles from "@/components/course-library.module.css";

export function HomeSearchBar() {
  const { searchQuery, setSearchQuery } = useSearchQuery();

  return (
    <div role="search" className={styles.search}>
      <Search size={20} strokeWidth={1.7} aria-hidden="true" />
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search courses or lessons"
        aria-label="Search courses or lessons"
      />
      {searchQuery && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={(event) => {
            setSearchQuery("");
            event.currentTarget.parentElement?.querySelector("input")?.focus();
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
