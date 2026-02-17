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
  "West Coast",
  "Mountain & Resort",
  "Southwest",
  "Texas",
  "Southeast",
  "Northeast",
  "Midwest",
  "National",
] as const;

const cityData: { city: string; region: string; photo: string; tagline: string }[] = [
  // Southern California
  { city: "Los Angeles", region: "Southern California", photo: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&h=400&fit=crop", tagline: "Home base — from Hollywood premieres to Bel Air estates" },
  { city: "Beverly Hills", region: "Southern California", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Rodeo Drive galas and private estate soirées" },
  { city: "Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1536353555400-f5226e6e5d31?w=600&h=400&fit=crop", tagline: "Studio events, wrap parties and red carpet nights" },
  { city: "Santa Monica", region: "Southern California", photo: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=400&fit=crop", tagline: "Oceanfront receptions and beachside celebrations" },
  { city: "Malibu", region: "Southern California", photo: "https://images.unsplash.com/photo-1506953823-d5f6efc0e358?w=600&h=400&fit=crop", tagline: "Cliffside mansions and PCH-view events" },
  { city: "West Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?w=600&h=400&fit=crop", tagline: "Sunset Strip venues and members-only clubs" },
  { city: "Bel Air", region: "Southern California", photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop", tagline: "Ultra-private estate entertainment" },
  { city: "Pasadena", region: "Southern California", photo: "https://images.unsplash.com/photo-1597589827317-4c6d6e690c38?w=600&h=400&fit=crop", tagline: "Historic venues and garden celebrations" },
  { city: "Calabasas", region: "Southern California", photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop", tagline: "Celebrity neighborhoods and gated community events" },
  { city: "Orange County", region: "Southern California", photo: "https://images.unsplash.com/photo-1500316124030-4cffa46f10f0?w=600&h=400&fit=crop", tagline: "Newport Coast galas and Laguna Beach gatherings" },
  { city: "San Diego", region: "Southern California", photo: "https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=600&h=400&fit=crop", tagline: "Waterfront conventions and La Jolla retreats" },
  { city: "Newport Beach", region: "Southern California", photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", tagline: "Harbor-view receptions and yacht club events" },
  { city: "Montecito", region: "Southern California", photo: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&h=400&fit=crop", tagline: "Oprah-neighbor-level private affairs" },
  { city: "Palm Springs", region: "Southern California", photo: "https://images.unsplash.com/photo-1545063328-c8e2c6f6f6f9?w=600&h=400&fit=crop", tagline: "Mid-century modern retreats and desert galas" },
  { city: "Coronado", region: "Southern California", photo: "https://images.unsplash.com/photo-1563991655280-cb95c90ca0e6?w=600&h=400&fit=crop", tagline: "Island elegance at the Hotel del Coronado and beyond" },
  { city: "Santa Barbara", region: "Southern California", photo: "https://images.unsplash.com/photo-1527168027773-0cc890c4f42e?w=600&h=400&fit=crop", tagline: "American Riviera weddings and wine country affairs" },

  // Northern California
  { city: "San Francisco", region: "Northern California", photo: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop", tagline: "Tech galas and Pacific Heights soirées" },
  { city: "Napa Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop", tagline: "Vineyard dinners and winery estate events" },
  { city: "Hillsborough", region: "Northern California", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Peninsula estate entertainment" },
  { city: "San Mateo", region: "Northern California", photo: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop", tagline: "Silicon Valley corporate celebrations" },
  { city: "Burlingame", region: "Northern California", photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop", tagline: "Bayside corporate events" },
  { city: "Atherton", region: "Northern California", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "America's most exclusive zip code celebrations" },
  { city: "Palo Alto", region: "Northern California", photo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop", tagline: "Venture capital dinners and tech founder parties" },
  { city: "Woodside", region: "Northern California", photo: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop", tagline: "Redwood estate gatherings" },
  { city: "Los Altos", region: "Northern California", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Silicon Valley private parties" },
  { city: "Menlo Park", region: "Northern California", photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", tagline: "Tech campus events and founder dinners" },
  { city: "Saratoga", region: "Northern California", photo: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop", tagline: "Foothill estate celebrations" },
  { city: "Los Gatos", region: "Northern California", photo: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop", tagline: "Wine country adjacent luxury events" },
  { city: "Tiburon", region: "Northern California", photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", tagline: "Waterfront Marin County affairs" },
  { city: "Mill Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop", tagline: "Redwood-shaded private events" },
  { city: "Sonoma", region: "Northern California", photo: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop", tagline: "Wine country retreats and harvest dinners" },
  { city: "Carmel-by-the-Sea", region: "Northern California", photo: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop", tagline: "Coastal luxury weddings and intimate gatherings" },

  // West Coast
  { city: "Seattle", region: "West Coast", photo: "https://images.unsplash.com/photo-1502175353174-a7a70e73b4c3?w=600&h=400&fit=crop", tagline: "Pacific Northwest corporate galas" },
  { city: "Portland", region: "West Coast", photo: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop", tagline: "Creative industry celebrations" },

  // Mountain & Resort
  { city: "Las Vegas", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&h=400&fit=crop", tagline: "Casino nights, conventions and VIP suites" },
  { city: "Aspen", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1548587665-54e41d2e7e13?w=600&h=400&fit=crop", tagline: "Ski lodge celebrations and mountain retreats" },
  { city: "Vail", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&h=400&fit=crop", tagline: "Alpine luxury and aprés-ski entertainment" },
  { city: "Park City", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop", tagline: "Sundance season parties and mountain estates" },
  { city: "Jackson Hole", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", tagline: "Grand Teton backdrop private events" },
  { city: "Sun Valley", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&h=400&fit=crop", tagline: "Idaho's billionaire playground celebrations" },
  { city: "Lake Tahoe", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=600&h=400&fit=crop", tagline: "Lakeside lodges and mountain-view galas" },
  { city: "Telluride", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=400&fit=crop", tagline: "Remote luxury in the Colorado Rockies" },
  { city: "Denver", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=600&h=400&fit=crop", tagline: "Mile-high corporate events and galas" },

  // Southwest
  { city: "Scottsdale", region: "Southwest", photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop", tagline: "Desert resort incentive trips and golf outings" },
  { city: "Paradise Valley", region: "Southwest", photo: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&h=400&fit=crop", tagline: "Arizona's most exclusive enclave" },
  { city: "Austin", region: "Southwest", photo: "https://images.unsplash.com/photo-1588993608830-fae41e74e8c1?w=600&h=400&fit=crop", tagline: "SXSW parties and tech industry celebrations" },

  // Texas
  { city: "Dallas", region: "Texas", photo: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=600&h=400&fit=crop", tagline: "Highland Park galas and corporate affairs" },
  { city: "Houston", region: "Texas", photo: "https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=600&h=400&fit=crop", tagline: "River Oaks estate parties and energy sector events" },
  { city: "Highland Park", region: "Texas", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Dallas's premier neighborhood celebrations" },
  { city: "River Oaks", region: "Texas", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "Houston's luxury district events" },

  // Southeast
  { city: "Miami", region: "Southeast", photo: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=600&h=400&fit=crop", tagline: "South Beach parties and Brickell penthouse events" },
  { city: "Nashville", region: "Southeast", photo: "https://images.unsplash.com/photo-1545419913-775d54a0b4e4?w=600&h=400&fit=crop", tagline: "Music Row celebrations and bourbon bar receptions" },
  { city: "Atlanta", region: "Southeast", photo: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop", tagline: "Buckhead galas and Midtown corporate events" },
  { city: "Palm Beach", region: "Southeast", photo: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop", tagline: "The Breakers and Worth Avenue private affairs" },
  { city: "Naples", region: "Southeast", photo: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop", tagline: "Gulf Coast luxury community celebrations" },
  { city: "Coral Gables", region: "Southeast", photo: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop", tagline: "Biltmore elegance and coral rock estates" },
  { city: "Jupiter", region: "Southeast", photo: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop", tagline: "Exclusive Florida coastal celebrations" },
  { city: "Sarasota", region: "Southeast", photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", tagline: "Ringling-era elegance and barrier island events" },
  { city: "Buckhead", region: "Southeast", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Atlanta's most prestigious neighborhood events" },
  { city: "Nantucket", region: "Northeast", photo: "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&h=400&fit=crop", tagline: "Island getaway celebrations" },
  { city: "Martha's Vineyard", region: "Northeast", photo: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=600&h=400&fit=crop", tagline: "Coastal New England estate parties" },

  // Northeast
  { city: "New York", region: "Northeast", photo: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop", tagline: "Manhattan penthouses and Hamptons estates" },
  { city: "The Hamptons", region: "Northeast", photo: "https://images.unsplash.com/photo-1499793983394-12dec4e73116?w=600&h=400&fit=crop", tagline: "East End summer celebrations and benefit galas" },
  { city: "Greenwich", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Gold Coast estate entertainment" },
  { city: "Boston", region: "Northeast", photo: "https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=600&h=400&fit=crop", tagline: "Back Bay galas and Cambridge celebrations" },
  { city: "Washington DC", region: "Northeast", photo: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=400&fit=crop", tagline: "Embassy dinners and Georgetown receptions" },
  { city: "Philadelphia", region: "Northeast", photo: "https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=600&h=400&fit=crop", tagline: "Main Line estates and Center City galas" },
  { city: "Short Hills", region: "Northeast", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "New Jersey's luxury enclave celebrations" },
  { city: "Potomac", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "DC-area estate events and charity galas" },

  // Midwest
  { city: "Chicago", region: "Midwest", photo: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=600&h=400&fit=crop", tagline: "Gold Coast penthouses and Lake Shore galas" },
  { city: "Winnetka", region: "Midwest", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "North Shore estate celebrations" },
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
