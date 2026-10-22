import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

interface Props {
  to: string;
  /** Optional display title while the redirect resolves. */
  title?: string;
}

/** Idempotent crawler signals, intentionally retained after unmount. */
function setRedirectHead(to: string) {
  if (typeof document === "undefined") return;
  const destination = /^https?:\/\//i.test(to) ? to : `https://whiterabbitla.com${to}`;
  const metas = [
    ["prerender-status-code", "301"],
    ["prerender-header", `Location: ${destination}`],
    ["robots", "noindex"],
  ];
  for (const [name, content] of metas) {
    let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
    meta.setAttribute("data-removed-route", "true");
  }
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = destination;
  canonical.setAttribute("data-removed-route", "true");
}

const RemovedRouteRedirect = ({ to, title = "Redirecting…" }: Props) => {
  const isBot = typeof navigator !== "undefined" && (navigator.webdriver === true || /bot|crawl|spider|slurp|headless|prerender|lovablehtml|encited|lighthouse/i.test(navigator.userAgent));
  if (isBot) setRedirectHead(to);

  // Preserve the exact crawler signals after SEOHead's passive metadata update.
  useEffect(() => {
    if (isBot) setRedirectHead(to);
  }, [isBot, to]);

  if (!isBot) return <Navigate to={to} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <SEOHead title={title} description="This page has moved." canonical={to} noIndex />
      <div className="px-4 text-center">
        <h1 className="mb-4 text-4xl">This page has moved</h1>
        <a href={to} className="break-words text-primary underline hover:text-primary/90">
          Continue to {to}
        </a>
      </div>
    </div>
  );
};

export default RemovedRouteRedirect;
