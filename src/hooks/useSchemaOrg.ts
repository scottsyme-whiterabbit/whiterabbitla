import { useEffect } from "react";

const BASE_URL = "https://whiterabbitla.com";

const publisher = {
  "@type": "Organization",
  name: "White Rabbit LA",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/og-image.jpg`,
  },
};

const author = {
  "@type": "Person",
  "@id": `${BASE_URL}/#scott-syme`,
  name: "Scott Syme",
  url: `${BASE_URL}/about`,
};

// Generic hook to inject one or more JSON-LD scripts
export function useJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  useEffect(() => {
    const items = Array.isArray(data) ? data : [data];
    const scripts: HTMLScriptElement[] = [];

    items.forEach((item, i) => {
      const scriptId = items.length === 1 ? id : `${id}-${i}`;
      document.getElementById(scriptId)?.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = scriptId;
      script.textContent = JSON.stringify({ "@context": "https://schema.org", ...item });
      document.head.appendChild(script);
      scripts.push(script);
    });

    return () => scripts.forEach((s) => s.remove());
  }, [id, data]);
}

// ----- Page-specific schema builders -----

export function useArticleSchema(article: {
  title: string;
  metaDescription: string;
  slug: string;
  publishDate: string;
  category: string;
  content: string[];
  image?: string;
}) {
  const wordCount = article.content.join(" ").split(/\s+/).length;

  useJsonLd("article-schema", [
    {
      "@type": "Article",
      headline: article.title,
      description: article.metaDescription,
      author,
      publisher,
      datePublished: article.publishDate,
      dateModified: article.publishDate,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${BASE_URL}/blog/${article.slug}`,
      },
      image: article.image || `${BASE_URL}/og/blog-default.png`,
      url: `${BASE_URL}/blog/${article.slug}`,
      articleSection: article.category,
      wordCount,
      inLanguage: "en-US",
    },
    breadcrumb([
      { name: "Home", url: BASE_URL },
      { name: "Blog", url: `${BASE_URL}/blog` },
      { name: article.title, url: `${BASE_URL}/blog/${article.slug}` },
    ]),
  ]);
}

export function useServiceSchema(service: {
  title: string;
  metaDescription: string;
  slug: string;
  intro: string;
}) {
  useJsonLd("service-schema", [
    {
      "@type": "Service",
      name: service.title,
      description: service.metaDescription,
      provider: {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#business`,
        name: "White Rabbit LA",
      },
      url: `${BASE_URL}/services/${service.slug}`,
      areaServed: { "@type": "Country", name: "United States" },
      image: `${BASE_URL}/og-image.jpg`,
    },
    breadcrumb([
      { name: "Home", url: BASE_URL },
      { name: "Services", url: `${BASE_URL}/experience` },
      { name: service.title, url: `${BASE_URL}/services/${service.slug}` },
    ]),
  ]);
}

export function useBreadcrumbSchema(items: { name: string; path: string }[]) {
  useJsonLd(
    "breadcrumb-schema",
    breadcrumb(items.map((i) => ({ name: i.name, url: `${BASE_URL}${i.path}` })))
  );
}

export function useWebPageSchema(page: {
  name: string;
  description: string;
  path: string;
  type?: string;
}) {
  useJsonLd("webpage-schema", [
    {
      "@type": page.type || "WebPage",
      name: page.name,
      description: page.description,
      url: `${BASE_URL}${page.path}`,
      isPartOf: { "@type": "WebSite", "@id": `${BASE_URL}/#website`, name: "White Rabbit LA", url: BASE_URL },
      publisher,
      inLanguage: "en-US",
    },
    breadcrumb([
      { name: "Home", url: BASE_URL },
      { name: page.name, url: `${BASE_URL}${page.path}` },
    ]),
  ]);
}

// Speakable schema for voice assistant optimization
export function useSpeakableSchema(page: {
  name: string;
  path: string;
  cssSelectors?: string[];
}) {
  useJsonLd("speakable-schema", {
    "@type": "WebPage",
    name: page.name,
    url: `${BASE_URL}${page.path}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: page.cssSelectors || ["h1", "h2", "[data-speakable]"],
    },
  });
}

// FAQ schema for blog articles with inline FAQ content
export function useFAQSchema(faqs: { question: string; answer: string }[]) {
  useJsonLd(
    "faq-schema",
    faqs.length > 0
      ? {
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : {}
  );
}

// Breadcrumb helper
function breadcrumb(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
