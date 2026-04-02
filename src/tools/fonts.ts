import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { apiGet } from "../lib/api.js";
import { loadClaim } from "../lib/claim.js";
import { BRANDKIT_URL } from "../lib/config.js";

// Common macOS font directories
const FONT_DIRS = [
  join(homedir(), "Library/Fonts"),
  "/Library/Fonts",
  "/System/Library/Fonts",
];

function isFontInstalled(filename: string): boolean {
  const name = filename.replace(/\.(woff2|woff|ttf|otf)$/, "");
  for (const dir of FONT_DIRS) {
    for (const ext of [".ttf", ".otf", ".woff2", ".woff"]) {
      if (existsSync(join(dir, name + ext))) return true;
    }
  }
  return false;
}

export function registerFontTools(server: McpServer) {
  server.tool(
    "brand_list_fonts",
    "List brand fonts. Shows which are installed locally and provides a download page URL for missing ones.",
    {},
    async () => {
      const claim = loadClaim();
      if (!claim) {
        return { content: [{ type: "text" as const, text: "Not authenticated." }] };
      }

      try {
        const data = await apiGet(`/assets/${claim.customerSlug}/fonts`);

        // Check which fonts are installed locally
        const fonts = (data.fonts || []).map((font: any) => ({
          ...font,
          installed: (font.files || []).some((f: string) => isFontInstalled(f)),
        }));

        const notInstalled = fonts.filter((f: any) => !f.installed);
        const downloadUrl = `${BRANDKIT_URL}/fonts/${claim.customerSlug}`;

        const result = {
          fonts,
          downloadPageUrl: downloadUrl,
          message: notInstalled.length > 0
            ? `${notInstalled.length} font(s) not installed locally. Visit ${downloadUrl} to download.`
            : "All brand fonts are installed.",
        };

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}
