# Thrift Finder

Search across second-hand apparel platforms to find the best deals on fashion items.

## Platforms

- **Poshmark** — poshmark.com
- **Depop** — depop.com
- **The RealReal** — therealreal.com
- **ThredUp** — thredup.com

## Features

- **Cross-platform search** — queries all four platforms in parallel for balanced results
- **Live price verification** — fetches each listing page to get the current price (not stale cached data)
- **Sold/unavailable filtering** — automatically removes listings that are sold out or unavailable
- **Product-page-only results** — filters out category and search pages, only shows actual product listings
- **Sort & filter** — sort by price (low/high) or relevance, filter by platform and price range
- **URL-based search** — paste a product URL from any retailer to find it on resale platforms
- **Pagination** — load more results with infinite scroll

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Search API**: Google Vertex AI Search (Discovery Engine)
- **Deployment**: Vercel

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Home page with search bar
│   ├── search/page.tsx             # Search results page
│   ├── api/search/route.ts         # Search API endpoint
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Tailwind theme config
├── components/
│   ├── SearchBar.tsx               # Search input (full + compact variants)
│   ├── ResultCard.tsx              # Product result card
│   ├── FilterBar.tsx               # Sort, platform filter, price range
│   └── PlatformBadge.tsx           # Colored platform label
└── lib/
    ├── types.ts                    # Shared TypeScript types
    ├── url-parser.ts               # Extracts product info from retailer URLs
    └── providers/
        ├── index.ts                # Search orchestrator
        ├── google-custom-search.ts # Vertex AI Search integration
        └── mock-data.ts            # Fallback mock data for development
```

### Search Flow

1. User enters a search query (text or product URL)
2. If a URL is provided, `url-parser.ts` fetches the page and extracts product name/brand from meta tags
3. The API route calls `search()` which queries Vertex AI Search
4. Vertex is queried **4 times in parallel** — once per platform, using the `filter` parameter to scope results to each platform's domain
5. Results are filtered to only include actual product listing URLs (e.g. `/listing/`, `/products/`, `/product/`)
6. Results are interleaved round-robin across platforms for a balanced feed
7. Each result is **live-verified** — the listing page is fetched to confirm availability and get the current price from meta tags
8. Sold/unavailable listings are removed
9. Results are returned to the client for sorting and filtering

## Setup

### Prerequisites

- Node.js 18+
- A Google Cloud project with Vertex AI Search (Discovery Engine) enabled

### Environment Variables

Create a `.env.local` file:

```
GOOGLE_API_KEY=your-api-key
VERTEX_PROJECT_ID=your-project-id
VERTEX_ENGINE_ID=your-engine-id
```

The Vertex AI Search engine should be configured to index the four platform domains (poshmark.com, depop.com, therealreal.com, thredup.com).

### Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Deployment

The app is configured for Vercel deployment. Push to the `main` branch to trigger a deploy. Set the environment variables in the Vercel dashboard.

The search API route has `maxDuration = 15` set to allow enough time for parallel platform queries and live-verification.
