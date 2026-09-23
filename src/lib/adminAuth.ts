import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const FN_PREFIX = `${SUPABASE_URL}/functions/v1/`;

/**
 * Admin credentials live in memory only. Nothing is ever written to
 * localStorage or sessionStorage.
 */
let adminPassword = "";
let adminSignedIn = false;

export const setAdminPassword = (pw: string) => {
  adminPassword = pw || "";
};
export const getAdminPassword = () => adminPassword;
export const setAdminSignedIn = (v: boolean) => {
  adminSignedIn = v;
};

/** Current Supabase access token, refreshed by supabase-js when needed. */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
};

/**
 * Headers that let the server recognise Scott on an otherwise public page (the
 * proposal and residency pages he opens from the dashboard), so his own clicks
 * are not recorded as client views and no "just opened" alert is sent.
 *
 * A real client has neither a session nor the in-memory password, so nothing is
 * added and the page behaves exactly as before.
 */
export const adminViewHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {};
  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.apikey = SUPABASE_KEY;
  }
  if (adminPassword) headers["x-admin-password"] = adminPassword;
  return headers;
};

/**
 * Every admin edge-function call must carry the signed-in user's access token.
 * Rather than touching several hundred existing fetch call sites, we install a
 * single wrapper that upgrades requests to our own edge functions: the user's
 * access token goes in Authorization, and the publishable key stays in apikey.
 *
 * Public pages are unaffected: with no admin session there is no token to add,
 * and the request goes out exactly as before.
 */
let installed = false;
export function installAdminFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      if (adminSignedIn && url.startsWith(FN_PREFIX)) {
        const token = await getAccessToken();
        if (token) {
          const headers = new Headers(
            init?.headers || (input instanceof Request ? input.headers : undefined),
          );
          headers.set("Authorization", `Bearer ${token}`);
          if (!headers.has("apikey")) headers.set("apikey", SUPABASE_KEY);
          return original(input as any, { ...(init || {}), headers });
        }
      }
    } catch {
      // fall through to the untouched request
    }
    return original(input as any, init);
  };
}
