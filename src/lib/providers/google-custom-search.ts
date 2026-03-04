import { Platform, SearchResult } from "../types";

const PLATFORM_DOMAINS: Record<Platform, string> = {
  poshmark: "poshmark.com",
  depop: "depop.com",
  therealreal: "therealreal.com",
  thredup: "thredup.com",
};

interface VertexSearchResult {
  id: string;
  document: {
    derivedStructData: {
      link: string;
      title: string;
      snippets?: Array<{ snippet: string; snippet_status: string }>;
      pagemap?: {
        metatags?: Array<Record<string, string>>;
        cse_image?: Array<{ src: string }>;
        offer?: Array<{ price?: string; pricecurrency?: string }>;
        product?: Array<{
          name?: string;
          image?: string;
          brand?: string;
          price?: string;
        }>;
      };
    };
  };
}

// URL patterns that indicate an actual product listing page (not a search page)
const PRODUCT_URL_PATTERNS: Record<Platform, RegExp> = {
  poshmark: /poshmark\.com\/listing\//,
  depop: /depop\.com\/products\//,
  therealreal: /therealreal\.com\/products\//,
  thredup: /thredup\.com\/product\//,
};

function detectPlatform(url: string): Platform | null {
  for (const [platform, domain] of Object.entries(PLATFORM_DOMAINS)) {
    if (url.includes(domain)) return platform as Platform;
  }
  return null;
}

function isProductListingUrl(url: string, platform: Platform): boolean {
  return PRODUCT_URL_PATTERNS[platform].test(url);
}

function extractPrice(result: VertexSearchResult): number | null {
  const data = result.document.derivedStructData;

  // Best source: metatags product:price:amount (used by Poshmark, Depop, etc.)
  const metatags = data.pagemap?.metatags?.[0];
  if (metatags?.["product:price:amount"]) {
    const price = parseFloat(metatags["product:price:amount"]);
    if (!isNaN(price) && price > 0) return price;
  }

  // Try structured pagemap data
  const offer = data.pagemap?.offer?.[0];
  if (offer?.price) {
    const price = parseFloat(offer.price);
    if (!isNaN(price) && price > 0) return price;
  }

  const product = data.pagemap?.product?.[0];
  if (product?.price) {
    const price = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(price) && price > 0) return price;
  }

  // Try extracting from title or snippet
  const priceRegex = /\$(\d+(?:\.\d{2})?)/;
  const titleMatch = data.title?.match(priceRegex);
  if (titleMatch) return parseFloat(titleMatch[1]);

  const snippetText = data.snippets?.[0]?.snippet?.replace(/<\/?b>/g, "") ?? "";
  const snippetMatch = snippetText.match(priceRegex);
  if (snippetMatch) return parseFloat(snippetMatch[1]);

  return null;
}

function extractImage(result: VertexSearchResult): string | undefined {
  const data = result.document.derivedStructData;
  return (
    data.pagemap?.cse_image?.[0]?.src ||
    data.pagemap?.product?.[0]?.image ||
    undefined
  );
}

function extractBrand(result: VertexSearchResult): string | undefined {
  const data = result.document.derivedStructData;
  return (
    data.pagemap?.metatags?.[0]?.["product:brand"] ||
    data.pagemap?.product?.[0]?.brand ||
    undefined
  );
}

function isSoldOut(result: VertexSearchResult): boolean {
  const data = result.document.derivedStructData;
  const title = (data.title || "").toLowerCase();
  const snippet = (data.snippets?.[0]?.snippet || "").toLowerCase().replace(/<\/?b>/g, "");

  // Common sold-out indicators on resale platforms
  const soldPatterns = [/\bsold\b/, /\bnot available\b/, /\bunavailable\b/];
  for (const pattern of soldPatterns) {
    if (pattern.test(title) || pattern.test(snippet)) return true;
  }

  // Check metatags for availability
  const metatags = data.pagemap?.metatags?.[0];
  if (metatags) {
    const availability = (metatags["product:availability"] || metatags["og:availability"] || "").toLowerCase();
    if (availability === "oos" || availability === "out of stock" || availability === "sold") {
      return true;
    }
  }

  return false;
}

export interface VertexSearchOptions {
  page?: number;
  pageSize?: number;
}

export interface VertexSearchResponse {
  results: SearchResult[];
  totalResults: number;
  hasMore: boolean;
}

// The API returns at most 20 results per request, and many get filtered (sold, non-product URLs).
// We over-fetch by making multiple API calls to accumulate enough valid results.
const API_PAGE_SIZE = 20; // Vertex searchLite max per request
const TARGET_RESULTS = 25; // How many valid results we want per user-facing page
const MAX_API_PAGES = 5; // Safety limit to avoid too many API calls

export async function searchGoogle(
  query: string,
  apiKey: string,
  projectId: string,
  engineId: string,
  options: VertexSearchOptions = {},
): Promise<VertexSearchResponse> {
  const { page = 1 } = options;

  const endpoint =
    `https://discoveryengine.googleapis.com/v1/projects/${projectId}` +
    `/locations/global/collections/default_collection/engines/${engineId}` +
    `/servingConfigs/default_search:searchLite?key=${apiKey}`;

  // We need to skip past results from previous pages, then collect TARGET_RESULTS more.
  // Since we don't know the exact filter ratio, we track how many API results to skip.
  const skipValid = (page - 1) * TARGET_RESULTS;
  let validSeen = 0;
  let apiOffset = 0;
  let totalSize = 0;
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (let apiFetch = 0; apiFetch < MAX_API_PAGES * page; apiFetch++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        pageSize: API_PAGE_SIZE,
        offset: apiOffset,
        userPseudoId: "thrift-finder-server",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Vertex AI Search API error:", error);
      throw new Error(`Vertex AI Search API error: ${response.status}`);
    }

    const data = await response.json();
    const items: VertexSearchResult[] = data.results || [];
    totalSize = data.totalSize || totalSize;

    if (items.length === 0) break; // No more results from API

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const link = item.document.derivedStructData.link;
      const platform = detectPlatform(link);
      if (!platform) continue;
      if (!isProductListingUrl(link, platform)) continue;
      if (isSoldOut(item)) continue;
      if (seenUrls.has(link)) continue;
      seenUrls.add(link);

      const price = extractPrice(item);

      validSeen++;

      // Skip results belonging to previous pages
      if (validSeen <= skipValid) continue;

      results.push({
        id: `vas-${platform}-${apiOffset + i}`,
        title: item.document.derivedStructData.title,
        price: price ?? 0,
        currency: "USD",
        platform,
        url: link,
        imageUrl: extractImage(item),
        brand: extractBrand(item),
      });

      if (results.length >= TARGET_RESULTS) break;
    }

    apiOffset += items.length;

    if (results.length >= TARGET_RESULTS) break;
    if (apiOffset >= totalSize) break;
  }

  return {
    results,
    totalResults: totalSize,
    hasMore: apiOffset < totalSize && results.length >= TARGET_RESULTS,
  };
}
