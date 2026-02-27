"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import FilterBar from "@/components/FilterBar";
import {
  SearchResult,
  SearchResponse,
  SortOption,
  FilterState,
} from "@/lib/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const url = searchParams.get("url") || "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<SortOption>("relevance");
  const [filters, setFilters] = useState<FilterState>({ platforms: [] });

  console.log("[SearchResults] render, query:", JSON.stringify(query), "url:", JSON.stringify(url));

  useEffect(() => {
    console.log("[SearchResults] useEffect fired, query:", JSON.stringify(query), "url:", JSON.stringify(url));
    if (!query && !url) {
      console.log("[SearchResults] no query or url, bailing out");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (url) params.set("url", url);

    const fetchUrl = `/api/search?${params.toString()}`;
    console.log("[SearchResults] fetching:", fetchUrl);
    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json() as Promise<SearchResponse>;
      })
      .then((data) => {
        setResults(data.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      });
  }, [query, url]);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Platform filter
    if (filters.platforms.length > 0) {
      filtered = filtered.filter((r) => filters.platforms.includes(r.platform));
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((r) => r.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((r) => r.price <= filters.maxPrice!);
    }

    // Sort
    if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [results, sort, filters]);

  return (
    <div className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <a
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-neutral-900"
          >
            Thrift Finder
          </a>
          <div className="flex-1">
            <SearchBar initialQuery={query} initialUrl={url} compact />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        {/* Search context */}
        {query && (
          <h1 className="mb-4 text-lg font-semibold text-neutral-900">
            Results for &ldquo;{query}&rdquo;
          </h1>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800" />
            <p className="mt-4 text-sm text-neutral-500">
              Searching across platforms...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <FilterBar
              sort={sort}
              onSortChange={setSort}
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={filteredResults.length}
            />

            {filteredResults.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredResults.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-sm text-neutral-500">
                  No results match your filters. Try adjusting them.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <svg
                  className="mb-3 h-12 w-12 text-neutral-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-sm text-neutral-500">
                  No results found. Try a different search.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
