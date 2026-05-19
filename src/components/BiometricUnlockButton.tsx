import { useState } from "react";
import { ScanFace } from "lucide-react";
import { useBiometricUnlock } from "@/hooks/useBiometricUnlock";
import { toast } from "sonner";

interface Props {
  namespace: string;
  /** Called with the recovered password after successful biometric unlock. */
  onUnlock: (password: string) => void;
  /** Style: 'dark' for cream-on-forest screens, 'light' for forest-on-cream. */
  variant?: "dark" | "light";
}

/**
 * BiometricUnlockButton
 *
 * Renders nothing if the device hasn't enrolled biometrics for this namespace.
 * Otherwise shows a Face ID / Touch ID button above the password field.
 */
export function BiometricUnlockButton({ namespace, onUnlock, variant = "dark" }: Props) {
  const { supported, platformAvailable, isEnrolled, unlock, clear } = useBiometricUnlock(namespace);
  const [busy, setBusy] = useState(false);

  if (!supported || !platformAvailable || !isEnrolled) return null;

  const handle = async () => {
    setBusy(true);
    const r = await unlock();
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error || "Face ID unlock failed");
      return;
    }
    onUnlock(r.password);
  };

  const base =
    variant === "dark"
      ? "w-full border border-cream/30 text-cream bg-cream/5 hover:bg-cream/10"
      : "w-full border border-forest-dark/20 text-forest-dark bg-white hover:bg-cream";

  return (
    <div className="mb-4 space-y-2">
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className={`${base} py-3 flex items-center justify-center gap-2 transition-colors min-h-[48px] disabled:opacity-60`}
      >
        <ScanFace className="w-5 h-5" />
        <span className="text-sm tracking-wider uppercase">
          {busy ? "Scanning…" : "Unlock with Face ID"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          clear();
          toast.success("Face ID removed from this device");
        }}
        className={
          variant === "dark"
            ? "text-xs text-cream/50 hover:text-cream/80 underline"
            : "text-xs text-forest-dark/50 hover:text-forest-dark/80 underline"
        }
      >
        Forget this device
      </button>
    </div>
  );
}

interface EnrollProps {
  namespace: string;
  password: string;
  variant?: "dark" | "light";
}

/**
 * BiometricEnrollPrompt
 *
 * Shows a small enroll CTA after a successful password login if the device
 * supports biometrics and hasn't enrolled yet. Auto-hides once enrolled.
 */
export function BiometricEnrollPrompt({ namespace, password, variant = "light" }: EnrollProps) {
  const { supported, platformAvailable, isEnrolled, enroll } = useBiometricUnlock(namespace);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!supported || !platformAvailable || isEnrolled || dismissed || !password) return null;

  const handle = async () => {
    setBusy(true);
    const r = await enroll(password);
    setBusy(false);
    if (r.ok) {
      toast.success("Face ID enabled on this device");
    } else {
      toast.error(r.error || "Couldn't enable Face ID");
    }
  };

  const isDark = variant === "dark";
  return (
    <div
      className={`${
        isDark
          ? "bg-cream/5 border border-cream/20 text-cream"
          : "bg-forest-dark/5 border border-forest-dark/15 text-forest-dark"
      } p-4 flex flex-wrap items-center justify-between gap-3 mb-4`}
    >
      <div className="flex items-center gap-3">
        <ScanFace className="w-5 h-5 shrink-0" />
        <div className="text-sm">
          <div className="font-medium">Enable Face ID for faster sign-in</div>
          <div className={isDark ? "text-cream/60 text-xs mt-0.5" : "text-forest-dark/60 text-xs mt-0.5"}>
            Use Face ID / Touch ID on this device next time.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={
            isDark
              ? "text-xs text-cream/60 hover:text-cream px-3 py-2"
              : "text-xs text-forest-dark/60 hover:text-forest-dark px-3 py-2"
          }
        >
          Not now
        </button>
        <button
          type="button"
          onClick={handle}
          disabled={busy}
          className={`px-4 py-2 text-sm min-h-[40px] disabled:opacity-60 ${
            isDark
              ? "bg-cream text-forest-dark hover:bg-cream/90"
              : "bg-forest-dark text-cream hover:opacity-90"
          }`}
        >
          {busy ? "Setting up…" : "Enable Face ID"}
        </button>
      </div>
    </div>
  );
}
