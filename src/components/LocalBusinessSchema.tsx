import { useEffect } from "react";

const LocalBusinessSchema = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "local-business-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://whiterabbitla.com/#business",
      name: "White Rabbit LA",
      alternateName: "White Rabbit Magic",
      description:
        "White Rabbit delivers bespoke magical experiences for Fortune 500 events, private celebrations, and luxury gatherings across Los Angeles and beyond. Led by magician Scott Syme.",
      url: "https://whiterabbitla.com",
      telephone: "+14243941850",
      email: "events@whiterabbitla.com",
      image: "https://whiterabbitla.com/og-image.jpg",
      priceRange: "$$$$",
      areaServed: [
        { "@type": "City", name: "Los Angeles", "@id": "https://www.wikidata.org/wiki/Q65" },
        { "@type": "City", name: "Beverly Hills" },
        { "@type": "City", name: "Hollywood" },
        { "@type": "City", name: "Santa Monica" },
        { "@type": "City", name: "Malibu" },
        { "@type": "City", name: "West Hollywood" },
        { "@type": "City", name: "Bel Air" },
        { "@type": "City", name: "Pasadena" },
        { "@type": "City", name: "Orange County" },
        { "@type": "City", name: "San Diego" },
        { "@type": "City", name: "Las Vegas" },
        { "@type": "City", name: "Calabasas" },
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 34.0522,
        longitude: -118.2437,
      },
      sameAs: [
        "https://www.instagram.com/scottsyme_/",
        "https://www.instagram.com/whiterabbit_la/",
      ],
      founder: {
        "@type": "Person",
        name: "Scott Syme",
        jobTitle: "Magician & Mentalist",
        url: "https://whiterabbitla.com/about",
      },
      makesOffer: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Corporate Event Magic",
            description: "Close-up magic and mentalism for corporate events, product launches, and galas.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Private Party Magic",
            description: "Bespoke magic entertainment for private celebrations and dinner parties.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Wedding Entertainment",
            description: "Cocktail hour magic for weddings across Los Angeles and beyond.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Close-Up Magic",
            description: "Intimate sleight of hand and mentalism performed directly for guests.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Parlor Magic Show",
            description: "A curated 45-minute theatrical magic experience for groups of 20-120.",
          },
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        bestRating: "5",
        ratingCount: "50",
        reviewCount: "50",
      },
    });

    // Remove existing if re-mounted
    const existing = document.getElementById("local-business-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default LocalBusinessSchema;
