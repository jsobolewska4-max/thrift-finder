import { Platform, SearchResult } from "../types";

/**
 * Live-fetches a listing URL to verify availability and get the current price.
 * Returns null if the listing is unavailable (404, sold, etc.).
 */
async function verifyListing(
  result: SearchResult,
): Promise<SearchResult | null> {
  try {
    const response = await fetch(result.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ThriftFinder/1.0; +https://thriftfinder.app)",
      },
      signal: AbortSignal.timeout(3000),
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Check for sold/unavailable indicators
    const availabilityMeta = extractMetaFromHtml(html, "product:availability")
      || extractMetaFromHtml(html, "og:availability");
    if (availabilityMeta) {
      const avail = availabilityMeta.toLowerCase();
      if (avail === "oos" || avail === "out of stock" || avail === "sold") {
        return null;
      }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const pageTitle = titleMatch[1].toLowerCase();
      if (/\bsold\b/.test(pageTitle) || /\bnot available\b/.test(pageTitle)) {
        return null;
      }
    }

    // Extract current price from live page meta tags
    const priceStr =
      extractMetaFromHtml(html, "product:price:amount") ||
      extractMetaFromHtml(html, "og:price:amount");
    if (priceStr) {
      const livePrice = parseFloat(priceStr);
      if (!isNaN(livePrice) && livePrice > 0) {
        return { ...result, price: livePrice };
      }
    }

    return result;
  } catch {
    // Timeout or network error — keep the result with cached data
    return result;
  }
}

function extractMetaFromHtml(
  html: string,
  property: string,
): string | undefined {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(regex);
  if (match) return match[1];

  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  const match2 = html.match(regex2);
  if (match2) return match2[1];

  return undefined;
}

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

// URL patterns that indicate an actual product listing page (not a search/category page)
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

  const metatags = data.pagemap?.metatags?.[0];
  if (metatags?.["product:price:amount"]) {
    const price = parseFloat(metatags["product:price:amount"]);
    if (!isNaN(price) && price > 0) return price;
  }

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

  const soldPatterns = [/\bsold\b/, /\bnot available\b/, /\bunavailable\b/];
  for (const pattern of soldPatterns) {
    if (pattern.test(title) || pattern.test(snippet)) return true;
  }

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

const API_PAGE_SIZE = 20;
const TARGET_RESULTS = 25;
const MAX_API_PAGES = 3;

const PLATFORMS = Object.keys(PLATFORM_DOMAINS) as Platform[];

/**
 * Interleave results round-robin across platforms for a balanced feed.
 */
function interleaveByPlatform(results: SearchResult[]): SearchResult[] {
  const buckets: Record<string, SearchResult[]> = {};
  for (const platform of PLATFORMS) {
    buckets[platform] = [];
  }
  for (const r of results) {
    buckets[r.platform].push(r);
  }

  const interleaved: SearchResult[] = [];
  let added = true;
  let idx = 0;
  while (added) {
    added = false;
    for (const platform of PLATFORMS) {
      if (idx < buckets[platform].length) {
        interleaved.push(buckets[platform][idx]);
        added = true;
      }
    }
    idx++;
  }
  return interleaved;
}

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

  const skipValid = (page - 1) * TARGET_RESULTS;
  let validSeen = 0;
  let apiOffset = 0;
  let totalSize = 0;
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (let apiFetch = 0; apiFetch < MAX_API_PAGES; apiFetch++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        pageSize: API_PAGE_SIZE,
        offset: apiOffset,
        userPseudoId: "thrift-finder-server",
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Vertex AI Search API error:", error);
      throw new Error(`Vertex AI Search API error: ${response.status}`);
    }

    const data = await response.json();
    const items: VertexSearchResult[] = data.results || [];
    totalSize = data.totalSize || totalSize;

    if (items.length === 0) break;

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

  // Interleave by platform for balanced representation
  const interleaved = interleaveByPlatform(results);

  // Live-verify each result: check availability and get current prices
  const verified = await Promise.all(interleaved.map(verifyListing));
  const validResults = verified.filter(
    (r): r is SearchResult => r !== null,
  );

  return {
    results: validResults,
    totalResults: totalSize,
    hasMore: apiOffset < totalSize && results.length >= TARGET_RESULTS,
  };
}
