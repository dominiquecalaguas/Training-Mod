"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SearchQueryContextValue = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const SearchQueryContext = createContext<SearchQueryContextValue | null>(null);

export function SearchQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <SearchQueryContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchQueryContext.Provider>
  );
}

export function useSearchQuery(): SearchQueryContextValue {
  const ctx = useContext(SearchQueryContext);
  if (!ctx) {
    throw new Error("useSearchQuery must be used within SearchQueryProvider");
  }
  return ctx;
}
