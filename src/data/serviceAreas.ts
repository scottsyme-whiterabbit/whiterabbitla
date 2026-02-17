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
  // Southern California — all verified Unsplash IDs
  { city: "Los Angeles", region: "Southern California", photo: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&h=400&fit=crop", tagline: "Home base — from Hollywood premieres to Bel Air estates" }, // LA skyline palm trees sunset
  { city: "Beverly Hills", region: "Southern California", photo: "/areas/beverly-hills.jpg", tagline: "Rodeo Drive galas and private estate soirées" },
  { city: "Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1506184106046-1e6e90c0222d?w=600&h=400&fit=crop", tagline: "Studio events, wrap parties and red carpet nights" }, // Hollywood Sign on hillside
  { city: "Santa Monica", region: "Southern California", photo: "https://images.unsplash.com/photo-1514321648849-f4e1d5da98dc?w=600&h=400&fit=crop", tagline: "Oceanfront receptions and beachside celebrations" }, // Santa Monica Pier ferris wheel
  { city: "Malibu", region: "Southern California", photo: "https://images.unsplash.com/photo-1608651491346-203b49350557?w=600&h=400&fit=crop", tagline: "Cliffside mansions and PCH-view events" }, // Malibu ocean cliff view
  { city: "West Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&h=400&fit=crop", tagline: "Sunset Strip venues and members-only clubs" }, // LA nightlife palms
  { city: "Bel Air", region: "Southern California", photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop", tagline: "Ultra-private estate entertainment" }, // Luxury modern estate pool
  { city: "Pasadena", region: "Southern California", photo: "/areas/pasadena.jpg", tagline: "Historic venues and garden celebrations" },
  { city: "Calabasas", region: "Southern California", photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop", tagline: "Celebrity neighborhoods and gated community events" }, // Luxury home exterior
  { city: "Orange County", region: "Southern California", photo: "https://images.unsplash.com/photo-1598584223013-2cc01d1a5280?w=600&h=400&fit=crop", tagline: "Newport Coast galas and Laguna Beach gatherings" }, // Beach coastline people
  { city: "San Diego", region: "Southern California", photo: "https://images.unsplash.com/photo-1583195426307-cbbe1d867a32?w=600&h=400&fit=crop", tagline: "Waterfront conventions and La Jolla retreats" }, // San Diego city skyline
  { city: "Newport Beach", region: "Southern California", photo: "https://images.unsplash.com/photo-1637590376449-9a205e906063?w=600&h=400&fit=crop", tagline: "Harbor-view receptions and yacht club events" }, // California beach pier
  { city: "Montecito", region: "Southern California", photo: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop", tagline: "Oprah-neighbor-level private affairs" }, // Spanish-style estate
  { city: "Palm Springs", region: "Southern California", photo: "https://images.unsplash.com/photo-1558645836-e44122a743ee?w=600&h=400&fit=crop", tagline: "Mid-century modern retreats and desert galas" }, // Desert resort landscape
  { city: "Coronado", region: "Southern California", photo: "https://images.unsplash.com/photo-1560874219-1a7de57ab01d?w=600&h=400&fit=crop", tagline: "Island elegance at the Hotel del Coronado and beyond" }, // San Diego coastal aerial
  { city: "Santa Barbara", region: "Southern California", photo: "https://images.unsplash.com/photo-1622157922317-7155b3679369?w=600&h=400&fit=crop", tagline: "American Riviera weddings and wine country affairs" }, // Green hills overlooking ocean

  // Northern California
  { city: "San Francisco", region: "Northern California", photo: "https://images.unsplash.com/photo-1521464302861-ce943915d1c3?w=600&h=400&fit=crop", tagline: "Tech galas and Pacific Heights soirées" }, // Golden Gate Bridge
  { city: "Napa Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop", tagline: "Vineyard dinners and winery estate events" }, // Wine glasses/vineyard
  { city: "Hillsborough", region: "Northern California", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "Peninsula estate entertainment" }, // Grand estate interior
  { city: "San Mateo", region: "Northern California", photo: "/areas/san-mateo.jpg", tagline: "Silicon Valley corporate celebrations" },
  { city: "Burlingame", region: "Northern California", photo: "/areas/burlingame.jpg", tagline: "Bayside corporate events" },
  { city: "Atherton", region: "Northern California", photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop", tagline: "America's most exclusive zip code celebrations" }, // Luxury gated estate
  { city: "Palo Alto", region: "Northern California", photo: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=600&h=400&fit=crop", tagline: "Venture capital dinners and tech founder parties" }, // Stanford/campus
  { city: "Woodside", region: "Northern California", photo: "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=600&h=400&fit=crop", tagline: "Redwood estate gatherings" }, // Tall redwood trees
  { city: "Los Altos", region: "Northern California", photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop", tagline: "Silicon Valley private parties" }, // Suburban luxury home
  { city: "Menlo Park", region: "Northern California", photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", tagline: "Tech campus events and founder dinners" }, // Modern office space
  { city: "Saratoga", region: "Northern California", photo: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop", tagline: "Foothill estate celebrations" }, // Vineyard rows
  { city: "Los Gatos", region: "Northern California", photo: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop", tagline: "Wine country adjacent luxury events" }, // Hills and vineyards
  { city: "Tiburon", region: "Northern California", photo: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop", tagline: "Waterfront Marin County affairs" }, // Coastal waterfront
  { city: "Mill Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1502630859934-b3b41d18206c?w=600&h=400&fit=crop", tagline: "Redwood-shaded private events" }, // Muir Woods redwoods
  { city: "Sonoma", region: "Northern California", photo: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop", tagline: "Wine country retreats and harvest dinners" }, // Wine grapes/vineyard
  { city: "Carmel-by-the-Sea", region: "Northern California", photo: "/areas/carmel-by-the-sea.jpg", tagline: "Coastal luxury weddings and intimate gatherings" },

  // West Coast
  { city: "Seattle", region: "West Coast", photo: "/areas/seattle.jpg", tagline: "Pacific Northwest corporate galas" },
  { city: "Portland", region: "West Coast", photo: "/areas/portland.jpg", tagline: "Creative industry celebrations" },

  // Mountain & Resort
  { city: "Las Vegas", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&h=400&fit=crop", tagline: "Casino nights, conventions and VIP suites" }, // Vegas Strip lights
  { city: "Aspen", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1578241561880-0a1d5db3cb8a?w=600&h=400&fit=crop", tagline: "Ski lodge celebrations and mountain retreats" }, // Aspen Maroon Bells
  { city: "Vail", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&h=400&fit=crop", tagline: "Alpine luxury and aprés-ski entertainment" }, // Vail ski village
  { city: "Park City", region: "Mountain & Resort", photo: "/areas/park-city.jpg", tagline: "Sundance season parties and mountain estates" },
  { city: "Jackson Hole", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=400&fit=crop", tagline: "Grand Teton backdrop private events" }, // Deer/mountain nature
  { city: "Sun Valley", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&h=400&fit=crop", tagline: "Idaho's billionaire playground celebrations" }, // Mountain valley
  { city: "Lake Tahoe", region: "Mountain & Resort", photo: "/areas/lake-tahoe.jpg", tagline: "Lakeside lodges and mountain-view galas" },
  { city: "Telluride", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=400&fit=crop", tagline: "Remote luxury in the Colorado Rockies" }, // Dramatic mountain peaks
  { city: "Denver", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=600&h=400&fit=crop", tagline: "Mile-high corporate events and galas" }, // Denver skyline mountains

  // Southwest
  { city: "Scottsdale", region: "Southwest", photo: "/areas/scottsdale.jpg", tagline: "Desert resort incentive trips and golf outings" },
  { city: "Paradise Valley", region: "Southwest", photo: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&h=400&fit=crop", tagline: "Arizona's most exclusive enclave" }, // Desert/Camelback Mountain
  { city: "Austin", region: "Southwest", photo: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=600&h=400&fit=crop", tagline: "SXSW parties and tech industry celebrations" }, // Austin Congress Ave bridge

  // Texas
  { city: "Dallas", region: "Texas", photo: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=600&h=400&fit=crop", tagline: "Highland Park galas and corporate affairs" }, // Dallas skyline
  { city: "Houston", region: "Texas", photo: "https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=600&h=400&fit=crop", tagline: "River Oaks estate parties and energy sector events" }, // Houston skyline
  { city: "Highland Park", region: "Texas", photo: "/areas/highland-park.jpg", tagline: "Dallas's premier neighborhood celebrations" },
  { city: "River Oaks", region: "Texas", photo: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop", tagline: "Houston's luxury district events" }, // Grand estate exterior

  // Southeast
  { city: "Miami", region: "Southeast", photo: "/areas/miami.jpg", tagline: "South Beach parties and Brickell penthouse events" },
  { city: "Nashville", region: "Southeast", photo: "/areas/nashville.jpg", tagline: "Music Row celebrations and bourbon bar receptions" },
  { city: "Atlanta", region: "Southeast", photo: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop", tagline: "Buckhead galas and Midtown corporate events" }, // Atlanta skyline
  { city: "Palm Beach", region: "Southeast", photo: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop", tagline: "The Breakers and Worth Avenue private affairs" }, // Palm-lined tropical
  { city: "Naples", region: "Southeast", photo: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=600&h=400&fit=crop", tagline: "Gulf Coast luxury community celebrations" }, // Naples FL pier sunset
  { city: "Coral Gables", region: "Southeast", photo: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop", tagline: "Biltmore elegance and coral rock estates" }, // Biltmore-style hotel
  { city: "Jupiter", region: "Southeast", photo: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop", tagline: "Exclusive Florida coastal celebrations" }, // Beach and ocean
  { city: "Sarasota", region: "Southeast", photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", tagline: "Ringling-era elegance and barrier island events" }, // White sand beach
  { city: "Buckhead", region: "Southeast", photo: "/areas/buckhead.jpg", tagline: "Atlanta's most prestigious neighborhood events" },
  { city: "Nantucket", region: "Northeast", photo: "/areas/nantucket.jpg", tagline: "Island getaway celebrations" },
  { city: "Martha's Vineyard", region: "Northeast", photo: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop", tagline: "Coastal New England estate parties" }, // New England meadow coast

  // Northeast
  { city: "New York", region: "Northeast", photo: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop", tagline: "Manhattan penthouses and Hamptons estates" }, // NYC Central Park skyline
  { city: "The Hamptons", region: "Northeast", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop", tagline: "East End summer celebrations and benefit galas" }, // Hamptons beach dunes
  { city: "Greenwich", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Gold Coast estate entertainment" }, // Grand estate
  { city: "Boston", region: "Northeast", photo: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=600&h=400&fit=crop", tagline: "Back Bay galas and Cambridge celebrations" }, // Boston Beacon Hill brownstones
  { city: "Washington DC", region: "Northeast", photo: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=400&fit=crop", tagline: "Embassy dinners and Georgetown receptions" }, // DC monuments/Capitol
  { city: "Philadelphia", region: "Northeast", photo: "https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=600&h=400&fit=crop", tagline: "Main Line estates and Center City galas" }, // Philly skyline
  { city: "Short Hills", region: "Northeast", photo: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&h=400&fit=crop", tagline: "New Jersey's luxury enclave celebrations" }, // Luxury suburban estate
  { city: "Potomac", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "DC-area estate events and charity galas" }, // Luxury estate

  // Midwest
  { city: "Chicago", region: "Midwest", photo: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop", tagline: "Gold Coast penthouses and Lake Shore galas" }, // Chicago skyline
  { city: "Winnetka", region: "Midwest", photo: "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=600&h=400&fit=crop", tagline: "North Shore estate celebrations" }, // Grand North Shore home
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
