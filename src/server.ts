/**
 * Brandkit MCP Server — tool registration and setup.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPhotoTools } from "./tools/photos.js";
import { registerIconTools } from "./tools/icons.js";
import { registerFontTools } from "./tools/fonts.js";
import { registerSearchTools } from "./tools/search.js";
import { registerDocumentTools } from "./tools/documents.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brandkit",
    version: "0.1.0",
  });

  registerPhotoTools(server);
  registerIconTools(server);
  registerFontTools(server);
  registerSearchTools(server);
  registerDocumentTools(server);

  return server;
}
