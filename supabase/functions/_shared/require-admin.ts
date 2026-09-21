// Shared admin authorization for every browser-facing admin endpoint.
//
// A request is authorized if EITHER:
//   1. It carries `Authorization: Bearer <user access token>` for a signed-in
//      Supabase user whose email is verified and whose lowercased email is in
//      the ADMIN_EMAILS allowlist (comma separated env secret), OR
//   2. It carries the legacy admin password (x-admin-password header or
//      `adminPassword` in the JSON body) — phase 1 fallback, unchanged.
//
// Server-to-server calls (service role key, cron secrets) are NOT handled here
// and must keep using their own checks.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";

export const adminEmails = (): string[] =>
  (Deno.env.get("ADMIN_EMAILS") || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export type AdminAuth =
  | { ok: true; via: "google" | "password"; email: string | null }
  | { ok: false; reason: string };

/** Legacy password check, byte-for-byte the same rule as before. */
export function adminPasswordMatches(req: Request, body?: any): boolean {
  if (!ADMIN_PASSWORD) return false;
  const header = req.headers.get("x-admin-password") || "";
  if (header === ADMIN_PASSWORD) return true;
  return typeof body?.adminPassword === "string" && body.adminPassword === ADMIN_PASSWORD;
}

function bearer(req: Request): string {
  const raw = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

/**
 * Returns whether the caller is an allowlisted admin user or holds the admin
 * password. Never throws.
 */
export async function requireAdmin(req: Request, body?: any): Promise<AdminAuth> {
  const token = bearer(req);
  // Anon/publishable keys are sent by the frontend on public calls; they are
  // not user tokens, so getUser simply fails and we fall through.
  if (token && SUPABASE_URL && SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data, error } = await supabase.auth.getUser(token);
      const user = data?.user;
      if (!error && user) {
        const email = (user.email || "").toLowerCase();
        const verified = !!user.email_confirmed_at || !!(user as any).confirmed_at;
        const allowed = adminEmails();
        if (email && verified && allowed.includes(email)) {
          return { ok: true, via: "google", email };
        }
        if (adminPasswordMatches(req, body)) {
          return { ok: true, via: "password", email: email || null };
        }
        return { ok: false, reason: "This account does not have access." };
      }
    } catch (_e) {
      // fall through to the password path
    }
  }

  if (adminPasswordMatches(req, body)) return { ok: true, via: "password", email: null };
  return { ok: false, reason: "Unauthorized" };
}

/** Convenience boolean for call sites that only need a yes/no. */
export async function isAdminRequest(req: Request, body?: any): Promise<boolean> {
  return (await requireAdmin(req, body)).ok;
}
