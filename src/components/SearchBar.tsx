"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialQuery?: string;
  initialUrl?: string;
  compact?: boolean;
}

export default function SearchBar({
  initialQuery = "",
  initialUrl = "",
  compact = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [productUrl, setProductUrl] = useState(initialUrl);
  const [showUrlInput, setShowUrlInput] = useState(!!initialUrl);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !productUrl.trim()) return;

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (productUrl.trim()) params.set("url", productUrl.trim());

    router.push(`/search?${params.toString()}`);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an item..."
            className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm transition-colors focus:border-neutral-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      {/* Text search input */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={"Describe what you're looking for, e.g. \"Nicole Saldaña Fabiana Mary Jane Dark Brown\""}
          className="h-14 w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 text-base shadow-sm transition-all focus:border-neutral-400 focus:shadow-md focus:outline-none"
          autoFocus
        />
      </div>

      {/* URL input toggle */}
      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="mt-3 flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Or paste a product link
        </button>
      ) : (
        <div className="mt-3">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://www.nicolesaldana.com/products/fabiana-eyelet..."
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm transition-all focus:border-neutral-400 focus:shadow-md focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Search button */}
      <button
        type="submit"
        disabled={!query.trim() && !productUrl.trim()}
        className="mt-5 h-12 w-full rounded-2xl bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        Find the best price
      </button>
    </form>
  );
}
