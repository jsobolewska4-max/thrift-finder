import { Platform, SearchResult } from "../types";

const PLATFORM_DOMAINS: Record<Platform, string> = {
  poshmark: "poshmark.com",
  depop: "depop.com",
  therealreal: "therealreal.com",
  thredup: "thredup.com",
};

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
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
}

function detectPlatform(url: string): Platform | null {
  for (const [platform, domain] of Object.entries(PLATFORM_DOMAINS)) {
    if (url.includes(domain)) return platform as Platform;
  }
  return null;
}

function extractPrice(item: GoogleSearchItem): number | null {
  // Try structured data first
  const offer = item.pagemap?.offer?.[0];
  if (offer?.price) {
    const price = parseFloat(offer.price);
    if (!isNaN(price)) return price;
  }

  const product = item.pagemap?.product?.[0];
  if (product?.price) {
    const price = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(price)) return price;
  }

  // Try extracting from title or snippet
  const priceRegex = /\$(\d+(?:\.\d{2})?)/;
  const titleMatch = item.title.match(priceRegex);
  if (titleMatch) return parseFloat(titleMatch[1]);

  const snippetMatch = item.snippet.match(priceRegex);
  if (snippetMatch) return parseFloat(snippetMatch[1]);

  return null;
}

function extractImage(item: GoogleSearchItem): string | undefined {
  return (
    item.pagemap?.cse_image?.[0]?.src ||
    item.pagemap?.product?.[0]?.image ||
    undefined
  );
}

function extractBrand(item: GoogleSearchItem): string | undefined {
  return item.pagemap?.product?.[0]?.brand || undefined;
}

export async function searchGoogle(
  query: string,
  apiKey: string,
  searchEngineId: string,
): Promise<SearchResult[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", searchEngineId);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Custom Search API error:", error);
    throw new Error(`Google Custom Search API error: ${response.status}`);
  }

  const data = await response.json();
  const items: GoogleSearchItem[] = data.items || [];

  const results: SearchResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const platform = detectPlatform(item.link);
    if (!platform) continue;

    results.push({
      id: `gcs-${platform}-${i}`,
      title: item.title,
      price: extractPrice(item) ?? 0,
      currency: "USD",
      platform,
      url: item.link,
      imageUrl: extractImage(item),
      brand: extractBrand(item),
    });
  }

  return results;
}
