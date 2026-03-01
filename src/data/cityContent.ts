// City-specific content for enhanced SEO city pages
// Reusable across all regions — SoCal, NorCal, Mountain, etc.

export interface CityContentData {
  cityName: string;
  citySlug: string;
  state: string;
  stateFullName: string;
  region: string;
  venues: string[];
  nearbyLinks: string[];
  /** Unique paragraphs for "What Makes White Rabbit Different" — must vary per city */
  uniqueContent: string[];
}

// ─── Southern California cities ───────────────────────────────────────────────

export const cityContentMap: Record<string, CityContentData> = {
  "los-angeles": {
    cityName: "Los Angeles",
    citySlug: "los-angeles",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Beverly Hilton", "SoFi Stadium", "Vibiana", "The Ebell of Los Angeles", "The Majestic Downtown"],
    nearbyLinks: ["beverly-hills", "hollywood", "west-hollywood", "santa-monica", "pasadena"],
    uniqueContent: [
      "As White Rabbit's home base, Los Angeles is where Scott Syme has built his reputation as the city's most sought-after private event magician. From rooftop cocktail parties in DTLA to Bel Air estate dinners overlooking the canyon, Scott brings a level of sophistication that matches the city's most discerning hosts. His membership at the Magic Castle in Hollywood — the world's most exclusive magic venue — is your assurance of world-class caliber.",
      "Los Angeles events demand entertainment that competes with the best the city has to offer. Scott's Fortune 500 client list — Netflix, Disney, Morgan Stanley, Rolls-Royce — speaks to a standard that corporate planners and private hosts trust implicitly. Whether it's a 20-person dinner in Silver Lake or a 300-person gala at Vibiana, every performance is tailored to the room, the crowd, and the moment.",
      "What separates White Rabbit from every other magician in Los Angeles is the hospitality-first approach. Scott doesn't just perform tricks — he reads the room, matches the energy, and creates an atmosphere that feels like the best part of your evening was designed just for you. Close-up magic during cocktails, a mentalism parlor show after dinner, or a full theatrical experience — LA's finest hosts choose White Rabbit because their guests deserve more than ordinary entertainment."
    ],
  },
  "beverly-hills": {
    cityName: "Beverly Hills",
    citySlug: "beverly-hills",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Waldorf Astoria Beverly Hills", "The Beverly Hills Hotel", "Greystone Mansion", "Cameo Beverly Hills", "The Maybourne"],
    nearbyLinks: ["bel-air", "west-hollywood", "hollywood", "brentwood", "santa-monica"],
    uniqueContent: [
      "Beverly Hills sets the global standard for luxury, and the entertainment at its private events must rise to that standard. Scott Syme has performed at the Waldorf Astoria, The Beverly Hills Hotel, and private estates along Linden and Lomitas — environments where guests expect nothing less than extraordinary. His Magic Castle membership and work with brands like Rolls-Royce and Taittinger make him a natural fit for the 90210.",
      "The intimate scale of many Beverly Hills gatherings — a dinner for 12 at Greystone Mansion, a cocktail reception at The Maybourne — is where close-up magic truly shines. Scott performs inches from your guests, transforming ordinary moments with cards, coins, and mentalism into experiences that feel almost impossible. This is the format that Fortune 500 executives, celebrities, and discerning hosts request again and again.",
    ],
  },
  "hollywood": {
    cityName: "Hollywood",
    citySlug: "hollywood",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Hollywood Roosevelt", "Dolby Theatre", "Yamashiro Hollywood", "The Fonda Theatre", "Sunset Tower Hotel"],
    nearbyLinks: ["west-hollywood", "los-feliz", "silver-lake", "beverly-hills", "studio-city"],
    uniqueContent: [
      "Hollywood is where entertainment was invented, and performing here demands a level of artistry that rivals what's on screen. Scott Syme has headlined at The Hollywood Roosevelt, performed at studio wrap parties, and entertained at red carpet premieres — experiences that have sharpened his ability to captivate even the most entertainment-saturated audiences. His consulting work with performers on America's Got Talent and Disney Channel is born from this world.",
      "From Sunset Tower Hotel to the rooftop at Yamashiro, Hollywood venues are designed for spectacle. Scott's parlor show format — an intimate 45-minute theatrical experience — transforms any private room into a stage that feels cinematic. For cocktail events, his roaming close-up magic creates organic moments of amazement that guests share on social media before the night is over.",
    ],
  },
  "santa-monica": {
    cityName: "Santa Monica",
    citySlug: "santa-monica",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Shutters on the Beach", "Hotel Casa del Mar", "The Annenberg Community Beach House", "Viceroy Santa Monica", "The Georgian"],
    nearbyLinks: ["pacific-palisades", "brentwood", "malibu", "west-hollywood", "manhattan-beach"],
    uniqueContent: [
      "Santa Monica's oceanfront setting creates a relaxed yet refined atmosphere that's perfect for immersive entertainment. Scott has performed at Shutters on the Beach, Hotel Casa del Mar, and private residences along San Vicente — events where the Pacific sunset meets world-class close-up magic. The combination of beachside ambiance and impossibly intimate mentalism creates evenings guests describe as 'the best party I've ever been to.'",
      "Corporate retreats and team-building events in Santa Monica benefit from Scott's ability to break the ice and connect people. His interactive style — where guests become part of the magic — transforms networking mixers and company off-sites into experiences that build genuine rapport. Whether it's a tech company reception at Viceroy or a nonprofit gala at The Georgian, White Rabbit delivers entertainment that matches the Westside's laid-back luxury.",
    ],
  },
  "malibu": {
    cityName: "Malibu",
    citySlug: "malibu",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Malibu Rocky Oaks", "Calamigos Ranch", "Nobu Malibu", "Malibu West Beach Club", "The Lodge at Malibu Lake"],
    nearbyLinks: ["pacific-palisades", "santa-monica", "calabasas", "westlake-village", "thousand-oaks"],
    uniqueContent: [
      "Malibu's clifftop estates and vineyard venues demand entertainment as breathtaking as the views. Scott Syme has performed at Malibu Rocky Oaks — where the Pacific stretches to the horizon — and at Calamigos Ranch, where redwood groves create an intimate canopy. In these settings, close-up magic becomes something almost spiritual: impossible moments shared between friends, family, and the California coastline.",
      "Destination weddings and milestone celebrations in Malibu are once-in-a-lifetime events. Scott approaches each one with the care it deserves — consulting with hosts on format, flow, and timing to ensure the magic enhances every phase of the evening. From cocktail hour strolling magic to a surprise mentalism reveal during toasts, White Rabbit transforms Malibu events into legends.",
    ],
  },
  "west-hollywood": {
    cityName: "West Hollywood",
    citySlug: "west-hollywood",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The West Hollywood EDITION", "Soho House West Hollywood", "1 Hotel West Hollywood", "Sunset Marquis", "The London West Hollywood"],
    nearbyLinks: ["hollywood", "beverly-hills", "los-angeles", "brentwood", "los-feliz"],
    uniqueContent: [
      "West Hollywood's Sunset Strip is synonymous with nightlife and celebrity culture — and Scott Syme is the entertainment that matches its energy. He's performed at Soho House, The EDITION, and private rooftop events along the Strip where the guest list reads like a who's who of entertainment and fashion. His Magic Castle credentials and experience with brands like Netflix and Paramount make him the natural choice for WeHo's most exclusive gatherings.",
      "The members-only clubs and boutique hotels of West Hollywood demand performers who understand discretion, sophistication, and timing. Scott's close-up magic is designed for these environments: intimate, interactive, and completely tailored to the room. Whether it's a product launch at 1 Hotel or an after-party at Sunset Marquis, White Rabbit brings the kind of entertainment that WeHo's tastemakers talk about.",
    ],
  },
  "bel-air": {
    cityName: "Bel Air",
    citySlug: "bel-air",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Hotel Bel-Air", "The Bel-Air Bay Club", "Bel-Air Country Club", "Stone Canyon Reservoir", "East Gate Bel Air"],
    nearbyLinks: ["beverly-hills", "brentwood", "pacific-palisades", "westwood", "santa-monica"],
    uniqueContent: [
      "Bel Air's ultra-private estates behind guarded gates represent the pinnacle of Los Angeles luxury. Scott Syme has performed at private homes throughout the neighborhood — intimate dinners for 8, garden parties for 60, and milestone celebrations for 150 — where discretion and excellence are non-negotiable. The hosts who call Bel Air home choose White Rabbit because they've seen the best entertainment in the world and recognize Scott's caliber.",
      "Hotel Bel-Air is one of the most romantic venues on Earth, and Scott's mentalism parlor show is the perfect complement to its timeless elegance. Imagine a private dining room overlooking Swan Lake, where guests experience mind-reading, impossible predictions, and moments of genuine wonder — all performed with the warmth and charm of a host who makes everyone feel like the guest of honor.",
    ],
  },
  "pasadena": {
    cityName: "Pasadena",
    citySlug: "pasadena",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Langham Huntington", "Pasadena City Hall", "The Rose Bowl", "Noor", "Caltech Athenaeum"],
    nearbyLinks: ["los-angeles", "burbank", "highland-park-ca", "encino", "downtown-la"],
    uniqueContent: [
      "Pasadena's historic architecture and garden estates provide a stunning backdrop for world-class entertainment. Scott Syme has performed at The Langham Huntington, Noor, and the Caltech Athenaeum — venues where old-world elegance meets modern celebration. His close-up magic and mentalism feel perfectly at home in Pasadena's refined atmosphere, where guests appreciate artistry, craft, and the kind of entertainment that rewards close attention.",
      "From Rose Bowl corporate hospitality events to intimate dinner parties in South Pasadena's Craftsman homes, Scott tailors every performance to the specific character of the venue and the occasion. Pasadena's mix of academia, old money, and creative industry creates audiences who are curious, engaged, and delighted by magic that challenges what they thought was possible.",
    ],
  },
  "calabasas": {
    cityName: "Calabasas",
    citySlug: "calabasas",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Calabasas Country Club", "Sagebrush Cantina", "Leonis Adobe Museum", "The Commons at Calabasas", "King Gillette Ranch"],
    nearbyLinks: ["malibu", "westlake-village", "thousand-oaks", "encino", "brentwood"],
    uniqueContent: [
      "Calabasas is home to some of Southern California's most recognized families and entertainers, and the private events here reflect that status. Scott Syme has performed at gated community celebrations, country club galas, and estate parties throughout the 91302 — where hosts expect entertainment that surprises even guests who've seen it all. His work with celebrity clients and Fortune 500 brands gives him the polish and presence these events demand.",
      "The Calabasas Country Club and King Gillette Ranch offer event spaces that range from manicured gardens to rustic canyon settings. Scott's versatile performance style adapts seamlessly — roaming close-up magic for outdoor cocktails, a seated parlor show for dinner entertainment, or a high-energy stage act for larger celebrations. White Rabbit brings the kind of entertainment that makes Calabasas hosts feel confident they chose the best.",
    ],
  },
  "orange-county": {
    cityName: "Orange County",
    citySlug: "orange-county",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Resort at Pelican Hill", "Montage Laguna Beach", "The Ritz-Carlton Laguna Niguel", "Segerstrom Center for the Arts", "Balboa Bay Resort"],
    nearbyLinks: ["newport-beach", "laguna-beach", "san-diego", "los-angeles", "long-beach"],
    uniqueContent: [
      "Orange County's coastal luxury and corporate culture create a unique demand for entertainment that's both polished and personal. Scott Syme has performed at The Resort at Pelican Hill, Montage Laguna Beach, and corporate events throughout Irvine and Costa Mesa — where Silicon Beach tech companies, Fortune 500 regional offices, and private wealth converge. His Magic Castle membership and client roster give planners the confidence that White Rabbit delivers at the highest level.",
      "From Balboa Island boat parties to black-tie galas at the Segerstrom Center, Orange County's event landscape is as diverse as it is demanding. Scott's ability to shift between casual cocktail hour magic and theatrical parlor shows makes him the ideal choice for OC planners who need versatility without sacrificing quality. White Rabbit is the entertainment that transforms good events into legendary ones.",
    ],
  },
  "san-diego": {
    cityName: "San Diego",
    citySlug: "san-diego",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Hotel del Coronado", "The Lodge at Torrey Pines", "Fairmont Grand Del Mar", "Pendry San Diego", "The Westgate Hotel"],
    nearbyLinks: ["coronado", "la-jolla", "newport-beach", "orange-county", "los-angeles"],
    uniqueContent: [
      "San Diego's convention industry, biotech corridor, and military community create a rich landscape for luxury event entertainment. Scott Syme has performed at Hotel del Coronado, Fairmont Grand Del Mar, and corporate retreats throughout the region — where planners need entertainment that works for audiences ranging from Navy admirals to tech CEOs. His interactive, approachable style makes him equally effective at a 20-person dinner and a 500-person gala.",
      "The Lodge at Torrey Pines and Pendry San Diego represent the new wave of San Diego luxury — design-forward, experience-driven, and curated for discerning guests. Scott's White Rabbit experience matches this philosophy perfectly: every detail is considered, from the moment he engages a guest to the impossible climax that leaves the room buzzing. San Diego planners choose White Rabbit because it elevates their events from beautiful to unforgettable.",
    ],
  },
  "newport-beach": {
    cityName: "Newport Beach",
    citySlug: "newport-beach",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Balboa Bay Resort", "The Resort at Pelican Hill", "Fashion Island", "Lido Marina Village", "Newport Beach Country Club"],
    nearbyLinks: ["laguna-beach", "orange-county", "long-beach", "san-diego", "los-angeles"],
    uniqueContent: [
      "Newport Beach's harbor-view estates and yacht club culture set the stage for entertainment that matches its coastal sophistication. Scott Syme has performed at Pelican Hill, Balboa Bay Resort, and private residences along the peninsula — where hosts understand that the right entertainment turns a gathering into an event. His close-up magic on yacht decks and poolside terraces creates the kind of intimate moments that Newport's social scene thrives on.",
      "Corporate holiday parties and client appreciation events are a Newport Beach specialty, and Scott brings the kind of polish that financial services firms, luxury brands, and tech companies expect. His mentalism act — where he reveals thoughts, predicts choices, and creates seemingly impossible coincidences — gives these events a talking point that extends well beyond the evening itself.",
    ],
  },
  "montecito": {
    cityName: "Montecito",
    citySlug: "montecito",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["San Ysidro Ranch", "Rosewood Miramar Beach", "Montecito Club", "Four Seasons Resort The Biltmore", "Lotusland"],
    nearbyLinks: ["santa-barbara", "malibu", "calabasas", "palm-springs", "los-angeles"],
    uniqueContent: [
      "Montecito is where Hollywood royalty, tech billionaires, and old California money retreat for privacy and beauty. Scott Syme has performed at San Ysidro Ranch and Rosewood Miramar Beach — venues where the guest list is often more impressive than the venue itself. In Montecito, entertainment must be effortless, tasteful, and extraordinary — exactly what White Rabbit delivers through intimate mentalism and close-up magic that feels like it was designed for each guest personally.",
      "The private estates of Montecito — hidden behind eucalyptus-lined lanes with ocean views — are where Scott's most exclusive performances take place. Dinner parties for 12, anniversary celebrations for 50, and charity benefits for 100 all receive the same level of care, preparation, and artistry. Montecito hosts know quality, and White Rabbit is the entertainment they trust to match their standards.",
    ],
  },
  "palm-springs": {
    cityName: "Palm Springs",
    citySlug: "palm-springs",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Parker Palm Springs", "La Quinta Resort & Club", "Ace Hotel & Swim Club", "The Riviera Palm Springs", "Alcazar Hotel"],
    nearbyLinks: ["los-angeles", "scottsdale", "malibu", "calabasas", "beverly-hills"],
    uniqueContent: [
      "Palm Springs' mid-century modern aesthetic and desert-resort culture create a singular backdrop for luxury entertainment. Scott Syme has performed at The Parker, La Quinta Resort, and private desert compound parties — where the retro-cool atmosphere demands entertainment that's stylish, surprising, and perfectly calibrated. His Magic Castle credentials and experience with brands like Rivian and YouTube resonate with Palm Springs' blend of Hollywood heritage and modern creative energy.",
      "Corporate incentive trips and destination weddings in Palm Springs thrive on the unexpected. Scott's mentalism — revealing a bride's secret memory, predicting a CEO's next move — transforms pool-side cocktail hours and candlelit dinners into moments that define the trip. In a city built on escape and reinvention, White Rabbit offers entertainment that feels like discovering something extraordinary.",
    ],
  },
  "coronado": {
    cityName: "Coronado",
    citySlug: "coronado",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Hotel del Coronado", "Coronado Island Marriott", "Glorietta Bay Inn", "Coronado Community Center", "Loews Coronado Bay Resort"],
    nearbyLinks: ["san-diego", "newport-beach", "laguna-beach", "orange-county", "los-angeles"],
    uniqueContent: [
      "Coronado Island's historic elegance — anchored by the legendary Hotel del Coronado — sets an impossibly high bar for event entertainment. Scott Syme's performances in the hotel's Crown Room and beachfront terraces match the grandeur of a venue that has hosted presidents, royalty, and Hollywood legends for over a century. His close-up magic and mentalism add a layer of wonder that complements Coronado's timeless sophistication.",
      "Military balls, charity galas, and corporate retreats are Coronado specialties, and Scott's versatile performance style adapts seamlessly to each. His ability to engage audiences ranging from Navy SEALs to Fortune 500 executives — with equal warmth and impact — makes him the ideal entertainment choice for an island community that values excellence, service, and unforgettable experiences.",
    ],
  },
  "santa-barbara": {
    cityName: "Santa Barbara",
    citySlug: "santa-barbara",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Four Seasons Resort The Biltmore", "Belmond El Encanto", "Santa Barbara Courthouse", "Bacara Resort", "Hilton Santa Barbara Beachfront Resort"],
    nearbyLinks: ["montecito", "malibu", "calabasas", "los-angeles", "palm-springs"],
    uniqueContent: [
      "Santa Barbara's American Riviera charm — red-tile roofs, vineyard-covered hills, and Pacific sunsets — demands entertainment with equal beauty and substance. Scott Syme has performed at Four Seasons The Biltmore, Belmond El Encanto, and vineyard estate weddings throughout the region. His intimate close-up magic and mentalism match the city's emphasis on craftsmanship, authenticity, and experiences that honor the setting.",
      "Wine country weddings and corporate retreats in Santa Barbara benefit from Scott's ability to create moments that feel organic to the environment. Rather than competing with the venue's natural beauty, his magic enhances it — a predicted wine vintage at a tasting dinner, a mind-reading demonstration under the courthouse's famous archways, or an impossible card revelation during golden hour on the beach.",
    ],
  },

  // ─── NEW SoCal cities ───────────────────────────────────────────────────────

  "pacific-palisades": {
    cityName: "Pacific Palisades",
    citySlug: "pacific-palisades",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Palisades Village", "Gladstones", "Temescal Gateway Park", "Getty Villa", "Will Rogers State Historic Park"],
    nearbyLinks: ["brentwood", "santa-monica", "malibu", "bel-air", "west-hollywood"],
    uniqueContent: [
      "Pacific Palisades embodies the quintessential California dream — ocean bluffs, canyon trails, and a village atmosphere that feels worlds away from the city. Scott Syme has performed at private homes perched above the Pacific, garden parties in Castellammare, and community celebrations at Palisades Village. The neighborhood's mix of entertainment industry executives, creative professionals, and multi-generational families creates audiences who are both discerning and wonderfully enthusiastic.",
      "The Getty Villa — a recreation of a Roman country house overlooking the Pacific — is one of the most extraordinary event venues in America, and Scott's performance style matches its ambition. Whether performing close-up magic amid ancient Roman gardens or mentalism in a private dining room with canyon views, White Rabbit brings entertainment that Pacific Palisades hosts describe as 'the best decision we made for the party.'",
    ],
  },
  "brentwood": {
    cityName: "Brentwood",
    citySlug: "brentwood",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Getty Center", "Brentwood Country Club", "Brentwood Country Mart", "San Vicente Mountain Park", "Archer School"],
    nearbyLinks: ["pacific-palisades", "bel-air", "santa-monica", "west-hollywood", "beverly-hills"],
    uniqueContent: [
      "Brentwood's tree-lined streets and celebrity residents create an environment where privacy and quality are paramount. Scott Syme has performed at estate dinners along San Vicente, holiday parties in Brentwood Park, and corporate events at The Getty Center — one of the world's great cultural institutions. His Magic Castle membership and client list give Brentwood hosts the confidence that their entertainment will match the caliber of everything else at their event.",
      "The neighborhood's proximity to the entertainment industry means Brentwood guests have seen world-class performers up close. Scott thrives in this environment — his close-up magic is designed to astonish people who think they've seen it all. Mentalism that reveals genuinely private thoughts, card magic performed inches from the audience, and interactive moments that make every guest feel personally included. This is why Brentwood hosts become repeat clients.",
    ],
  },
  "manhattan-beach": {
    cityName: "Manhattan Beach",
    citySlug: "manhattan-beach",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Shade Hotel", "The Strand House", "Manhattan Beach Country Club", "Metlox Plaza", "Marine Avenue"],
    nearbyLinks: ["santa-monica", "long-beach", "los-angeles", "pacific-palisades", "newport-beach"],
    uniqueContent: [
      "Manhattan Beach's affluent beach community — where tech executives and professional athletes live side by side — creates a social scene that values both sophistication and authenticity. Scott Syme has performed at Shade Hotel, private Strand homes, and corporate events for South Bay companies. His approachable, high-energy close-up magic fits Manhattan Beach's 'elevated casual' atmosphere perfectly — entertainment that impresses without taking itself too seriously.",
      "The Strand House and Manhattan Beach Country Club host some of the South Bay's most coveted private events, and Scott's versatility makes him ideal for both. Whether it's a barefoot cocktail party on the sand or a sit-down dinner overlooking the pier, White Rabbit adapts to the energy of the room while maintaining the world-class quality that Manhattan Beach hosts expect from every vendor on their list.",
    ],
  },
  "encino": {
    cityName: "Encino",
    citySlug: "encino",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Encino Golf Course", "Libbit Park", "The Valley Hunt Club", "Braemar Country Club", "Encino Velodrome"],
    nearbyLinks: ["studio-city", "calabasas", "westlake-village", "burbank", "brentwood"],
    uniqueContent: [
      "Encino's sprawling estates and family-oriented luxury make it one of the San Fernando Valley's premier neighborhoods for private celebrations. Scott Syme has performed at milestone birthday parties, anniversary celebrations, and holiday gatherings throughout Encino's most prestigious streets — where backyard parties rival ballroom events in scale and ambition. His interactive magic creates the kind of shared experience that brings families, neighbors, and colleagues together.",
      "Corporate events at Braemar Country Club and private dinners in Encino's hillside estates benefit from Scott's ability to read a room and match its energy. His mentalism act is particularly powerful in intimate settings — predicting a host's secret wish, revealing a guest's childhood memory, or creating an impossible coincidence that becomes the story of the evening. Encino hosts choose White Rabbit because it delivers the 'wow factor' their guests won't forget.",
    ],
  },
  "downtown-la": {
    cityName: "Downtown LA",
    citySlug: "downtown-la",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Biltmore Los Angeles", "City Hall Observation Deck", "The Majestic Downtown", "Vibiana", "The NoMad Hotel"],
    nearbyLinks: ["los-angeles", "hollywood", "silver-lake", "los-feliz", "pasadena"],
    uniqueContent: [
      "Downtown LA's renaissance has transformed the Arts District, Broadway corridor, and South Park into one of the most dynamic event landscapes in the country. Scott Syme has performed at Vibiana — the stunning converted cathedral — The Biltmore's Crystal Ballroom, and loft parties in the Arts District. DTLA's architectural drama and creative energy create the perfect stage for White Rabbit's theatrical approach to magic and mentalism.",
      "The corporate towers of Bunker Hill and the creative agencies of the Arts District represent two sides of DTLA's personality, and Scott is equally at home in both. His roaming close-up magic transforms corporate holiday parties and product launches into experiences that employees talk about for months. His parlor show — performed in the intimate private rooms of The NoMad or The Majestic — delivers the kind of curated, theatrical evening that DTLA's experience-driven culture craves.",
    ],
  },
  "laguna-beach": {
    cityName: "Laguna Beach",
    citySlug: "laguna-beach",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Montage Laguna Beach", "The Ranch at Laguna Beach", "Surf & Sand Resort", "Hotel Laguna", "Seven-Degrees"],
    nearbyLinks: ["newport-beach", "orange-county", "san-diego", "long-beach", "los-angeles"],
    uniqueContent: [
      "Laguna Beach's artist colony heritage and oceanfront luxury create a uniquely creative atmosphere for private events. Scott Syme has performed at Montage Laguna Beach — regularly ranked among America's finest hotels — and at private cliff-side residences where the Pacific provides a stunning backdrop. In a community that values artistry and craftsmanship, White Rabbit's attention to detail and creative ambition resonate deeply with Laguna hosts.",
      "Seven-Degrees and The Ranch at Laguna Beach represent the kind of design-forward, experience-driven venues that define modern Laguna. Scott's magic fits this aesthetic perfectly — intimate, beautifully crafted, and designed to create genuine emotional responses. Whether it's a gallery opening, a wedding rehearsal dinner overlooking the coast, or a corporate retreat for a creative agency, White Rabbit delivers entertainment that Laguna's art-minded community truly appreciates.",
    ],
  },
  "long-beach": {
    cityName: "Long Beach",
    citySlug: "long-beach",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Hotel Maya", "The Aquarium of the Pacific", "The Queen Mary", "Museum of Latin American Art", "The Grand Long Beach"],
    nearbyLinks: ["manhattan-beach", "newport-beach", "orange-county", "los-angeles", "santa-monica"],
    uniqueContent: [
      "Long Beach's waterfront convention district, historic Queen Mary, and emerging art scene create a diverse event landscape that ranges from 1,000-person galas to intimate gallery receptions. Scott Syme has performed at The Grand, Hotel Maya, and corporate conferences at the Long Beach Convention Center — where his ability to engage diverse audiences with interactive magic and mentalism makes him the entertainment choice that planners trust for high-stakes events.",
      "The Aquarium of the Pacific and The Queen Mary offer event experiences unlike anywhere else in Southern California, and Scott's theatrical performance style matches their uniqueness. Imagine close-up magic performed beside floor-to-ceiling ocean tanks, or a mentalism show in the Queen Mary's Art Deco salon. White Rabbit transforms Long Beach's one-of-a-kind venues into one-of-a-kind experiences.",
    ],
  },
  "burbank": {
    cityName: "Burbank",
    citySlug: "burbank",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Warner Bros. Studios", "Walt Disney Studios", "Castaway Restaurant", "The Burbank Town Center", "Nickelodeon Studios"],
    nearbyLinks: ["studio-city", "pasadena", "los-angeles", "hollywood", "encino"],
    uniqueContent: [
      "Burbank is the media capital of the world — home to Warner Bros., Disney, and Nickelodeon — and its corporate events reflect that creative DNA. Scott Syme has performed at studio lot parties, production wrap celebrations, and executive dinners at Castaway Restaurant overlooking the entire San Fernando Valley. His consulting work with Disney Channel performers and America's Got Talent gives him unique credibility with Burbank's entertainment industry audience.",
      "When your guests work in entertainment, your entertainment needs to be exceptional. Scott's Magic Castle membership, Fortune 500 client list, and theatrical performance style give Burbank hosts confidence that their entertainment will impress even the most production-savvy audience. From close-up magic at a soundstage cocktail hour to a full parlor show at a producer's home, White Rabbit delivers the caliber that the entertainment capital expects.",
    ],
  },
  "studio-city": {
    cityName: "Studio City",
    citySlug: "studio-city",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Sportsmen's Lodge", "CBS Studio Center", "Fryman Canyon", "Brady Bunch House", "Tujunga Village"],
    nearbyLinks: ["burbank", "encino", "hollywood", "los-feliz", "silver-lake"],
    uniqueContent: [
      "Studio City's charming Tujunga Village and canyon neighborhoods create an intimate, community-driven social scene. Scott Syme performs regularly in Studio City — including Magic Monday, his acclaimed weekly close-up magic show — and has become the neighborhood's go-to entertainment for private parties, restaurant events, and corporate celebrations. His presence in the community means Studio City hosts are booking a neighbor as much as a world-class performer.",
      "CBS Studio Center and Sportsmen's Lodge anchor Studio City's event scene, while private homes in the hills above Fryman Canyon host some of the Valley's most exclusive gatherings. Scott's deep connection to the neighborhood — combined with his Magic Castle membership and Fortune 500 client roster — makes White Rabbit the natural choice for Studio City events that demand both warmth and wow.",
    ],
  },
  "westlake-village": {
    cityName: "Westlake Village",
    citySlug: "westlake-village",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Four Seasons Hotel Westlake Village", "Westlake Village Inn", "The Landing Grill & Sushi Bar", "Westlake Golf Course", "The Promenade at Westlake"],
    nearbyLinks: ["thousand-oaks", "calabasas", "malibu", "encino", "studio-city"],
    uniqueContent: [
      "Westlake Village's lakeside luxury and Four Seasons sophistication create an event environment that rivals any in Los Angeles. Scott Syme has performed at the Four Seasons Hotel, Westlake Village Inn, and private estates surrounding the lake — where the combination of natural beauty and world-class hospitality demands entertainment of equal caliber. His Magic Castle membership and Fortune 500 client experience give Westlake hosts confidence in a premium choice.",
      "Corporate retreats and incentive events at the Four Seasons Westlake Village benefit from Scott's ability to transform downtime into engagement. His interactive close-up magic during cocktail receptions creates organic connections between colleagues, while his parlor show provides a shared 'wow' moment that teams reference long after they return to the office. In a community built around golf, wellness, and refined living, White Rabbit is the entertainment that fits.",
    ],
  },
  "thousand-oaks": {
    cityName: "Thousand Oaks",
    citySlug: "thousand-oaks",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Sherwood Country Club", "The Civic Arts Plaza", "The Oaks Mall", "Conejo Valley Botanic Garden", "Los Robles Greens"],
    nearbyLinks: ["westlake-village", "calabasas", "malibu", "encino", "studio-city"],
    uniqueContent: [
      "Thousand Oaks' combination of Sherwood Country Club prestige and family-community warmth creates events that range from exclusive galas to beloved neighborhood celebrations. Scott Syme has performed at Sherwood — one of the most prestigious country clubs in Southern California — and at private estate parties throughout the Conejo Valley. His close-up magic and mentalism bring a level of sophistication that elevates any Thousand Oaks event.",
      "The Civic Arts Plaza hosts major corporate and nonprofit events, while the Conejo Valley Botanic Garden offers an enchanting setting for weddings and private celebrations. Scott's versatility — from high-energy roaming magic to intimate seated shows — makes him ideal for the range of events that Thousand Oaks hosts plan. White Rabbit brings big-city caliber entertainment to the Conejo Valley without the big-city attitude.",
    ],
  },
  "rancho-palos-verdes": {
    cityName: "Rancho Palos Verdes",
    citySlug: "rancho-palos-verdes",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Terranea Resort", "Trump National Golf Club", "Point Vicente Lighthouse", "Wayfarers Chapel", "Palos Verdes Golf Club"],
    nearbyLinks: ["manhattan-beach", "long-beach", "los-angeles", "santa-monica", "newport-beach"],
    uniqueContent: [
      "Rancho Palos Verdes' dramatic ocean cliffs and world-class resort venues — led by Terranea Resort — create event settings of staggering natural beauty. Scott Syme has performed at Terranea's oceanfront terraces and private estates along Palos Verdes Drive, where the Pacific panorama stretches from Catalina to Malibu. His close-up magic amid these views creates an almost surreal combination of natural wonder and human impossibility.",
      "Wayfarers Chapel — Lloyd Wright's stunning glass church on the cliffs — and Terranea's award-winning event spaces attract destination weddings and corporate retreats from across the country. Scott's ability to tailor his performance to any setting — from a windswept terrace to an intimate resort dining room — makes White Rabbit the entertainment choice that completes the Palos Verdes experience.",
    ],
  },
  "silver-lake": {
    cityName: "Silver Lake",
    citySlug: "silver-lake",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["Hotel Lucile", "Botanica Restaurant", "Paramour Estate", "Carondelet House", "The Elysian"],
    nearbyLinks: ["los-feliz", "downtown-la", "hollywood", "echo-park", "pasadena"],
    uniqueContent: [
      "Silver Lake's creative community — musicians, filmmakers, designers, and tech founders — creates an audience that appreciates artistry and originality. Scott Syme has performed at Paramour Estate, Carondelet House, and private hillside homes overlooking the reservoir. In a neighborhood that prides itself on discovering the next great thing, White Rabbit's blend of intimate mentalism, interactive magic, and theatrical storytelling feels like an underground experience that only insiders know about.",
      "The boutique venues of Silver Lake — Hotel Lucile, Botanica, The Elysian — are designed for events that feel curated rather than corporate. Scott's performance style matches this philosophy: every interaction feels personal, every moment of magic feels like it was created specifically for the people in the room. Silver Lake hosts choose White Rabbit because it's the kind of entertainment that reflects their own creative standards.",
    ],
  },
  "los-feliz": {
    cityName: "Los Feliz",
    citySlug: "los-feliz",
    state: "CA",
    stateFullName: "California",
    region: "Southern California",
    venues: ["The Dresden Room", "The Greek Theatre", "Vintage Los Feliz Theatre", "Alcove Cafe & Bakery", "Figaro Bistrot"],
    nearbyLinks: ["silver-lake", "hollywood", "downtown-la", "pasadena", "studio-city"],
    uniqueContent: [
      "Los Feliz's old Hollywood charm — Spanish Colonial homes below Griffith Observatory, The Dresden Room's timeless cocktail culture — creates a neighborhood where entertainment should feel classic, surprising, and effortlessly cool. Scott Syme's close-up magic and mentalism fit this aesthetic perfectly: sophisticated enough for a black-tie dinner, intimate enough for a jazz-club-style gathering, and always performed with the kind of warmth that makes Los Feliz feel like a village.",
      "Private parties in the hills above Franklin Avenue and restaurant celebrations along Vermont and Hillhurst are Los Feliz specialties. Scott has performed at gatherings where the guest list includes Academy Award winners, indie filmmakers, and startup founders — audiences who are difficult to impress but wonderfully engaged when they encounter something genuinely extraordinary. White Rabbit is the entertainment that earns Los Feliz's approval.",
    ],
  },
};

/** Get city content data by slug. Returns undefined if not in the enhanced content map. */
export const getCityContent = (slug: string): CityContentData | undefined =>
  cityContentMap[slug];

/** Get all slugs that have enhanced city content */
export const getEnhancedCitySlugs = (): string[] => Object.keys(cityContentMap);
