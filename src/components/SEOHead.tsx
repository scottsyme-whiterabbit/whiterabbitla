import { useEffect } from "react";

const BASE_URL = "https://whiterabbitla.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_TITLE = "Los Angeles Magician for Hire | White Rabbit LA";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  schemaJson?: Record<string, unknown> | Record<string, unknown>[];
  type?: string;
}

function setMetaTag(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
}

function removeMetaTag(attr: string, key: string) {
  document.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

const SEOHead = ({
  title,
  description,
  canonical,
  ogImage,
  noIndex = false,
  schemaJson,
  type = "website",
}: SEOHeadProps) => {
  useEffect(() => {
    const url = canonical
      ? canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`
      : `${BASE_URL}${window.location.pathname}`;
    const image = ogImage
      ? ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`
      : DEFAULT_IMAGE;

    // Title
    document.title = title;

    // Meta description
    setMetaTag("name", "description", description);

    // Robots
    if (noIndex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      removeMetaTag("name", "robots");
    }

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (link) {
      link.href = url;
    } else {
      link = document.createElement("link");
      link.rel = "canonical";
      link.href = url;
      document.head.appendChild(link);
    }

    // Open Graph
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:image", image);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:site_name", "White Rabbit Los Angeles");

    // Twitter
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", image);

    // Schema JSON-LD
    const schemas = schemaJson
      ? Array.isArray(schemaJson) ? schemaJson : [schemaJson]
      : [];

    // Remove old injected schemas
    document.querySelectorAll('script[data-seo-head="true"]').forEach(el => el.remove());

    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-head", "true");
      script.textContent = JSON.stringify({ "@context": "https://schema.org", ...schema });
      document.head.appendChild(script);
    });

    // Cleanup on unmount
    return () => {
      document.title = DEFAULT_TITLE;
      document.querySelectorAll('script[data-seo-head="true"]').forEach(el => el.remove());
    };
  }, [title, description, canonical, ogImage, noIndex, schemaJson, type]);

  return null;
};

export default SEOHead;
