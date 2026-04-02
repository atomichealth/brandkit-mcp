/**
 * Photo tools — list and get brand stock photos with signed URLs.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api.js";
import { loadClaim } from "../lib/claim.js";

export function registerPhotoTools(server: McpServer) {
  server.tool(
    "brand_list_photos",
    "List brand stock photos. Returns thumbnails, dimensions, and AI-generated descriptions.",
    {
      page: z.number().optional().default(1).describe("Page number"),
      pageSize: z.number().optional().default(20).describe("Items per page (max 50)"),
      search: z.string().optional().describe("Search by description or tags"),
    },
    async ({ page, pageSize, search }) => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated. Please restart the MCP to log in." }] };
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(Math.min(pageSize, 50)),
        });
        if (search) params.set("search", search);

        const data = await apiGet(`/assets/${claim.customerSlug}/photos?${params}`);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "brand_get_photo",
    "Get a specific brand photo at a requested size. Returns a signed URL.",
    {
      id: z.string().describe("Photo ID"),
      width: z.number().optional().describe("Desired width in pixels"),
      height: z.number().optional().describe("Desired height in pixels"),
      format: z.enum(["jpg", "png", "webp"]).optional().default("jpg").describe("Image format"),
    },
    async ({ id, width, height, format }) => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const params = new URLSearchParams();
        if (width) params.set("w", String(width));
        if (height) params.set("h", String(height));
        if (format) params.set("format", format);

        const data = await apiGet(`/assets/${claim.customerSlug}/photos/${id}?${params}`);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );
}
