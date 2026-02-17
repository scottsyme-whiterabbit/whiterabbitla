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
  { city: "Beverly Hills", region: "Southern California", photo: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop", tagline: "Rodeo Drive galas and private estate soirées" }, // Beverly Hills palm-lined street
  { city: "Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1506184106046-1e6e90c0222d?w=600&h=400&fit=crop", tagline: "Studio events, wrap parties and red carpet nights" }, // Hollywood Sign on hillside
  { city: "Santa Monica", region: "Southern California", photo: "https://images.unsplash.com/photo-1514321648849-f4e1d5da98dc?w=600&h=400&fit=crop", tagline: "Oceanfront receptions and beachside celebrations" }, // Santa Monica Pier ferris wheel
  { city: "Malibu", region: "Southern California", photo: "https://images.unsplash.com/photo-1608651491346-203b49350557?w=600&h=400&fit=crop", tagline: "Cliffside mansions and PCH-view events" }, // Malibu ocean cliff view
  { city: "West Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&h=400&fit=crop", tagline: "Sunset Strip venues and members-only clubs" }, // LA nightlife palms
  { city: "Bel Air", region: "Southern California", photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop", tagline: "Ultra-private estate entertainment" }, // Luxury modern estate pool
  { city: "Pasadena", region: "Southern California", photo: "https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=600&h=400&fit=crop", tagline: "Historic venues and garden celebrations" }, // Hollywood/Pasadena area hills
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
  { city: "San Mateo", region: "Northern California", photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop", tagline: "Silicon Valley corporate celebrations" }, // Modern glass towers
  { city: "Burlingame", region: "Northern California", photo: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop", tagline: "Bayside corporate events" }, // Charming home/street
  { city: "Atherton", region: "Northern California", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "America's most exclusive zip code celebrations" }, // Grand luxury home
  { city: "Palo Alto", region: "Northern California", photo: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=600&h=400&fit=crop", tagline: "Venture capital dinners and tech founder parties" }, // Stanford/campus
  { city: "Woodside", region: "Northern California", photo: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop", tagline: "Redwood estate gatherings" }, // Redwood forest path
  { city: "Los Altos", region: "Northern California", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Silicon Valley private parties" }, // Luxury home exterior
  { city: "Menlo Park", region: "Northern California", photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", tagline: "Tech campus events and founder dinners" }, // Modern office space
  { city: "Saratoga", region: "Northern California", photo: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop", tagline: "Foothill estate celebrations" }, // Vineyard rows
  { city: "Los Gatos", region: "Northern California", photo: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop", tagline: "Wine country adjacent luxury events" }, // Charming home
  { city: "Tiburon", region: "Northern California", photo: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop", tagline: "Waterfront Marin County affairs" }, // Coastal waterfront
  { city: "Mill Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop", tagline: "Redwood-shaded private events" }, // Redwood forest
  { city: "Sonoma", region: "Northern California", photo: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop", tagline: "Wine country retreats and harvest dinners" }, // Wine grapes/vineyard
  { city: "Carmel-by-the-Sea", region: "Northern California", photo: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop", tagline: "Coastal luxury weddings and intimate gatherings" }, // Rocky coastline

  // West Coast
  { city: "Seattle", region: "West Coast", photo: "https://images.unsplash.com/photo-1502175353174-a7a70e73b4c3?w=600&h=400&fit=crop", tagline: "Pacific Northwest corporate galas" }, // Seattle Space Needle skyline
  { city: "Portland", region: "West Coast", photo: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop", tagline: "Creative industry celebrations" }, // Portland/bridge

  // Mountain & Resort
  { city: "Las Vegas", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&h=400&fit=crop", tagline: "Casino nights, conventions and VIP suites" }, // Vegas Strip lights
  { city: "Aspen", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1548587665-54e41d2e7e13?w=600&h=400&fit=crop", tagline: "Ski lodge celebrations and mountain retreats" }, // Snowy mountains
  { city: "Vail", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1609139003551-ee40f5f74a12?w=600&h=400&fit=crop", tagline: "Alpine luxury and aprés-ski entertainment" }, // Snowy village
  { city: "Park City", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop", tagline: "Sundance season parties and mountain estates" }, // Mountain resort
  { city: "Jackson Hole", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=400&fit=crop", tagline: "Grand Teton backdrop private events" }, // Deer/mountain nature
  { city: "Sun Valley", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&h=400&fit=crop", tagline: "Idaho's billionaire playground celebrations" }, // Mountain valley
  { city: "Lake Tahoe", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=600&h=400&fit=crop", tagline: "Lakeside lodges and mountain-view galas" }, // Lake Tahoe blue water
  { city: "Telluride", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=400&fit=crop", tagline: "Remote luxury in the Colorado Rockies" }, // Dramatic mountain peaks
  { city: "Denver", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=600&h=400&fit=crop", tagline: "Mile-high corporate events and galas" }, // Denver skyline mountains

  // Southwest
  { city: "Scottsdale", region: "Southwest", photo: "https://images.unsplash.com/photo-1558645836-e44122a743ee?w=600&h=400&fit=crop", tagline: "Desert resort incentive trips and golf outings" }, // Desert resort
  { city: "Paradise Valley", region: "Southwest", photo: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&h=400&fit=crop", tagline: "Arizona's most exclusive enclave" }, // Desert/Camelback Mountain
  { city: "Austin", region: "Southwest", photo: "https://images.unsplash.com/photo-1588993608830-fae41e74e8c1?w=600&h=400&fit=crop", tagline: "SXSW parties and tech industry celebrations" }, // Austin skyline

  // Texas
  { city: "Dallas", region: "Texas", photo: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=600&h=400&fit=crop", tagline: "Highland Park galas and corporate affairs" }, // Dallas skyline
  { city: "Houston", region: "Texas", photo: "https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=600&h=400&fit=crop", tagline: "River Oaks estate parties and energy sector events" }, // Houston skyline
  { city: "Highland Park", region: "Texas", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Dallas's premier neighborhood celebrations" }, // Luxury estate
  { city: "River Oaks", region: "Texas", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "Houston's luxury district events" }, // Grand estate interior

  // Southeast
  { city: "Miami", region: "Southeast", photo: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=600&h=400&fit=crop", tagline: "South Beach parties and Brickell penthouse events" }, // Miami Beach
  { city: "Nashville", region: "Southeast", photo: "https://images.unsplash.com/photo-1545419913-775d54a0b4e4?w=600&h=400&fit=crop", tagline: "Music Row celebrations and bourbon bar receptions" }, // Nashville Broadway
  { city: "Atlanta", region: "Southeast", photo: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop", tagline: "Buckhead galas and Midtown corporate events" }, // Atlanta skyline
  { city: "Palm Beach", region: "Southeast", photo: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop", tagline: "The Breakers and Worth Avenue private affairs" }, // Palm-lined tropical
  { city: "Naples", region: "Southeast", photo: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop", tagline: "Gulf Coast luxury community celebrations" }, // Beach sunset
  { city: "Coral Gables", region: "Southeast", photo: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop", tagline: "Biltmore elegance and coral rock estates" }, // Biltmore-style hotel
  { city: "Jupiter", region: "Southeast", photo: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop", tagline: "Exclusive Florida coastal celebrations" }, // Beach and ocean
  { city: "Sarasota", region: "Southeast", photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", tagline: "Ringling-era elegance and barrier island events" }, // White sand beach
  { city: "Buckhead", region: "Southeast", photo: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop", tagline: "Atlanta's most prestigious neighborhood events" }, // Atlanta skyline
  { city: "Nantucket", region: "Northeast", photo: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&h=400&fit=crop", tagline: "Island getaway celebrations" }, // New England coastal
  { city: "Martha's Vineyard", region: "Northeast", photo: "https://images.unsplash.com/photo-1561466937-d2741f9b9011?w=600&h=400&fit=crop", tagline: "Coastal New England estate parties" }, // Coastal lighthouse

  // Northeast
  { city: "New York", region: "Northeast", photo: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop", tagline: "Manhattan penthouses and Hamptons estates" }, // NYC Central Park skyline
  { city: "The Hamptons", region: "Northeast", photo: "https://images.unsplash.com/photo-1499793983394-12dec4e73116?w=600&h=400&fit=crop", tagline: "East End summer celebrations and benefit galas" }, // Beach scene
  { city: "Greenwich", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Gold Coast estate entertainment" }, // Grand estate
  { city: "Boston", region: "Northeast", photo: "https://images.unsplash.com/photo-1573226541948-89e5e2b86e97?w=600&h=400&fit=crop", tagline: "Back Bay galas and Cambridge celebrations" }, // Boston waterfront
  { city: "Washington DC", region: "Northeast", photo: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=400&fit=crop", tagline: "Embassy dinners and Georgetown receptions" }, // DC monuments/Capitol
  { city: "Philadelphia", region: "Northeast", photo: "https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=600&h=400&fit=crop", tagline: "Main Line estates and Center City galas" }, // Philly skyline
  { city: "Short Hills", region: "Northeast", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "New Jersey's luxury enclave celebrations" }, // Grand interior
  { city: "Potomac", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "DC-area estate events and charity galas" }, // Luxury estate

  // Midwest
  { city: "Chicago", region: "Midwest", photo: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop", tagline: "Gold Coast penthouses and Lake Shore galas" }, // Chicago skyline
  { city: "Winnetka", region: "Midwest", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "North Shore estate celebrations" }, // Estate home
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
