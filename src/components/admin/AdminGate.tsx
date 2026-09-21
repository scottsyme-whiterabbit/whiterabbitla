import { useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { LogOut } from "lucide-react";

/**
 * Shared sign-in screen for every admin page. Google sign-in is primary; the
 * legacy admin password is a secondary phase-1 option held in memory only.
 */
const SignIn = () => {
  const { signInWithGoogle, signInWithPassword, error } = useAdminAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen bg-forest-dark text-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">White Rabbit LA</p>
        <h1 className="font-serif font-light text-3xl mb-8">Admin</h1>

        <button
          onClick={async () => {
            setBusy(true);
            await signInWithGoogle();
            setBusy(false);
          }}
          disabled={busy}
          className="w-full bg-cream text-forest-dark py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
        >
          Sign in with Google
        </button>

        {error && <p className="mt-4 text-xs text-rose">{error}</p>}

        {!showPassword ? (
          <button
            onClick={() => setShowPassword(true)}
            className="mt-6 text-[11px] tracking-[0.2em] uppercase text-cream/50 hover:text-cream"
          >
            Use password instead
          </button>
        ) : (
          <form
            className="mt-6 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              await signInWithPassword(pw);
              setPw("");
              setBusy(false);
            }}
          >
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full bg-transparent border border-cream/25 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full border border-gold text-gold py-3 text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-forest-dark disabled:opacity-60"
            >
              Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/** Small sign-out control for admin headers. */
export const AdminSignOutButton = ({ className = "" }: { className?: string }) => {
  const { signOut, email, mode } = useAdminAuth();
  return (
    <button
      onClick={signOut}
      title={mode === "google" && email ? `Signed in as ${email}` : "Sign out"}
      className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase opacity-60 hover:opacity-100 ${className}`}
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign out
    </button>
  );
};

const Inner = ({ children }: { children: React.ReactNode }) => {
  const { ready, authed } = useAdminAuth();
  if (!ready) {
    return <div className="min-h-screen bg-forest-dark" />;
  }
  if (!authed) return <SignIn />;
  return <>{children}</>;
};

/** Wrap any admin page in this to require Google sign-in (or the password). */
export const AdminGate = ({ children }: { children: React.ReactNode }) => (
  <AdminAuthProvider>
    <Inner>{children}</Inner>
  </AdminAuthProvider>
);

export default AdminGate;
