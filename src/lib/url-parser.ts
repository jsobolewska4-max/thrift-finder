interface ProductInfo {
  name?: string;
  brand?: string;
  price?: number;
  url: string;
}

/**
 * Extracts product information from a retailer URL by fetching the page
 * and parsing Open Graph / meta tags.
 */
export async function extractProductInfo(
  url: string,
): Promise<ProductInfo | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ThriftFinder/1.0; +https://thriftfinder.app)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { url };

    const html = await response.text();
    return {
      name: extractMeta(html, "og:title") || extractTitle(html),
      brand: extractMeta(html, "product:brand") || extractMeta(html, "og:brand"),
      price: extractPriceFromMeta(html),
      url,
    };
  } catch (error) {
    console.error("Failed to fetch product URL:", error);
    // Return a basic result so the search can still proceed
    // Try to extract info from the URL itself
    return {
      name: extractInfoFromUrl(url),
      url,
    };
  }
}

function extractMeta(html: string, property: string): string | undefined {
  // Match both property="..." and name="..." meta tags
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(regex);
  if (match) return decodeHtmlEntities(match[1]);

  // Also try content before property (some sites order attributes differently)
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  const match2 = html.match(regex2);
  if (match2) return decodeHtmlEntities(match2[1]);

  return undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtmlEntities(match[1]).trim() : undefined;
}

function extractPriceFromMeta(html: string): number | undefined {
  const priceStr =
    extractMeta(html, "product:price:amount") ||
    extractMeta(html, "og:price:amount");
  if (priceStr) {
    const price = parseFloat(priceStr);
    if (!isNaN(price)) return price;
  }
  return undefined;
}

function extractInfoFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    // Remove common path prefixes and file extensions
    const slug = pathname
      .split("/")
      .filter(Boolean)
      .pop();
    if (!slug) return undefined;
    // Convert slug to readable text: "nicole-saldana-fabiana-shoe" -> "nicole saldana fabiana shoe"
    return slug.replace(/[-_]/g, " ").replace(/\.\w+$/, "");
  } catch {
    return undefined;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
