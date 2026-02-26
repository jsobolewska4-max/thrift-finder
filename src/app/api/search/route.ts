import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/providers";
import { SearchQuery } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const text = params.get("q") || undefined;
  const url = params.get("url") || undefined;

  if (!text && !url) {
    return NextResponse.json(
      { error: "Please provide a search query (q) or product URL (url)" },
      { status: 400 },
    );
  }

  const query: SearchQuery = { text, url };

  try {
    const results = await search(query);
    return NextResponse.json({
      results,
      query,
      totalResults: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 },
    );
  }
}
