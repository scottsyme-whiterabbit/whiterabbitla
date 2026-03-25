import { Helmet } from "react-helmet-async";

const BASE_URL = "https://whiterabbitla.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  schemaJson?: Record<string, unknown> | Record<string, unknown>[];
  type?: string;
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
  const url = canonical
    ? canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`
    : BASE_URL;
  const image = ogImage
    ? ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`
    : DEFAULT_IMAGE;

  const schemas = schemaJson
    ? Array.isArray(schemaJson) ? schemaJson : [schemaJson]
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="White Rabbit Los Angeles" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Schema JSON-LD */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify({ "@context": "https://schema.org", ...schema })}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
