/**
 * HTTP client for the Brandkit API.
 * All requests include the claim token for authentication.
 */

import { BRANDKIT_API_URL } from "./config.js";
import { loadClaim } from "./claim.js";

export async function apiGet(path: string): Promise<any> {
  const claim = loadClaim();
  if (!claim) throw new Error("Not authenticated. Run brandkit-mcp to log in.");

  const res = await fetch(`${BRANDKIT_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${claim.token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    throw new Error("Claim expired or revoked. Please re-authenticate.");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function apiPost(path: string, body: any): Promise<any> {
  const claim = loadClaim();
  if (!claim) throw new Error("Not authenticated.");

  const res = await fetch(`${BRANDKIT_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${claim.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
