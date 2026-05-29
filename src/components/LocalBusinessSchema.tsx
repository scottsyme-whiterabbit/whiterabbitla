import { useEffect } from "react";

const LocalBusinessSchema = () => {
  useEffect(() => {
    // WebSite schema (helps Google sitelinks + site search)
    const websiteScript = document.createElement("script");
    websiteScript.type = "application/ld+json";
    websiteScript.id = "website-schema";
    websiteScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://whiterabbitla.com/#website",
      name: "White Rabbit LA",
      alternateName: "White Rabbit Magic",
      url: "https://whiterabbitla.com",
      description: "Bespoke magic and mentalism entertainment for luxury events. Led by magician Scott Syme.",
      publisher: {
        "@type": "Organization",
        "@id": "https://whiterabbitla.com/#business",
      },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://whiterabbitla.com/blog?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    });

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
      
      areaServed: [
        { "@type": "City", name: "Los Angeles", "@id": "https://www.wikidata.org/wiki/Q65" },
        { "@type": "City", name: "Beverly Hills" },
        { "@type": "City", name: "Hollywood" },
        { "@type": "City", name: "Santa Monica" },
        { "@type": "City", name: "Malibu" },
        { "@type": "City", name: "West Hollywood" },
        { "@type": "City", name: "Bel Air" },
        { "@type": "City", name: "Pasadena" },
        { "@type": "City", name: "Calabasas" },
        { "@type": "City", name: "Pacific Palisades" },
        { "@type": "City", name: "Brentwood" },
        { "@type": "City", name: "Manhattan Beach" },
        { "@type": "City", name: "Studio City" },
        { "@type": "City", name: "Burbank" },
        { "@type": "City", name: "Long Beach" },
        { "@type": "City", name: "Silver Lake" },
        { "@type": "City", name: "Los Feliz" },
        { "@type": "City", name: "Orange County" },
        { "@type": "City", name: "Laguna Beach" },
        { "@type": "City", name: "San Diego" },
        { "@type": "City", name: "Las Vegas" },
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
        { "@type": "City", name: "Santa Barbara" },
        { "@type": "City", name: "Montecito" },
        { "@type": "City", name: "Newport Beach" },
        { "@type": "City", name: "Charleston" },
        { "@type": "City", name: "Minneapolis" },
        { "@type": "City", name: "Coral Gables" },
        { "@type": "City", name: "Palm Beach" },
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
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "White Rabbit Magic Services",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "Event Entertainment",
            itemListElement: [
              offerItem("Corporate Event Magic", "Close-up magic and mentalism for corporate events, product launches, holiday parties, and galas.", "/services/corporate-magician"),
              offerItem("Private Party Magic", "Bespoke magic entertainment for private celebrations, birthday parties, and dinner parties.", "/services/private-party-magician"),
              offerItem("Wedding Entertainment", "Cocktail hour magic and reception entertainment for weddings across the US.", "/services/wedding-magician"),
              offerItem("Close-Up Magic", "Intimate sleight of hand and mentalism performed directly for guests during cocktail hours and receptions.", "/services/close-up-magician"),
              offerItem("Private Magic Show (Parlor Show)", "A curated 45-minute theatrical magic experience for groups of 20–120.", "/services/private-magic-show"),
            ],
          },
          {
            "@type": "OfferCatalog",
            name: "Specialty Events",
            itemListElement: [
              offerItem("Golf Tournament Magician", "Entertainment for post-round receptions, awards dinners, and hospitality tents at golf tournaments.", "/services/golf-tournament-magician"),
              offerItem("Charity Gala Magician", "Close-up magic and MC services for fundraisers, silent auctions, and charity galas.", "/services/charity-gala-magician"),
              offerItem("Holiday Party Magician", "Entertainment for corporate and private holiday celebrations, Christmas parties, and New Year's Eve events.", "/services/holiday-party-magician"),
              offerItem("Trade Show Magician", "Booth traffic driver using magic to attract, engage, and qualify leads at conventions and expos.", "/services/trade-show-magician"),
              offerItem("DMC Entertainment", "Magic entertainment for destination management companies, incentive trips, and group travel programs.", "/services/dmc-entertainment"),
              offerItem("Resident Event Magician", "Turnkey magic shows for luxury apartment communities, HOAs, and residential properties.", "/services/resident-event-magician"),
            ],
          },
        ],
      },
      makesOffer: [
        makeOffer("Corporate Event Magic", "Close-up magic and mentalism for corporate events, product launches, holiday parties, and galas.", "/services/corporate-magician"),
        makeOffer("Private Party Magic", "Bespoke magic entertainment for private celebrations, birthday parties, and dinner parties.", "/services/private-party-magician"),
        makeOffer("Wedding Entertainment", "Cocktail hour magic and reception entertainment for weddings across the US.", "/services/wedding-magician"),
        makeOffer("Close-Up Magic", "Intimate sleight of hand and mentalism performed directly for guests during cocktail hours and receptions.", "/services/close-up-magician"),
        makeOffer("Private Magic Show (Parlor Show)", "A curated 45-minute theatrical magic experience for groups of 20–120.", "/services/private-magic-show"),
        makeOffer("Golf Tournament Magician", "Entertainment for post-round receptions, awards dinners, and hospitality tents.", "/services/golf-tournament-magician"),
        makeOffer("Charity Gala Magician", "Close-up magic and MC services for fundraisers, silent auctions, and charity galas.", "/services/charity-gala-magician"),
        makeOffer("Holiday Party Magician", "Entertainment for corporate and private holiday celebrations.", "/services/holiday-party-magician"),
        makeOffer("Trade Show Magician", "Booth traffic driver using magic at conventions and expos.", "/services/trade-show-magician"),
        makeOffer("DMC Entertainment", "Magic entertainment for incentive trips and group travel programs.", "/services/dmc-entertainment"),
        makeOffer("Resident Event Magician", "Turnkey magic shows for luxury apartment communities and residential properties.", "/services/resident-event-magician"),
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        bestRating: "5",
        ratingCount: "50",
        reviewCount: "50",
      },
      review: [
        makeReview("Jamie I.", "Scott performed at a 200-person event for us and the guests absolutely LOVED him and were amazed by his talents. I could not recommend him more! We can't wait to have him back.", "2024-11-15"),
        makeReview("Meridith F.", "Scott performed up close magic for small groups at my 40th birthday party and was OUTSTANDING. I can't tell you how many guests told me he was the highlight of the evening.", "2024-10-20"),
        makeReview("Grace G.", "My company hosted a holiday dinner and we had the pleasure of experiencing Scott's magic show. He is incredible and had the whole room captivated.", "2024-12-10"),
        makeReview("Josh T.", "He was fantastic to work with. Scott is warm, personable, funny, energetic and an EXCELLENT magician. I can't recommend him highly enough.", "2024-09-15"),
        makeReview("Zara M.", "Scott was so amazing. He elevated our party in ways I didn't expect, and he was everyone's favorite part. Absolutely worth it.", "2024-08-22"),
      ],
    });

    // Person schema for Scott Syme
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
        "Golf tournament entertainment",
        "Charity gala entertainment",
        "DMC and incentive trip entertainment",
        "Resident event entertainment",
        "Holiday party entertainment",
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
    document.getElementById("website-schema")?.remove();
    document.getElementById("local-business-schema")?.remove();
    document.getElementById("person-schema")?.remove();

    document.head.appendChild(websiteScript);
    document.head.appendChild(businessScript);
    document.head.appendChild(personScript);

    return () => {
      websiteScript.remove();
      businessScript.remove();
      personScript.remove();
    };
  }, []);

  return null;
};

// Helper to build Offer items
function makeOffer(name: string, description: string, path: string) {
  return {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name,
      description,
      url: `https://whiterabbitla.com${path}`,
    },
  };
}

// Helper for OfferCatalog items
function offerItem(name: string, description: string, path: string) {
  return {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name,
      description,
      url: `https://whiterabbitla.com${path}`,
    },
  };
}

// Helper for Review items
function makeReview(author: string, reviewBody: string, datePublished: string) {
  return {
    "@type": "Review",
    author: { "@type": "Person", name: author },
    reviewBody,
    datePublished,
    reviewRating: {
      "@type": "Rating",
      ratingValue: "5",
      bestRating: "5",
    },
  };
}

export default LocalBusinessSchema;
