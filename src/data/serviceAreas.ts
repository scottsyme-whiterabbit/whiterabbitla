// Service area data with city photos and regional grouping

export interface ServiceArea {
  city: string;
  slug: string;
  region: string;
  photo: string; // Unsplash photo URL
  tagline: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const serviceAreaRegions = [
  "Southern California",
  "Northern California",
  "Mountain & Resort",
  "Southwest",
  "Southeast",
  "Northeast",
  "National",
] as const;

const cityData: { city: string; region: string; photo: string; tagline: string }[] = [
  // Southern California
  { city: "Los Angeles", region: "Southern California", photo: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&h=400&fit=crop", tagline: "Home base, from Hollywood premieres to Bel Air estates" },
  { city: "Beverly Hills", region: "Southern California", photo: "/areas/beverly-hills.jpg", tagline: "Rodeo Drive galas and private estate soirées" },
  { city: "Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1506184106046-1e6e90c0222d?w=600&h=400&fit=crop", tagline: "Studio events, wrap parties and red carpet nights" },
  { city: "Santa Monica", region: "Southern California", photo: "https://images.unsplash.com/photo-1514321648849-f4e1d5da98dc?w=600&h=400&fit=crop", tagline: "Oceanfront receptions and beachside celebrations" },
  { city: "Malibu", region: "Southern California", photo: "https://images.unsplash.com/photo-1608651491346-203b49350557?w=600&h=400&fit=crop", tagline: "Cliffside mansions and PCH-view events" },
  { city: "West Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&h=400&fit=crop", tagline: "Sunset Strip venues and members-only clubs" },
  { city: "Bel Air", region: "Southern California", photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop", tagline: "Ultra-private estate entertainment" },
  { city: "Pasadena", region: "Southern California", photo: "/areas/pasadena.jpg", tagline: "Historic venues and garden celebrations" },
  { city: "Calabasas", region: "Southern California", photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop", tagline: "Celebrity neighborhoods and gated community events" },
  { city: "Orange County", region: "Southern California", photo: "/areas/orange-county.jpg", tagline: "Newport Coast galas and Laguna Beach gatherings" },
  { city: "San Diego", region: "Southern California", photo: "https://images.unsplash.com/photo-1583195426307-cbbe1d867a32?w=600&h=400&fit=crop", tagline: "Waterfront conventions and La Jolla retreats" },
  { city: "Newport Beach", region: "Southern California", photo: "https://images.unsplash.com/photo-1637590376449-9a205e906063?w=600&h=400&fit=crop", tagline: "Harbor-view receptions and yacht club events" },
  { city: "Montecito", region: "Southern California", photo: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop", tagline: "Oprah-neighbor-level private affairs" },
  { city: "Palm Springs", region: "Southern California", photo: "https://images.unsplash.com/photo-1558645836-e44122a743ee?w=600&h=400&fit=crop", tagline: "Mid-century modern retreats and desert galas" },
  { city: "Coronado", region: "Southern California", photo: "https://images.unsplash.com/photo-1560874219-1a7de57ab01d?w=600&h=400&fit=crop", tagline: "Island elegance at the Hotel del Coronado and beyond" },
  { city: "Santa Barbara", region: "Southern California", photo: "/areas/santa-barbara.jpg", tagline: "American Riviera weddings and wine country affairs" },
  { city: "Pacific Palisades", region: "Southern California", photo: "/areas/pacific-palisades.jpg", tagline: "Ocean bluff estates and Getty Villa gatherings" },
  { city: "Brentwood", region: "Southern California", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "San Vicente estates and Getty Center celebrations" },
  { city: "Manhattan Beach", region: "Southern California", photo: "/areas/manhattan-beach.jpg", tagline: "South Bay elegance and Strand House soirées" },
  { city: "Encino", region: "Southern California", photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop", tagline: "San Fernando Valley estate celebrations" },
  { city: "Downtown LA", region: "Southern California", photo: "https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=600&h=400&fit=crop", tagline: "Arts District lofts and historic ballroom galas" },
  { city: "Laguna Beach", region: "Southern California", photo: "/areas/laguna-beach.jpg", tagline: "Artist colony luxury and oceanfront celebrations" },
  { city: "Long Beach", region: "Southern California", photo: "/areas/long-beach.jpg", tagline: "Queen Mary elegance and waterfront conventions" },
  { city: "Burbank", region: "Southern California", photo: "/areas/burbank.jpg", tagline: "Studio lot parties and media industry events" },
  { city: "Studio City", region: "Southern California", photo: "/areas/studio-city.jpg", tagline: "Tujunga Village charm and canyon celebrations" },
  { city: "Westlake Village", region: "Southern California", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Four Seasons lakeside luxury" },
  { city: "Thousand Oaks", region: "Southern California", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "Sherwood Country Club prestige" },
  { city: "Rancho Palos Verdes", region: "Southern California", photo: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop", tagline: "Terranea Resort and ocean cliff elegance" },
  { city: "Silver Lake", region: "Southern California", photo: "/areas/silver-lake.jpg", tagline: "Creative community hillside celebrations" },
  { city: "Los Feliz", region: "Southern California", photo: "/areas/los-feliz.jpg", tagline: "Old Hollywood charm and Greek Theatre nights" },

  // Northern California
  { city: "San Francisco", region: "Northern California", photo: "https://images.unsplash.com/photo-1521464302861-ce943915d1c3?w=600&h=400&fit=crop", tagline: "Tech galas and Pacific Heights soirées" },

  // Mountain & Resort
  { city: "Las Vegas", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&h=400&fit=crop", tagline: "Casino nights, conventions and VIP suites" },
  { city: "Aspen", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1578241561880-0a1d5db3cb8a?w=600&h=400&fit=crop", tagline: "Ski lodge celebrations and mountain retreats" },

  // Southwest
  { city: "Scottsdale", region: "Southwest", photo: "/areas/scottsdale.jpg", tagline: "Desert resort incentive trips and golf outings" },

  // Southeast
  { city: "Miami", region: "Southeast", photo: "/areas/miami.jpg", tagline: "South Beach parties and Brickell penthouse events" },
  { city: "Palm Beach", region: "Southeast", photo: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop", tagline: "The Breakers and Worth Avenue private affairs" },

  // Northeast
  { city: "New York", region: "Northeast", photo: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop", tagline: "Manhattan penthouses and Hamptons estates" },
  { city: "The Hamptons", region: "Northeast", photo: "/areas/the-hamptons.jpg", tagline: "East End summer celebrations and benefit galas" },
  { city: "Boston", region: "Northeast", photo: "/areas/boston.jpg", tagline: "Back Bay galas and Cambridge celebrations" },
];

export const serviceAreas: ServiceArea[] = cityData.map((c) => ({
  ...c,
  slug: slugify(c.city),
}));

export const getAreasByRegion = () => {
  const grouped: Record<string, ServiceArea[]> = {};
  for (const area of serviceAreas) {
    if (!grouped[area.region]) grouped[area.region] = [];
    grouped[area.region].push(area);
  }
  return grouped;
};

export const getAreaBySlug = (slug: string) =>
  serviceAreas.find((a) => a.slug === slug);
