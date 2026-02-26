import { SearchResult } from "@/lib/types";
import PlatformBadge from "./PlatformBadge";

interface ResultCardProps {
  result: SearchResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const discount = result.originalPrice
    ? Math.round((1 - result.price / result.originalPrice) * 100)
    : null;

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-all hover:border-neutral-200 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt={result.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {discount && discount > 0 && (
          <div className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <PlatformBadge platform={result.platform} />

        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900">
          {result.title}
        </h3>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-semibold text-neutral-900">
            ${result.price.toFixed(0)}
          </span>
          {result.originalPrice && result.originalPrice > result.price && (
            <span className="text-sm text-neutral-400 line-through">
              ${result.originalPrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          {result.condition && <span>{result.condition}</span>}
          {result.condition && result.size && (
            <span className="text-neutral-300">·</span>
          )}
          {result.size && <span>Size {result.size}</span>}
        </div>
      </div>
    </a>
  );
}
