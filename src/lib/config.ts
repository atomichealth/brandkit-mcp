/**
 * Configuration for the Brandkit MCP server.
 */

export const BRANDKIT_URL =
  process.env.BRANDKIT_URL || "https://brandkit.atomic.health";

export const BRANDKIT_API_URL =
  process.env.BRANDKIT_API_URL || `${BRANDKIT_URL}/api`;
