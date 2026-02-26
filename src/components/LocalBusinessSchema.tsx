import { useEffect } from "react";

const LocalBusinessSchema = () => {
  useEffect(() => {
    // Main LocalBusiness schema
    const businessScript = document.createElement("script");
    businessScript.type = "application/ld+json";
    businessScript.id = "local-business-schema";
    businessScript.textContent = JSON.stringify({
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
        { "@type": "City", name: "Miami" },
        { "@type": "City", name: "New York" },
        { "@type": "City", name: "Austin" },
        { "@type": "City", name: "Chicago" },
        { "@type": "City", name: "Dallas" },
        { "@type": "City", name: "San Francisco" },
        { "@type": "City", name: "Scottsdale" },
        { "@type": "City", name: "Nashville" },
        { "@type": "City", name: "Aspen" },
        { "@type": "City", name: "Houston" },
        { "@type": "City", name: "Seattle" },
        { "@type": "City", name: "Denver" },
        { "@type": "City", name: "Atlanta" },
        { "@type": "City", name: "Boston" },
        { "@type": "City", name: "Washington DC" },
        { "@type": "City", name: "Philadelphia" },
        { "@type": "City", name: "Portland" },
        { "@type": "City", name: "Napa Valley" },
        { "@type": "City", name: "Palm Springs" },
        { "@type": "City", name: "The Hamptons" },
        { "@type": "City", name: "Greenwich" },
        { "@type": "City", name: "Park City" },
        { "@type": "City", name: "Nantucket" },
        { "@type": "City", name: "Potomac" },
        { "@type": "City", name: "Buckhead" },
        { "@type": "City", name: "Highland Park" },
        { "@type": "City", name: "Lake Tahoe" },
        { "@type": "City", name: "Burlingame" },
        { "@type": "City", name: "San Mateo" },
        { "@type": "City", name: "Carmel-by-the-Sea" },
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
        "@id": "https://whiterabbitla.com/#scott-syme",
        name: "Scott Syme",
      },
      makesOffer: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Corporate Event Magic",
            description: "Close-up magic and mentalism for corporate events, product launches, and galas.",
            url: "https://whiterabbitla.com/services/corporate-magician",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Private Party Magic",
            description: "Bespoke magic entertainment for private celebrations and dinner parties.",
            url: "https://whiterabbitla.com/services/private-party-magician",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Wedding Entertainment",
            description: "Cocktail hour magic for weddings across Los Angeles and beyond.",
            url: "https://whiterabbitla.com/services/wedding-magician",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Close-Up Magic",
            description: "Intimate sleight of hand and mentalism performed directly for guests.",
            url: "https://whiterabbitla.com/services/close-up-magician",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Parlor Magic Show",
            description: "A curated 45-minute theatrical magic experience for groups of 20-120.",
            url: "https://whiterabbitla.com/services/private-magic-show",
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

    // Person schema for Scott Syme (helps AI cite him as an authority)
    const personScript = document.createElement("script");
    personScript.type = "application/ld+json";
    personScript.id = "person-schema";
    personScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://whiterabbitla.com/#scott-syme",
      name: "Scott Syme",
      jobTitle: "Magician & Mentalist",
      description: "Los Angeles based magician and mentalist specializing in close-up magic and parlor shows for luxury events. Member of the Magic Castle® in Hollywood. Featured on America's Got Talent. Performed for Netflix, Disney, Paramount, Morgan Stanley, Rolls-Royce, and Rivian. 500+ events. Perfect 5.0 Google rating.",
      url: "https://whiterabbitla.com/about",
      image: "https://whiterabbitla.com/og-image.jpg",
      worksFor: {
        "@type": "LocalBusiness",
        "@id": "https://whiterabbitla.com/#business",
        name: "White Rabbit LA",
      },
      knowsAbout: [
        "Close-up magic",
        "Mentalism",
        "Sleight of hand",
        "Corporate entertainment",
        "Event entertainment",
        "Parlor magic shows",
        "Wedding entertainment",
        "Trade show magic",
        "Brand activations",
      ],
      hasCredential: [
        {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "Professional Membership",
          name: "Member, Academy of Magical Arts (Magic Castle®)",
          recognizedBy: {
            "@type": "Organization",
            name: "The Academy of Magical Arts",
            url: "https://www.magiccastle.com",
          },
        },
      ],
      hasOccupation: {
        "@type": "Occupation",
        name: "Professional Magician & Mentalist",
        occupationLocation: {
          "@type": "City",
          name: "Los Angeles",
        },
      },
      performerIn: [
        {
          "@type": "Event",
          name: "America's Got Talent",
          organizer: { "@type": "Organization", name: "NBC" },
        },
        {
          "@type": "Event",
          name: "Magic Mondays",
          location: { "@type": "Place", name: "Hollywood, Los Angeles" },
          organizer: { "@type": "Organization", name: "White Rabbit LA" },
        },
      ],
      award: [
        "Featured Performer — America's Got Talent (NBC)",
        "Magic Consultant — Disney Channel (Bizaardvark)",
        "Consultant to America's Got Talent Champion Dustin Tavella",
      ],
      sameAs: [
        "https://www.instagram.com/scottsyme_/",
        "https://shoutoutla.com/meet-scott-syme-jr-founder-magician/",
      ],
      memberOf: {
        "@type": "Organization",
        name: "The Academy of Magical Arts (Magic Castle®)",
        url: "https://www.magiccastle.com",
      },
    });

    // Remove existing if re-mounted
    document.getElementById("local-business-schema")?.remove();
    document.getElementById("person-schema")?.remove();

    document.head.appendChild(businessScript);
    document.head.appendChild(personScript);

    return () => {
      businessScript.remove();
      personScript.remove();
    };
  }, []);

  return null;
};

export default LocalBusinessSchema;