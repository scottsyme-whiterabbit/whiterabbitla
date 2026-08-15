import { Link } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { useWebPageSchema, useSpeakableSchema } from "@/hooks/useSchemaOrg";
import heroDesertImg from "@/assets/experience-hero-desert.jpg";
import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-stage.jpg";
import corporateImg from "@/assets/event-penthouse-show.jpg";
import weddingImg from "@/assets/service-wedding-hero.jpg";
import privateImg from "@/assets/events/ladies-luncheon-laughter.jpg";
import holidayImg from "@/assets/service-holiday-party-action.jpg";
import charityImg from "@/assets/service-charity-gala-action.jpg";
import tradeShowImg from "@/assets/event-crowd-reaction.jpg";
import golfImg from "@/assets/event-guest-laughing.jpg";
import dmcImg from "@/assets/service-dmc-hero.jpg";
import residentImg from "@/assets/events/ladies-luncheon-room-wide.jpg";

const BASE_URL = "https://whiterabbitla.com";

interface ServiceTile {
  slug: string;
  title: string;
  blurb: string;
  image: string;
}

const services: ServiceTile[] = [
  {
    slug: "corporate-magician",
    title: "Corporate Event Magician",
    blurb:
      "Galas, product launches, and offsites. Trusted by Netflix, Disney, and Morgan Stanley in LA and 80+ Fortune 500 markets nationwide.",
    image: corporateImg,
  },
  {
    slug: "wedding-magician",
    title: "Wedding Magician",
    blurb:
      "Cocktail hour, reception, and rehearsal dinner entertainment for 5★ couples in LA, Aspen, the Hamptons, Napa, and 80+ luxury destinations.",
    image: weddingImg,
  },
  {
    slug: "private-party-magician",
    title: "Private Party Magician",
    blurb:
      "Milestone birthdays, anniversaries, and intimate celebrations. The performance hosts remember years later.",
    image: privateImg,
  },
  {
    slug: "close-up-magician",
    title: "Close-Up Magician",
    blurb:
      "Strolling, table-side close-up magic and mentalism. Cocktails, dinners, VIP receptions, and brand activations.",
    image: closeupImg,
  },
  {
    slug: "private-magic-show",
    title: "Private Magic Show",
    blurb:
      "A 45-minute curated theatrical experience for 20–120 guests. Full production with lighting, sound, and emerald drapes.",
    image: parlorImg,
  },
  {
    slug: "holiday-party-magician",
    title: "Holiday Party Magician",
    blurb:
      "The entertainment your team mentions in Monday's all-hands. Built for company holiday parties and end-of-year galas.",
    image: holidayImg,
  },
  {
    slug: "charity-gala-magician",
    title: "Charity Gala Magician",
    blurb:
      "Raises the room before the auction. Trusted by nonprofits in LA, Hollywood, Napa, the Hamptons, and 80+ luxury markets.",
    image: charityImg,
  },
  {
    slug: "trade-show-magician",
    title: "Trade Show Magician",
    blurb:
      "Lead-capture-ready routines with sales-team handoff built in. CES, Dreamforce, NRF, SXSW, HIMSS, and 80+ B2B conferences.",
    image: tradeShowImg,
  },
  {
    slug: "golf-tournament-magician",
    title: "Golf Tournament Magician",
    blurb:
      "Hospitality-tent and clubhouse magician. Fills the gap between rounds and the auction at charity and corporate tournaments.",
    image: golfImg,
  },
  {
    slug: "dmc-entertainment",
    title: "Magician for DMC Programs",
    blurb:
      "RFP-ready, insurance-loaded, performance consistent. The LA experience your incentive group remembers years later.",
    image: dmcImg,
  },
  {
    slug: "resident-event-magician",
    title: "Resident Event Magician",
    blurb:
      "Multi-event partnerships for HOAs, country clubs, and luxury residential communities across LA and nationwide.",
    image: residentImg,
  },
];

const ServicesHub = () => {
  const { openQuiz } = useBookingQuiz();

  const seoTitle = "Services | Magician for Corporate, Weddings, Galas & More | White Rabbit LA";
  const seoDescription =
    "All 11 White Rabbit LA magic services in one place. Corporate, weddings, galas, trade shows, golf tournaments, DMC programs, and more, across LA and 80+ US markets.";

  useWebPageSchema({
    name: "Services",
    description: seoDescription,
    path: "/services",
    type: "CollectionPage",
  });
  useSpeakableSchema({ name: "Services", path: "/services" });

  // ItemList JSON-LD listing all 11 service pages
  useEffect(() => {
    const id = "services-itemlist-schema";
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "White Rabbit LA Magic Services",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: services.length,
      itemListElement: services.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/services/${s.slug}`,
        name: s.title,
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <main id="main-content" className="pt-20">
      <SEOHead title={seoTitle} description={seoDescription} canonical="/services" ogImage={heroDesertImg} />

      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroDesertImg}
            alt="White Rabbit LA magic services across Los Angeles and nationwide"
            width={1200}
            height={630}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-forest-dark/85" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              The White Rabbit Catalog
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              All Services
            </h1>
            <p className="font-sans text-lg text-cream/80 max-w-2xl mx-auto mb-8">
              Eleven dedicated magic services for corporate events, weddings, galas, trade shows, tournaments, DMC
              programs, and residential communities, across Los Angeles and 80+ luxury markets nationwide.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Check Availability
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Service Tiles */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3 text-center">
              Eleven Ways to Book
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-12 text-center">
              Pick the experience that fits your event
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <AnimatedSection key={service.slug} delay={(i % 3) * 0.05}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group block border border-border hover:border-accent/60 transition-colors bg-card overflow-hidden h-full"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={service.image}
                      alt={`${service.title}, White Rabbit LA`}
                      width={600}
                      height={338}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-foreground mb-3 group-hover:text-accent transition-colors">
                      {service.title}
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-4">
                      {service.blurb}
                    </p>
                    <span className="font-sans text-xs tracking-[0.2em] uppercase text-accent">
                      Learn more →
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Internal-link block to anchor pages */}
      <section className="py-16 border-t border-border bg-secondary/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Keep Exploring</p>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
              See where White Rabbit performs and what hosts say
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/areas"
                className="font-sans text-sm tracking-[0.15em] uppercase border border-border px-5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Service Areas
              </Link>
              <Link
                to="/about"
                className="font-sans text-sm tracking-[0.15em] uppercase border border-border px-5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                About Scott Syme
              </Link>
              <Link
                to="/reviews"
                className="font-sans text-sm tracking-[0.15em] uppercase border border-border px-5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Client Reviews
              </Link>
              <Link
                to="/blog"
                className="font-sans text-sm tracking-[0.15em] uppercase border border-border px-5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Blog & Guides
              </Link>
              <Link
                to="/quiz"
                className="font-sans text-sm tracking-[0.15em] uppercase border border-border px-5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Find Your Fit
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Ready to talk about your event?
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-8">
              Tell us your date, guest count, and vibe, we'll usually confirm availability within a few hours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={openQuiz}
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
              >
                Book White Rabbit Now
              </button>
              <a
                href="tel:+14243941850"
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-10 py-4 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Call (424) 394-1850
              </a>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default ServicesHub;
