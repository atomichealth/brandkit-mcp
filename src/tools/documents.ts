/**
 * Document tools — list and read customer documents (docx/pptx/pdf/etc).
 * Read-only surface. Uploads happen through the brandkit admin UI.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../lib/api.js";
import { loadClaim } from "../lib/claim.js";
import { BRANDKIT_API_URL } from "../lib/config.js";

export function registerDocumentTools(server: McpServer) {
  server.tool(
    "brand_list_documents",
    "List the uploaded brand documents (Office files, PDFs, notes) for the current customer. Returns path, size, content-type, and upload time for each.",
    {},
    async () => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const docs = await apiGet(`/assets/${claim.customerSlug}/documents`);
        return { content: [{ type: "text" as const, text: JSON.stringify(docs, null, 2) }] };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "brand_read_document",
    "Read a brand document by path. Plain-text files (.md, .txt, .csv, .rtf) return their contents. Binary files (.docx/.pptx/.xlsx/.pdf/etc.) return base64-encoded bytes plus metadata; most clients can decode these directly.",
    {
      path: z.string().describe("Document path as returned by brand_list_documents, e.g. 'brand-guidelines.pdf' or 'decks/pitch.pptx'"),
    },
    async ({ path }) => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const url = `${BRANDKIT_API_URL}/assets/${claim.customerSlug}/documents/${path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${claim.token}` },
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ""}`);
        }

        const contentType = res.headers.get("content-type") || "application/octet-stream";
        const buf = Buffer.from(await res.arrayBuffer());

        // Treat these as plain text and return raw content.
        const isText =
          contentType.startsWith("text/") ||
          contentType === "application/json" ||
          contentType === "application/xml";

        if (isText) {
          return {
            content: [{ type: "text" as const, text: buf.toString("utf-8") }],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  path,
                  contentType,
                  size: buf.length,
                  encoding: "base64",
                  data: buf.toString("base64"),
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    },
  );
}
