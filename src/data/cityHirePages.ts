// Optional per-city overrides for a dedicated "hire a magician in {city}" page.
// A city entry in cityContent.ts only renders differently when it sets `hirePage`;
// every other area page keeps the default CityPage template output.

export interface CityHireCard {
  title: string;
  body: string;
  href: string;
  linkLabel?: string;
}

export interface CityHireTestimonial {
  quote: string;
  attribution: string;
}

export interface CityHirePage {
  metaDescription: string;
  h1: string;
  heroImageAlt: string;
  intro: string;
  introPrimaryLabel: string;
  formats: { eyebrow: string; heading: string; cards: CityHireCard[] };
  occasions: { eyebrow: string; heading: string; cards: CityHireCard[] };
  testimonials: { eyebrow: string; heading: string; items: CityHireTestimonial[]; linkLabel: string; linkHref: string };
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  closingSentence: string;
  closingPrimaryLabel: string;
  nearbyAltSuffix: string;
}

export const losAngelesHirePage: CityHirePage = {
  metaDescription:
    "Hire a Los Angeles magician for a corporate evening, wedding or private party. Close-up magic in the cocktail hour or a parlor show, from a Magic Castle member.",
  h1: "Hire a Magician in Los Angeles",
  heroImageAlt: "Scott Syme, Los Angeles magician, performing close-up magic for guests",
  intro:
    "White Rabbit LA is Scott Syme, a Los Angeles magician and member of the Magic Castle in Hollywood. Hosts across the city invite him for two things: close-up magic that moves through the cocktail hour, and a parlor show of about 40 minutes for a seated room. Many evenings include both. He has been part of gatherings for Netflix, Disney, Paramount and Hyatt, and is rated 5.0 on Google across 50 reviews.",
  introPrimaryLabel: "Check a Date",
  formats: {
    eyebrow: "Two Formats",
    heading: "Two ways to host magic in Los Angeles",
    cards: [
      {
        title: "Close-up magic for the cocktail hour",
        body: "Scott moves through the room in small groups while drinks are poured. Cards, borrowed objects and mind reading happen in your guests' hands, and a room of strangers starts talking to each other. It belongs before dinner, or between courses once plates are cleared.",
        href: "/services/close-up-magician",
        linkLabel: "See close-up magic",
      },
      {
        title: "The private parlor show",
        body: "A seated show of about 40 minutes for the whole room, built around the guests in it. Scott arrives early, sets the space, and greets every guest before the first word of the show.",
        href: "/services/private-magic-show",
        linkLabel: "See the private magic show",
      },
    ],
  },
  occasions: {
    eyebrow: "Occasions",
    heading: "Who invites White Rabbit in Los Angeles",
    cards: [
      { title: "Corporate evenings", href: "/services/corporate-magician", body: "Client dinners, launches and team celebrations. Shared moments your guests talk about long after the evening ends." },
      { title: "Weddings", href: "/services/wedding-magician", body: "The cocktail hour and the rehearsal dinner. For your guests it feels like being let in on something." },
      { title: "Private parties", href: "/services/private-party-magician", body: "Birthdays, anniversaries and dinners at home, from ten guests to two hundred." },
      { title: "Holiday parties", href: "/services/holiday-party-magician", body: "Company and family celebrations in December, when weekend dates are the first to go." },
      { title: "Charity galas", href: "/services/charity-gala-magician", body: "The reception before the program, when donors are arriving and the room needs warmth." },
      { title: "Something else", href: "/services", body: "Trade shows, golf tournaments, DMC programs and resident events are all part of the work. See every experience." },
    ],
  },
  testimonials: {
    eyebrow: "From Hosts",
    heading: "What Los Angeles hosts say",
    // Exact quotes and names from the existing reviews (src/pages/Reviews.tsx).
    items: [
      {
        quote: "My company hosted a holiday dinner last Friday, and we had the pleasure of experiencing Scott's magic show. He is incredible and had the whole room captivated.",
        attribution: "Grace G., Corporate Holiday Dinner",
      },
      {
        quote: "Scott put on an amazing show at our Holiday Christmas Party, all the guests loved him and were blown away from his tricks and magic! 2nd year in a row hiring him and he knocks it out of the park both times!",
        attribution: "Taylor R., Corporate Holiday Party",
      },
    ],
    linkLabel: "Read every review",
    linkHref: "/reviews",
  },
  faqTitle: "Hiring a magician in Los Angeles",
  faqs: [
    {
      question: "How do I hire a magician in Los Angeles?",
      answer: "Share your date, venue and guest count through the inquiry form, or call (424) 394-1850. Scott replies personally and suggests a short call to shape the evening. Your proposal arrives with a seven day hold on the date.",
    },
    {
      question: "How much does it cost to hire a magician in Los Angeles?",
      answer: "Each evening is quoted individually after a short call, because a cocktail hour for forty guests and a seated show for two hundred are different evenings. Travel within greater Los Angeles is included.",
    },
    {
      question: "What is the difference between close-up magic and a parlor show?",
      answer: "Close-up magic happens in small groups as Scott moves through the room, usually during the cocktail hour. The parlor show is a seated performance of about 40 minutes for everyone at once. Many hosts choose both.",
    },
    {
      question: "Does Scott perform during dinner?",
      answer: "Not while guests are eating. Close-up magic belongs in the cocktail hour, before or after the meal, or between courses once plates are cleared.",
    },
    {
      question: "How far ahead should I book a Los Angeles magician?",
      answer: "Four to eight weeks is comfortable for most dates. December weekends and wedding season are often spoken for two to three months ahead, so it is worth asking early.",
    },
    {
      question: "Which parts of Los Angeles do you cover?",
      answer: "All of greater Los Angeles, including Beverly Hills, Hollywood, West Hollywood, Santa Monica, Malibu and Pasadena, with no travel fee inside the region.",
    },
    {
      question: "Will the magic suit a corporate audience?",
      answer: "Yes. The material is clean for every audience and is shaped around your company, your guests and the reason for the evening.",
    },
  ],
  closingSentence: "Tell us the date and the room, and Scott will take it from there. Or call",
  closingPrimaryLabel: "Check a Date",
  nearbyAltSuffix: "magician for private events",
};
