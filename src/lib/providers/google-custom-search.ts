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

function detectPlatform(url: string): Platform | null {
  for (const [platform, domain] of Object.entries(PLATFORM_DOMAINS)) {
    if (url.includes(domain)) return platform as Platform;
  }
  return null;
}

function extractPrice(result: VertexSearchResult): number | null {
  const data = result.document.derivedStructData;

  // Try structured pagemap data first
  const offer = data.pagemap?.offer?.[0];
  if (offer?.price) {
    const price = parseFloat(offer.price);
    if (!isNaN(price)) return price;
  }

  const product = data.pagemap?.product?.[0];
  if (product?.price) {
    const price = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(price)) return price;
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
  return result.document.derivedStructData.pagemap?.product?.[0]?.brand || undefined;
}

export async function searchGoogle(
  query: string,
  apiKey: string,
  projectId: string,
  engineId: string,
): Promise<SearchResult[]> {
  const endpoint =
    `https://discoveryengine.googleapis.com/v1/projects/${projectId}` +
    `/locations/global/collections/default_collection/engines/${engineId}` +
    `/servingConfigs/default_search:searchLite?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      pageSize: 10,
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

  const results: SearchResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const link = item.document.derivedStructData.link;
    const platform = detectPlatform(link);
    if (!platform) continue;

    results.push({
      id: `vas-${platform}-${i}`,
      title: item.document.derivedStructData.title,
      price: extractPrice(item) ?? 0,
      currency: "USD",
      platform,
      url: link,
      imageUrl: extractImage(item),
      brand: extractBrand(item),
    });
  }

  return results;
}
