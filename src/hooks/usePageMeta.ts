import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
}

const BASE_URL = "https://whiterabbitla.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

function setMetaTag(property: string, content: string, isProperty = true) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
}

export function usePageMeta({ title, description, path, image, type = "website" }: PageMeta) {
  useEffect(() => {
    const url = path ? `${BASE_URL}${path}` : BASE_URL;
    const ogImage = image || DEFAULT_IMAGE;

    // Standard
    document.title = title;
    setMetaTag("description", description, false);

    // Open Graph
    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    setMetaTag("og:url", url);
    setMetaTag("og:image", ogImage);
    setMetaTag("og:type", type);
    setMetaTag("og:site_name", "White Rabbit Los Angeles");

    // Twitter
    setMetaTag("twitter:card", "summary_large_image", false);
    setMetaTag("twitter:title", title, false);
    setMetaTag("twitter:description", description, false);
    setMetaTag("twitter:image", ogImage, false);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = url;
    } else {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = url;
      document.head.appendChild(canonical);
    }
  }, [title, description, path, image, type]);
}
