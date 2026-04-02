/**
 * Claim storage — persists the authentication claim to disk.
 * Stored in ~/.brandkit/claim.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface Claim {
  token: string;
  customerSlug: string;
  customerName: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
}

const BRANDKIT_DIR = join(homedir(), ".brandkit");
const CLAIM_FILE = join(BRANDKIT_DIR, "claim.json");

export function loadClaim(): Claim | null {
  try {
    if (!existsSync(CLAIM_FILE)) return null;
    const data = JSON.parse(readFileSync(CLAIM_FILE, "utf-8"));

    // Check expiry
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      console.error("[brandkit] Claim expired. Please re-authenticate.");
      deleteClaim();
      return null;
    }

    return data as Claim;
  } catch {
    return null;
  }
}

export function saveClaim(claim: Claim): void {
  if (!existsSync(BRANDKIT_DIR)) {
    mkdirSync(BRANDKIT_DIR, { recursive: true });
  }
  writeFileSync(CLAIM_FILE, JSON.stringify(claim, null, 2));
}

export function deleteClaim(): void {
  try {
    if (existsSync(CLAIM_FILE)) unlinkSync(CLAIM_FILE);
  } catch {}
}
