import { Platform, SearchResult } from "../types";

// Real search URLs for each platform
const PLATFORM_SEARCH_URLS: Record<Platform, (query: string) => string> = {
  poshmark: (q) =>
    `https://poshmark.com/search?query=${encodeURIComponent(q)}&type=listings`,
  depop: (q) => `https://www.depop.com/search/?q=${encodeURIComponent(q)}`,
  therealreal: (q) =>
    `https://www.therealreal.com/search?q=${encodeURIComponent(q)}`,
  thredup: (q) =>
    `https://www.thredup.com/search?search_text=${encodeURIComponent(q)}`,
};

// Seeded image URLs using picsum.photos — each seed produces a consistent image
function productImage(seed: string): string {
  return `https://picsum.photos/seed/${seed}/400/500`;
}

export function generateMockResults(query: string): SearchResult[] {
  const q = query.toLowerCase();

  // If the query looks like it's about the Nicole Saldaña shoes, return tailored results
  if (
    q.includes("nicole") ||
    q.includes("saldaña") ||
    q.includes("saldana") ||
    q.includes("fabiana") ||
    q.includes("mary jane")
  ) {
    const searchTerm = "nicole saldana fabiana mary jane";
    return [
      {
        id: "mock-pm-1",
        title: "Nicole Saldaña Fabiana Eyelet Napa Mary Jane - Dark Brown",
        price: 285,
        originalPrice: 470,
        currency: "USD",
        platform: "poshmark",
        url: PLATFORM_SEARCH_URLS.poshmark(searchTerm),
        imageUrl: productImage("ns-fabiana-1"),
        condition: "Like New",
        size: "38",
        brand: "Nicole Saldaña",
        seller: "luxefinds22",
      },
      {
        id: "mock-trr-1",
        title: "Nicole Saldaña Fabiana Leather Mary Jane Flats",
        price: 195,
        originalPrice: 470,
        currency: "USD",
        platform: "therealreal",
        url: PLATFORM_SEARCH_URLS.therealreal(searchTerm),
        imageUrl: productImage("ns-fabiana-2"),
        condition: "Very Good",
        size: "38.5",
        brand: "Nicole Saldaña",
      },
      {
        id: "mock-dep-1",
        title: "Nicole Saldaña Fabiana Mary Jane Dark Brown Napa Leather",
        price: 320,
        originalPrice: 470,
        currency: "USD",
        platform: "depop",
        url: PLATFORM_SEARCH_URLS.depop(searchTerm),
        imageUrl: productImage("ns-fabiana-3"),
        condition: "Good",
        size: "39",
        brand: "Nicole Saldaña",
        seller: "vintageshoes_co",
      },
      {
        id: "mock-tu-1",
        title: "Nicole Saldaña Brown Leather Mary Jane Shoes",
        price: 149,
        originalPrice: 470,
        currency: "USD",
        platform: "thredup",
        url: PLATFORM_SEARCH_URLS.thredup(searchTerm),
        imageUrl: productImage("ns-fabiana-4"),
        condition: "Good",
        size: "38",
        brand: "Nicole Saldaña",
      },
      {
        id: "mock-pm-2",
        title: "Nicole Saldaña Fabiana Eyelet Mary Jane Size 37",
        price: 350,
        originalPrice: 470,
        currency: "USD",
        platform: "poshmark",
        url: PLATFORM_SEARCH_URLS.poshmark(searchTerm),
        imageUrl: productImage("ns-fabiana-5"),
        condition: "New with Tags",
        size: "37",
        brand: "Nicole Saldaña",
        seller: "shoecloset",
      },
      {
        id: "mock-trr-2",
        title: "Nicole Saldaña Napa Mary Jane Pumps",
        price: 225,
        originalPrice: 470,
        currency: "USD",
        platform: "therealreal",
        url: PLATFORM_SEARCH_URLS.therealreal(searchTerm),
        imageUrl: productImage("ns-fabiana-6"),
        condition: "Good",
        size: "39",
        brand: "Nicole Saldaña",
      },
    ];
  }

  // Generic mock results for any other query
  return [
    {
      id: "mock-pm-gen-1",
      title: `${query} - Excellent Condition`,
      price: 45,
      originalPrice: 120,
      currency: "USD",
      platform: "poshmark",
      url: PLATFORM_SEARCH_URLS.poshmark(query),
      imageUrl: productImage(`pm-${q.replace(/\s+/g, "-")}`),
      condition: "Excellent",
      brand: query.split(" ")[0],
      seller: "seller123",
    },
    {
      id: "mock-dep-gen-1",
      title: `${query} - Vintage Find`,
      price: 38,
      originalPrice: 95,
      currency: "USD",
      platform: "depop",
      url: PLATFORM_SEARCH_URLS.depop(query),
      imageUrl: productImage(`dep-${q.replace(/\s+/g, "-")}`),
      condition: "Good",
      brand: query.split(" ")[0],
      seller: "vintagefinds",
    },
    {
      id: "mock-trr-gen-1",
      title: `${query} - Authenticated`,
      price: 89,
      originalPrice: 250,
      currency: "USD",
      platform: "therealreal",
      url: PLATFORM_SEARCH_URLS.therealreal(query),
      imageUrl: productImage(`trr-${q.replace(/\s+/g, "-")}`),
      condition: "Very Good",
      brand: query.split(" ")[0],
    },
    {
      id: "mock-tu-gen-1",
      title: `${query} - Like New`,
      price: 29,
      originalPrice: 80,
      currency: "USD",
      platform: "thredup",
      url: PLATFORM_SEARCH_URLS.thredup(query),
      imageUrl: productImage(`tu-${q.replace(/\s+/g, "-")}`),
      condition: "Like New",
      brand: query.split(" ")[0],
    },
  ];
}
