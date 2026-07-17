import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

interface Props {
  to: string;
  /** Optional display title while the redirect resolves. */
  title?: string;
}

/**
 * Renders a noindex page with a canonical pointing at the live destination
 * and a <meta http-equiv="refresh"> so crawlers that don't execute JS still
 * follow the hop. React Router then completes the client-side redirect.
 *
 * Used for pruned city/service routes that used to be prerendered so search
 * engines drop the old URLs instead of treating a JS-only <Navigate/> as a
 * soft-200.
 */
const RemovedRouteRedirect = ({ to, title = "Redirecting…" }: Props) => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.httpEquiv = "refresh";
    meta.content = `0;url=${to}`;
    meta.setAttribute("data-removed-route", "true");
    document.head.appendChild(meta);
    return () => {
      document.querySelectorAll('meta[data-removed-route="true"]').forEach((el) => el.remove());
    };
  }, [to]);

  return (
    <>
      <SEOHead title={title} description="This page has moved." canonical={to} noIndex />
      <Navigate to={to} replace />
    </>
  );
};

export default RemovedRouteRedirect;
