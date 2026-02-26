import { SearchResult, SearchQuery } from "../types";
import { searchGoogle } from "./google-custom-search";
import { generateMockResults } from "./mock-data";
import { extractProductInfo } from "../url-parser";

export async function search(query: SearchQuery): Promise<SearchResult[]> {
  let searchText = query.text || "";

  // If a URL was provided, try to extract product info from it
  if (query.url) {
    const productInfo = await extractProductInfo(query.url);
    if (productInfo) {
      // Combine extracted info with any text query
      const parts = [productInfo.brand, productInfo.name, searchText].filter(
        Boolean,
      );
      searchText = parts.join(" ");
    }
  }

  if (!searchText.trim()) {
    return [];
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  // Use real Google Custom Search if credentials are configured
  if (apiKey && searchEngineId) {
    try {
      return await searchGoogle(searchText, apiKey, searchEngineId);
    } catch (error) {
      console.error("Google search failed, falling back to mock data:", error);
      return generateMockResults(searchText);
    }
  }

  // Fall back to mock data when no API credentials are set
  console.log("No Google API credentials configured — using mock data");
  return generateMockResults(searchText);
}
