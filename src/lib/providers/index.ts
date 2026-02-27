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
  const projectId = process.env.VERTEX_PROJECT_ID;
  const engineId = process.env.VERTEX_ENGINE_ID;

  // Use Vertex AI Search if credentials are configured
  if (apiKey && projectId && engineId) {
    return await searchGoogle(searchText, apiKey, projectId, engineId);
  }

  // Fall back to mock data when no API credentials are set
  console.warn(
    "No Vertex AI Search credentials configured — using mock data.",
    `GOOGLE_API_KEY ${apiKey ? "is set" : "is MISSING"}.`,
    `VERTEX_PROJECT_ID ${projectId ? "is set" : "is MISSING"}.`,
    `VERTEX_ENGINE_ID ${engineId ? "is set" : "is MISSING"}.`,
  );
  return generateMockResults(searchText);
}
