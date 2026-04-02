/**
 * Authentication flow for the Brandkit MCP.
 *
 * 1. Start a temporary localhost HTTP server
 * 2. Open browser to brandkit.atomic.health/claim?callback=http://localhost:PORT
 * 3. User authenticates (email + optional code)
 * 4. Brandkit site redirects to localhost with claim token
 * 5. MCP stores the claim and closes the server
 */

import { createServer, type Server } from "node:http";
import { URL } from "node:url";
import { saveClaim, type Claim } from "./claim.js";
import { BRANDKIT_URL } from "./config.js";

export async function authenticate(): Promise<Claim> {
  return new Promise((resolve, reject) => {
    const server: Server = createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost`);

      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token");
        const customerSlug = url.searchParams.get("slug");
        const customerName = url.searchParams.get("name");
        const email = url.searchParams.get("email");
        const expiresAt = url.searchParams.get("expires");

        if (!token || !customerSlug || !email) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h2>Authentication failed</h2><p>Missing parameters. Please try again.</p></body></html>");
          reject(new Error("Missing claim parameters"));
          server.close();
          return;
        }

        const claim: Claim = {
          token,
          customerSlug,
          customerName: customerName || customerSlug,
          email,
          issuedAt: new Date().toISOString(),
          expiresAt: expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        saveClaim(claim);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa;">
              <div style="text-align: center;">
                <h2 style="margin-bottom: 8px;">Authenticated</h2>
                <p style="color: #666;">Logged in as <strong>${email}</strong> (${customerName})</p>
                <p style="color: #999; font-size: 14px;">You can close this tab and return to Claude Code.</p>
              </div>
            </body>
          </html>
        `);

        resolve(claim);
        setTimeout(() => server.close(), 1000);
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    // Listen on random port
    server.listen(0, "127.0.0.1", async () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to start auth server"));
        return;
      }

      const port = addr.port;
      const callbackUrl = `http://127.0.0.1:${port}/callback`;
      const authUrl = `${BRANDKIT_URL}/claim?callback=${encodeURIComponent(callbackUrl)}`;

      console.error(`[brandkit] Opening browser for authentication...`);
      console.error(`[brandkit] If browser doesn't open, visit: ${authUrl}`);

      try {
        const open = (await import("open")).default;
        await open(authUrl);
      } catch {
        console.error(`[brandkit] Could not open browser automatically.`);
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timed out (5 minutes)"));
    }, 5 * 60 * 1000);
  });
}
