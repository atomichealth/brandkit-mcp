#!/usr/bin/env node

/**
 * Brandkit MCP — entry point.
 *
 * Usage: npx @atomichealth/brandkit-mcp
 *
 * On first run, opens browser for authentication.
 * On subsequent runs, uses stored claim from ~/.brandkit/claim.json
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadClaim } from "./lib/claim.js";
import { authenticate } from "./lib/auth.js";
import { createServer } from "./server.js";

async function main() {
  // Check for existing claim
  let claim = loadClaim();

  if (!claim) {
    console.error("[brandkit] No active session. Starting authentication...");
    try {
      claim = await authenticate();
      console.error(`[brandkit] Authenticated as ${claim.email} (${claim.customerName})`);
    } catch (err: any) {
      console.error(`[brandkit] Authentication failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.error(`[brandkit] Authenticated as ${claim.email} (${claim.customerName})`);
  }

  // Start MCP server
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[brandkit] MCP server running");
}

main().catch((err) => {
  console.error(`[brandkit] Fatal: ${err.message}`);
  process.exit(1);
});
