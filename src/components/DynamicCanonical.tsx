import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://whiterabbitla.com";

/**
 * Global fallback: keeps canonical & og:url in sync with the current route.
 * Individual pages may override via usePageMeta, but this ensures every route
 * has a correct canonical even if usePageMeta isn't called.
 */
const DynamicCanonical = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = `${BASE_URL}${pathname === "/" ? "" : pathname}`;

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.href = url;
    } else {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = url;
      document.head.appendChild(canonical);
    }

    // og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", url);
    } else {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      ogUrl.setAttribute("content", url);
      document.head.appendChild(ogUrl);
    }
  }, [pathname]);

  return null;
};

export default DynamicCanonical;
