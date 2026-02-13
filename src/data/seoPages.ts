export interface SeoPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  location: string;
  serviceType: string;
  heroHeadline: string;
  heroSubheadline: string;
  introParagraph: string;
  bodyParagraphs: string[];
  ctaText: string;
}

const locations = [
  "Los Angeles",
  "Beverly Hills",
  "Hollywood",
  "Santa Monica",
  "Malibu",
  "West Hollywood",
  "Bel Air",
  "Pasadena",
  "Orange County",
  "San Diego",
  "Las Vegas",
  "Calabasas",
] as const;

const serviceTypes = [
  {
    key: "corporate-event-magician",
    label: "Corporate Event Magician",
    category: "Corporate Events",
  },
  {
    key: "private-party-magician",
    label: "Private Party Magician",
    category: "Private Events",
  },
  {
    key: "wedding-magician",
    label: "Wedding Magician",
    category: "Weddings",
  },
  {
    key: "close-up-magician",
    label: "Close-Up Magician",
    category: "Close-Up Magic",
  },
  {
    key: "parlor-show",
    label: "Parlor Magic Show",
    category: "Parlor Shows",
  },
] as const;

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function generatePage(location: string, service: typeof serviceTypes[number]): SeoPage {
  const slug = `${slugify(location)}-${service.key}`;
  const locationAdj = location;

  const corporateIntros: Record<string, string> = {
    default: `Your ${locationAdj} corporate event deserves more than a DJ and a slide deck. White Rabbit brings world-class sleight of hand, mentalism, and impossible moments directly to your guests — transforming cocktail hours, galas, and executive retreats into evenings people talk about for years.`,
  };

  const corporateBody = [
    `Imagine the energy shifting the moment Scott Syme walks into the room. Within minutes, your CEO is laughing, your clients are leaning in, and strangers are bonding over something they can't explain. That's the White Rabbit effect — and it's why Fortune 500 companies, tech giants, and luxury brands trust us with their most important nights.`,
    `Every performance is tailored to your event's tone, audience, and objectives. Whether it's an intimate board dinner for twelve or a 500-person product launch, Scott reads the room like a conductor reads an orchestra — knowing exactly when to dazzle, when to disarm, and when to let the wonder speak for itself.`,
    `Close-up magic during cocktails creates organic conversation between guests who've never met. A parlor show after dinner transforms the room into an intimate theater. The result? An event that feels less like a corporate obligation and more like the best night out anyone's had in years.`,
    `Based in Los Angeles and available worldwide, White Rabbit has performed for Netflix, Disney, Morgan Stanley, Rolls Royce, Paramount, and dozens of private clients who demand nothing less than extraordinary. Your ${locationAdj} event is next.`,
  ];

  const privateIntros: Record<string, string> = {
    default: `The best parties aren't remembered for the venue or the catering — they're remembered for how they made people feel. White Rabbit brings that rare, electric feeling to private celebrations across ${locationAdj}, turning your home, restaurant, or rooftop into the most talked-about night of the year.`,
  };

  const privateBody = [
    `Scott Syme doesn't just perform magic — he hosts an experience. Picture your guests gathered close, drinks in hand, as impossible things happen inches from their fingertips. Cards appear in sealed envelopes. Thoughts are read before they're spoken. A borrowed ring vanishes and reappears inside a locked box that's been sitting in plain sight all evening.`,
    `Every detail is curated: the lighting shifts, a signature soundtrack sets the mood, and suddenly your living room feels like a private members' club in another era. This isn't background entertainment — it's the centerpiece of your evening, designed to make every guest feel like the most important person in the room.`,
    `Whether it's a milestone birthday, an anniversary celebration, a holiday gathering, or simply a Tuesday that deserves to be extraordinary — White Rabbit elevates the ordinary into the unforgettable. Available for intimate dinners of six or celebrations of up to 200 guests across ${locationAdj}.`,
    `Your guests will leave with something no gift bag can offer: the feeling of genuine wonder, the warmth of shared laughter, and a night they'll retell for years to come.`,
  ];

  const weddingIntros: Record<string, string> = {
    default: `Your wedding day is already magical — White Rabbit makes it impossible to forget. During cocktail hour, while your guests mingle and the champagne flows, Scott Syme moves through the crowd creating moments of pure, joyful astonishment that bring everyone together before they even find their seats.`,
  };

  const weddingBody = [
    `Forget the awkward small talk between the ceremony and reception. Close-up magic transforms cocktail hour into the highlight of the day — the moment when your college roommate and your partner's grandmother are suddenly bonding over something neither of them can explain. That's the magic of connection, and it's what White Rabbit does best.`,
    `Every performance is elegant, sophisticated, and perfectly calibrated for the tone of your celebration. No cheesy props. No interrupting toasts. Just beautiful, intimate moments of wonder that feel like they belong at a five-star hotel rather than a children's birthday party.`,
    `Scott has performed at weddings across ${locationAdj} — from clifftop ceremonies in Malibu to grand ballroom receptions downtown. Each performance is tailored to your guest count, timeline, and vision, ensuring the magic enhances your celebration without ever competing with it.`,
    `The reviews speak for themselves: couples consistently say that hiring White Rabbit was the single best decision they made for their wedding entertainment. Your guests won't just remember the vows — they'll remember the night they saw the impossible.`,
  ];

  const closeupIntros: Record<string, string> = {
    default: `Close-up magic is the most intimate form of wonder — and in ${locationAdj}, nobody does it like White Rabbit. Scott Syme brings world-class sleight of hand directly to your guests, performing inches away with nothing but a deck of cards, a few coins, and decades of obsessive practice.`,
  };

  const closeupBody = [
    `There's a reason close-up magic has captivated audiences for centuries. It's personal. It's immediate. It happens right there in your hands, and no amount of rewinding or replaying will reveal the secret. In a world of screens and spectacles, there's something profoundly thrilling about watching the impossible happen six inches from your face.`,
    `Scott's close-up work blends card magic, mentalism, and psychological illusion into seamless, conversational performances that feel less like a show and more like an encounter with something extraordinary. Guests don't just watch — they participate, react, and become part of the story.`,
    `Perfect for cocktail hours, dinner parties, VIP lounges, restaurant activations, hotel lobbies, and any event where you want guests mingling, laughing, and completely lost in the moment. Scott moves through the room naturally, reading the energy and creating bespoke moments for each group.`,
    `Available for events of any size across ${locationAdj}. Whether it's an exclusive dinner for eight or a roaming performance at a 300-person gala, White Rabbit's close-up magic creates the kind of shared experience that no playlist, photo booth, or open bar ever could.`,
  ];

  const parlorIntros: Record<string, string> = {
    default: `The White Rabbit Parlor Show is a curated 45-minute theatrical experience — part magic show, part one-man play, part collective hallucination. Performed for groups of 20 to 120 guests, it transforms any space in ${locationAdj} into an intimate theater where the impossible feels inevitable.`,
  };

  const parlorBody = [
    `Imagine emerald curtains, warm lighting, and a soundtrack that pulls you into another world before the first trick even begins. Then Scott Syme takes the stage — and for the next 45 minutes, reality gets a little unreliable. Cards defy physics. Minds are read with unsettling accuracy. Objects appear in places they have no business being.`,
    `But the real magic of the Parlor Show isn't the tricks — it's the feeling. It's the collective gasp, the shared laughter, the moment when an entire room of adults rediscovers what it feels like to be genuinely, delightfully astonished. It's the kind of experience you can't stream, can't screenshot, and can't quite explain to anyone who wasn't there.`,
    `The Parlor Show is perfect for corporate retreats, private dinner parties, fundraising galas, brand activations, and any event where you want to give your guests something truly extraordinary. Every show is tailored to your audience, your space, and your occasion.`,
    `White Rabbit provides full production support — professional lighting, sound design, and staging — turning your venue into a world-class performance space. Based in Los Angeles and available for events across ${locationAdj} and beyond.`,
  ];

  let intro: string;
  let body: string[];
  let heroHeadline: string;
  let heroSub: string;

  switch (service.key) {
    case "corporate-event-magician":
      intro = corporateIntros.default;
      body = corporateBody;
      heroHeadline = `${locationAdj} Corporate Event Magician`;
      heroSub = `Transform your next corporate event into the most talked-about night of the quarter.`;
      break;
    case "private-party-magician":
      intro = privateIntros.default;
      body = privateBody;
      heroHeadline = `Private Party Magician in ${locationAdj}`;
      heroSub = `Give your guests the rare gift of genuine wonder — an evening they'll never forget.`;
      break;
    case "wedding-magician":
      intro = weddingIntros.default;
      body = weddingBody;
      heroHeadline = `Wedding Magician in ${locationAdj}`;
      heroSub = `Turn cocktail hour into the highlight of your celebration.`;
      break;
    case "close-up-magician":
      intro = closeupIntros.default;
      body = closeupBody;
      heroHeadline = `Close-Up Magician in ${locationAdj}`;
      heroSub = `Intimate, impossible, unforgettable — magic that happens right in your hands.`;
      break;
    case "parlor-show":
      intro = parlorIntros.default;
      body = parlorBody;
      heroHeadline = `Parlor Magic Show in ${locationAdj}`;
      heroSub = `A curated theatrical experience for guests who deserve more than ordinary entertainment.`;
      break;
    default:
      intro = "";
      body = [];
      heroHeadline = "";
      heroSub = "";
  }

  return {
    slug,
    title: `${service.label} in ${locationAdj}`,
    metaTitle: `${service.label} in ${locationAdj} | White Rabbit Magic`,
    metaDescription: `Hire the best ${service.label.toLowerCase()} in ${locationAdj}. White Rabbit delivers luxury magic entertainment for corporate events, private parties, and special occasions. Book now.`,
    category: service.category,
    location: locationAdj,
    serviceType: service.label,
    heroHeadline,
    heroSubheadline: heroSub,
    introParagraph: intro,
    bodyParagraphs: body,
    ctaText: `Book White Rabbit for Your ${locationAdj} Event`,
  };
}

export const seoPages: SeoPage[] = locations.flatMap((location) =>
  serviceTypes.map((service) => generatePage(location, service))
);

export function getSeoPageBySlug(slug: string): SeoPage | undefined {
  return seoPages.find((page) => page.slug === slug);
}

export function getSeoPagesByCategory(category: string): SeoPage[] {
  return seoPages.filter((page) => page.category === category);
}

export function getSeoPagesByLocation(location: string): SeoPage[] {
  return seoPages.filter((page) => page.location === location);
}

export const seoCategories = serviceTypes.map((s) => s.category);
export const seoLocations = [...locations];
