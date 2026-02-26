export type Platform = "poshmark" | "depop" | "therealreal" | "thredup";

export interface SearchResult {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  platform: Platform;
  url: string;
  imageUrl?: string;
  condition?: string;
  size?: string;
  brand?: string;
  seller?: string;
}

export interface SearchQuery {
  text?: string;
  url?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: SearchQuery;
  totalResults: number;
}

export type SortOption = "relevance" | "price_asc" | "price_desc";

export interface FilterState {
  platforms: Platform[];
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
}

export const PLATFORM_INFO: Record<
  Platform,
  { name: string; color: string; bgColor: string }
> = {
  poshmark: { name: "Poshmark", color: "#7b2a8f", bgColor: "#f3e5f5" },
  depop: { name: "Depop", color: "#ff2300", bgColor: "#ffeae6" },
  therealreal: {
    name: "The RealReal",
    color: "#004225",
    bgColor: "#e0f2e9",
  },
  thredup: { name: "ThredUp", color: "#00a98f", bgColor: "#e0f7f3" },
};
