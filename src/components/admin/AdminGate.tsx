import { useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { LogOut } from "lucide-react";

/**
 * Shared sign-in screen for every admin page. An emailed sign-in link is the
 * primary path; the legacy admin password stays as a secondary phase-1 option
 * held in memory only.
 */

const SignIn = () => {
  const { requestCode, verifyCode, signInWithPassword, error } = useAdminAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [pw, setPw] = useState("");
  const [addr, setAddr] = useState("scott.syme@whiterabbitla.com");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen bg-forest-dark text-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">White Rabbit LA</p>
        <h1 className="font-serif font-light text-3xl mb-8">Admin</h1>

        {!codeSent ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              await requestCode(addr);
              setCodeSent(true);
              setBusy(false);
            }}
          >
            <input
              type="email"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="w-full bg-transparent border border-cream/25 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-cream text-forest-dark py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
            >
              Send me a code
            </button>
          </form>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const ok = await verifyCode(addr, code);
              if (!ok) setCode("");
              setBusy(false);
            }}
          >
            <p className="text-xs text-cream/70 leading-relaxed text-left">
              If that address is an admin, a code is on its way.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 digit code"
              autoFocus
              className="w-full bg-transparent border border-cream/25 px-4 py-3 text-center text-xl tracking-[0.5em] text-cream placeholder:text-cream/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full bg-cream text-forest-dark py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setCodeSent(false); setCode(""); }}
              className="text-[11px] tracking-[0.2em] uppercase text-cream/50 hover:text-cream"
            >
              Send a new code
            </button>
          </form>
        )}

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
      title={mode === "magiclink" && email ? `Signed in as ${email}` : "Sign out"}
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
