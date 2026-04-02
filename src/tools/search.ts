import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api.js";
import { loadClaim } from "../lib/claim.js";

export function registerSearchTools(server: McpServer) {
  server.tool(
    "brand_search_assets",
    "Search brand assets by description using AI-powered semantic search. Returns photos, icons, and other assets matching your query.",
    {
      query: z.string().describe("Natural language search query (e.g. 'people working in an office')"),
      types: z.array(z.enum(["photos", "icons"])).optional().describe("Filter by asset type"),
      limit: z.number().optional().default(10).describe("Max results"),
    },
    async ({ query, types, limit }) => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const params = new URLSearchParams({ q: query, limit: String(limit) });
        if (types?.length) params.set("types", types.join(","));

        const data = await apiGet(`/assets/${claim.customerSlug}/search?${params}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}
