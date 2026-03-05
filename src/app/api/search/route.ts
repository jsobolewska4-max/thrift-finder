import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/providers";
import { SearchQuery } from "@/lib/types";

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const text = params.get("q") || undefined;
  const url = params.get("url") || undefined;
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));

  if (!text && !url) {
    return NextResponse.json(
      { error: "Please provide a search query (q) or product URL (url)" },
      { status: 400 },
    );
  }

  const query: SearchQuery = { text, url };

  try {
    const result = await search(query, { page });
    return NextResponse.json({
      results: result.results,
      query,
      totalResults: result.totalResults,
      hasMore: result.hasMore,
      page,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 },
    );
  }
}
