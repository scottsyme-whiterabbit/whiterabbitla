import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getAccessToken,
  installAdminFetch,
  setAdminPassword,
  setAdminSignedIn,
} from "@/lib/adminAuth";


/**
 * One shared admin auth layer for every /admin page.
 *
 * Google sign-in is the primary path: the normal Supabase session is persisted
 * by supabase-js, so signing in once covers every admin page and survives
 * navigation, reloads and closing the tab.
 *
 * The legacy admin password remains as a secondary phase-1 option and is held
 * in memory only, never in localStorage or sessionStorage.
 */

type Mode = "none" | "magiclink" | "password";

/** Mirrors the server-side ADMIN_EMAILS allowlist. The server is the real lock. */
const ADMIN_ALLOWLIST = ["scott.syme@whiterabbitla.com"];

interface AdminAuthValue {
  ready: boolean;
  authed: boolean;
  mode: Mode;
  email: string | null;
  /** Memory-only admin password, empty string when signed in with a magic link. */
  password: string;
  error: string | null;
  /** True once a sign-in link has been emailed. */
  linkSent: boolean;
  sendMagicLink: (email: string) => Promise<boolean>;
  signInWithPassword: (pw: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Magic links may only return to an allow-listed origin. The Lovable preview
 * and published hosts are allow-listed; anywhere else we send the user to the
 * published admin instead of producing a dead link.
 */
const redirectBase = (): string => {
  const host = window.location.hostname;
  if (/(^|\.)lovable\.app$/.test(host) || /(^|\.)lovableproject\.com$/.test(host)) {
    return window.location.origin;
  }
  return "https://whiterabbitla.lovable.app";
};


export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("none");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);


  installAdminFetch();

  // Validates a signed-in user against the server-side allowlist. The real lock
  // is on the server; this call simply tells us whether to show the admin UI.
  const verifyUser = useCallback(async (): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) return false;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/proposals-api?action=list`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const applySession = useCallback(
    async (sessionEmail: string | null) => {
      setAdminSignedIn(true);
      const ok = await verifyUser();
      if (!ok) {
        setAdminSignedIn(false);
        await supabase.auth.signOut();
        setMode("none");
        setEmail(null);
        setError("This account does not have access.");
        return false;
      }
      setEmail(sessionEmail);
      setMode("magiclink");
      setError(null);

      return true;
    },
    [verifyUser],
  );

  // Restore an existing Supabase session on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!cancelled && session?.user?.email) {
        await applySession(session.user.email);
      }
      if (!cancelled) setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAdminSignedIn(false);
        setMode((m) => (m === "magiclink" ? "none" : m));
        setEmail(null);
      }
      if (event === "SIGNED_IN" && session?.user?.email) {
        setLinkSent(false);
        void applySession(session.user.email);
      }
      if (event === "TOKEN_REFRESHED" && session?.user?.email) {
        setEmail(session.user.email);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  /**
   * Emails a one-time sign-in link. Only allow-listed addresses are accepted,
   * so nothing is ever sent to an address that could not sign in anyway.
   */
  const sendMagicLink = useCallback(async (raw: string) => {
    setError(null);
    setLinkSent(false);
    const addr = (raw || "").trim().toLowerCase();
    if (!addr) return false;
    if (!ADMIN_ALLOWLIST.includes(addr)) {
      setError("This account does not have access.");
      return false;
    }
    const next = window.location.pathname.startsWith("/admin")
      ? window.location.pathname
      : "/admin/newsletter";
    const { error: err } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: `${redirectBase()}${next}`, shouldCreateUser: true },
    });
    if (err) {
      setError(err.message || "Could not send the sign-in link.");
      return false;
    }
    setLinkSent(true);
    return true;
  }, []);


  const signInWithPassword = useCallback(async (pw: string) => {
    setError(null);
    if (!pw) return false;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/proposals-api?action=list`, {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          "x-admin-password": pw,
        },
      });
      if (!res.ok) {
        setError("Incorrect password.");
        return false;
      }
    } catch {
      setError("Could not reach the server.");
      return false;
    }
    setAdminPassword(pw);
    setPassword(pw);
    setMode("password");
    return true;
  }, []);

  const signOut = useCallback(async () => {
    setAdminPassword("");
    setAdminSignedIn(false);
    setPassword("");
    setMode("none");
    setEmail(null);
    try {
      await supabase.auth.signOut();
    } catch {}
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      ready,
      authed: mode !== "none",
      mode,
      email,
      password,
      error,
      signInWithGoogle,
      signInWithPassword,
      signOut,
      getToken: getAccessToken,
    }),
    [ready, mode, email, password, error, signInWithGoogle, signInWithPassword, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthValue => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
};
