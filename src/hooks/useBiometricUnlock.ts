import { useCallback, useEffect, useState } from "react";

/**
 * useBiometricUnlock
 *
 * Lightweight WebAuthn-based "Face ID / Touch ID to unlock" helper for our
 * admin screens. This is a *device-bound convenience unlock*, not true
 * cryptographic encryption of the password:
 *   - On enroll, we register a platform authenticator credential (Face ID /
 *     Touch ID / Windows Hello) tied to this origin.
 *   - We store the admin password in localStorage alongside the credential ID.
 *   - On unlock, we require a successful WebAuthn assertion (userVerification:
 *     'required') before handing the password back to the caller.
 *
 * Because the password sits in localStorage, anyone with raw access to the
 * device's storage could read it — same risk profile as the existing
 * "remember me" behavior. The Face ID gate is a UX/lock-screen improvement,
 * not a hardened secrets vault.
 *
 * Namespace lets us keep separate enrollments for /admin/proposals and
 * /admin/newsletter.
 */

type Stored = {
  credentialId: string; // base64url
  password: string;
  enrolledAt: number;
};

const KEY = (ns: string) => `wr_biometric_${ns}`;

function bufToB64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToBuf(s: string): ArrayBuffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

export function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.credentials
  );
}

export function useBiometricUnlock(namespace: string, label = "White Rabbit Admin") {
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState<Stored | null>(null);
  const [platformAvailable, setPlatformAvailable] = useState(false);

  useEffect(() => {
    const ok = isBiometricSupported();
    setSupported(ok);
    if (!ok) return;

    try {
      const raw = localStorage.getItem(KEY(namespace));
      if (raw) setEnrolled(JSON.parse(raw) as Stored);
    } catch {
      /* ignore */
    }

    // Verify the device actually has a platform authenticator (Face ID, Touch
    // ID, Windows Hello, Android biometric) before showing the option.
    (window.PublicKeyCredential as any)
      ?.isUserVerifyingPlatformAuthenticatorAvailable?.()
      .then((avail: boolean) => setPlatformAvailable(!!avail))
      .catch(() => setPlatformAvailable(false));
  }, [namespace]);

  const enroll = useCallback(
    async (password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!supported) return { ok: false, error: "Biometrics not supported on this device." };
      if (!password) return { ok: false, error: "Password required to enroll." };

      try {
        const userId = randomBytes(16);
        const challenge = randomBytes(32);
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: label, id: window.location.hostname },
            user: {
              id: userId,
              name: `admin@${window.location.hostname}`,
              displayName: label,
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 },   // ES256
              { type: "public-key", alg: -257 }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "preferred",
            },
            timeout: 60_000,
            attestation: "none",
          },
        })) as PublicKeyCredential | null;

        if (!cred) return { ok: false, error: "Enrollment cancelled." };
        const stored: Stored = {
          credentialId: bufToB64Url(cred.rawId),
          password,
          enrolledAt: Date.now(),
        };
        localStorage.setItem(KEY(namespace), JSON.stringify(stored));
        setEnrolled(stored);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Enrollment failed." };
      }
    },
    [supported, namespace, label]
  );

  const unlock = useCallback(async (): Promise<{ ok: true; password: string } | { ok: false; error: string }> => {
    if (!supported) return { ok: false, error: "Biometrics not supported." };
    if (!enrolled) return { ok: false, error: "No enrollment found on this device." };

    try {
      const challenge = randomBytes(32);
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60_000,
          userVerification: "required",
          allowCredentials: [
            {
              type: "public-key",
              id: b64UrlToBuf(enrolled.credentialId),
              transports: ["internal"],
            },
          ],
        },
      })) as PublicKeyCredential | null;

      if (!assertion) return { ok: false, error: "Unlock cancelled." };
      return { ok: true, password: enrolled.password };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unlock failed." };
    }
  }, [supported, enrolled]);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY(namespace));
    setEnrolled(null);
  }, [namespace]);

  return {
    supported,
    platformAvailable,
    isEnrolled: !!enrolled,
    enroll,
    unlock,
    clear,
  };
}
