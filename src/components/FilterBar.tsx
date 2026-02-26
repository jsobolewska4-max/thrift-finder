"use client";

import { Platform, PLATFORM_INFO, SortOption, FilterState } from "@/lib/types";

interface FilterBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const ALL_PLATFORMS: Platform[] = [
  "poshmark",
  "depop",
  "therealreal",
  "thredup",
];

export default function FilterBar({
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  resultCount,
}: FilterBarProps) {
  function togglePlatform(platform: Platform) {
    const current = filters.platforms;
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];
    onFiltersChange({ ...filters, platforms: updated });
  }

  return (
    <div className="space-y-3">
      {/* Top row: result count + sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Platform filter chips */}
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const isActive =
            filters.platforms.length === 0 ||
            filters.platforms.includes(platform);
          return (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
              style={{
                borderColor: isActive ? info.color : "#e5e5e5",
                backgroundColor: isActive ? info.bgColor : "white",
                color: isActive ? info.color : "#a3a3a3",
              }}
            >
              {info.name}
            </button>
          );
        })}
      </div>

      {/* Price range */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            $
          </span>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="h-8 w-20 rounded-lg border border-neutral-200 bg-white pl-6 pr-2 text-sm focus:border-neutral-400 focus:outline-none"
          />
        </div>
        <span className="text-xs text-neutral-400">to</span>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            $
          </span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="h-8 w-20 rounded-lg border border-neutral-200 bg-white pl-6 pr-2 text-sm focus:border-neutral-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
