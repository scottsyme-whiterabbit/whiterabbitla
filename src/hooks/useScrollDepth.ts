import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fires Meta Pixel + GA4 custom events when the user scrolls past
 * 50% and 75% of the page. Each threshold fires only once per page view.
 */
export const useScrollDepth = (pageName: string) => {
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = (scrollTop / docHeight) * 100;

      [50, 75].forEach((threshold) => {
        if (pct >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);

          // Meta Pixel custom event
          if (window.fbq) {
            window.fbq("trackCustom", "ScrollDepth", {
              page: pageName,
              depth: threshold,
            });
          }

          // GA4 custom event
          if (window.gtag) {
            window.gtag("event", "scroll_depth", {
              page_name: pageName,
              scroll_threshold: threshold,
            });
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pageName]);
};
