import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api.js";
import { loadClaim } from "../lib/claim.js";

export function registerIconTools(server: McpServer) {
  server.tool(
    "brand_list_icons",
    "List brand icons with available sizes and formats.",
    {
      search: z.string().optional().describe("Search by name or tags"),
    },
    async ({ search }) => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const params = search ? `?search=${encodeURIComponent(search)}` : "";
        const data = await apiGet(`/assets/${claim.customerSlug}/icons${params}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    "brand_get_icon",
    "Get a brand icon at a specific size. Returns a signed URL.",
    {
      id: z.string().describe("Icon ID"),
      size: z.number().optional().default(256).describe("Size in pixels (square)"),
      format: z.enum(["svg", "png"]).optional().default("png").describe("Format"),
    },
    async ({ id, size, format }) => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const data = await apiGet(`/assets/${claim.customerSlug}/icons/${id}?size=${size}&format=${format}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}
