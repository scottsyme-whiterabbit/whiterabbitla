import { Link } from "react-router-dom";
import { MapPin, Phone, Calendar, Sparkles, Building2, HelpCircle, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import QuizNudge from "@/components/QuizNudge";
import FAQSection from "@/components/FAQSection";
import SEOHead from "@/components/SEOHead";
import { useJsonLd } from "@/hooks/useSchemaOrg";
import { getAreaBySlug } from "@/data/serviceAreas";
import { seoPages } from "@/data/seoPages";
import { blogArticles, getBlogArticleBySlug } from "@/data/blogArticles";
import { getArticleSlugsForCity } from "@/data/cityArticleLinks";
import type { CityContentData } from "@/data/cityContent";

const BASE_URL = "https://whiterabbitla.com";

const eventTypes = [
  { title: "Corporate Events & Team Building", desc: "Roaming close-up magic and parlor shows for holiday parties, client appreciation events, product launches, and team off-sites." },
  { title: "Weddings & Rehearsal Dinners", desc: "Ice-breaking cocktail hour magic, reception entertainment, and intimate rehearsal dinner shows that set the tone for the weekend." },
  { title: "Private Parties & Milestone Celebrations", desc: "Birthday parties, anniversary dinners, graduation celebrations, and intimate gatherings of 10 to 200 guests." },
  { title: "Fundraisers & Charity Galas", desc: "High-impact entertainment that energizes donors and creates memorable moments that drive generosity." },
  { title: "Holiday Parties", desc: "Thanksgiving, Christmas, New Year's Eve, and seasonal celebrations with magic that brings people together." },
  { title: "Restaurant & Venue Entertainment", desc: "Weekly or special-event entertainment for restaurants, hotels, and private clubs seeking a signature experience." },
];

interface CityPageProps {
  content: CityContentData;
  /** The area data from serviceAreas (for hero image, tagline) */
  areaPhoto: string;
  areaTagline: string;
}

// Per-city SEO meta overrides for pages ranking on Google
const cityMetaOverrides: Record<string, { title: string; description: string }> = {
  "beverly-hills": {
    title: "Beverly Hills Magician — Magic Castle Pro | White Rabbit LA",
    description: "Hire White Rabbit LA for luxury close-up magic in Beverly Hills. Magic Castle member, trusted by Netflix, Disney & Morgan Stanley. Book your event today.",
  },
  "pasadena": {
    title: "Pasadena Magician — Luxury Close-Up Magic | White Rabbit LA",
    description: "Hire a luxury magician for your Pasadena wedding, corporate event, or private party. Magic Castle member trusted by Disney, Netflix, and Morgan Stanley.",
  },
  "denver": {
    title: "Denver Magician — Magic Castle Pro for Luxury Events",
    description: "Book White Rabbit LA for close-up magic at your Denver wedding, corporate event, or private celebration. Magic Castle member, 5-star Google rated.",
  },
};

const CityPage = ({ content, areaPhoto, areaTagline }: CityPageProps) => {
  const { openQuiz } = useBookingQuiz();
  const { cityName, citySlug, state, stateFullName, region, venues, nearbyLinks, uniqueContent } = content;

  const metaOverride = cityMetaOverrides[citySlug];
  const seoTitle = metaOverride?.title || `${cityName} Magician for Hire | White Rabbit LA`;
  const seoDescription = metaOverride?.description || `Hire a world-class close-up magician for corporate events, weddings, and private parties in ${cityName}. Magic Castle member. 5-star rated on Google.`;

  // JSON-LD @graph with schemas
  useJsonLd(`city-schema-${citySlug}`, {
    "@graph": [
      {
        "@type": "Service",
        serviceType: "Magic Entertainment",
        provider: { "@type": "LocalBusiness", name: "White Rabbit LA", "@id": `${BASE_URL}/#business` },
        areaServed: { "@type": "City", name: cityName },
        description: `Close-up magic, parlor magic, and stage magic entertainment for private events in ${cityName}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Areas", item: `${BASE_URL}/areas` },
          { "@type": "ListItem", position: 3, name: cityName, item: `${BASE_URL}/areas/${citySlug}` },
        ],
      },
    ],
  });

  // Find SEO pages and blog articles matching this city
  const matchingPages = seoPages.filter((p) => p.location === cityName);
  const cityLower = cityName.toLowerCase();
  const matchingArticles = blogArticles.filter(
    (a) => a.title.toLowerCase().includes(cityLower) || a.excerpt.toLowerCase().includes(cityLower) || a.slug.includes(citySlug)
  );

  // Nearby city areas
  const nearbyAreas = nearbyLinks.map((slug) => getAreaBySlug(slug)).filter(Boolean);

  const faqs = buildFaqs(cityName, region);

  return (
    <main id="main-content" className="pt-20">
      <SEOHead title={seoTitle} description={seoDescription} canonical={`/areas/${citySlug}`} />
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <img
          src={areaPhoto.replace("w=600&h=400", "w=1600&h=900")}
          alt={`${cityName}, ${stateFullName} — luxury event entertainment destination`}
          width={1600}
          height={900}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-12 w-full">
            <AnimatedSection>
              <Link to="/areas" className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 inline-block hover:text-accent/80 transition-colors">
                ← All Service Areas
              </Link>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-3">
                Magician in {cityName} — Luxury Event Entertainment
              </h1>
              <p className="font-sans text-base text-cream/70 max-w-lg">{areaTagline}</p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <QuizNudge />

      {/* Opening paragraph — LLM-extractable */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8" data-speakable="true">
              White Rabbit LA provides luxury close-up magic and mentalism entertainment for private events in {cityName}, {stateFullName}. Performed by Scott Syme — a member of the Magic Castle in Hollywood and consultant to performers on America's Got Talent and Disney Channel — every show is tailored to your event, whether it's a corporate gala, wedding reception, private party, or fundraiser. 5-star rated on Google with clients including Netflix, Disney, Paramount, and Hyatt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={openQuiz} className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors">
                Book Now
              </button>
              <Link to="/contact" className="font-sans text-sm tracking-[0.2em] uppercase border border-border text-foreground px-10 py-4 hover:border-accent/40 transition-colors text-center">
                Inquire
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What Makes White Rabbit Different */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Why White Rabbit</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">What Makes White Rabbit Different</h2>
          </AnimatedSection>
          {uniqueContent.map((paragraph, i) => (
            <AnimatedSection key={i} delay={Math.min(i * 0.1, 0.3)}>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-6">{paragraph}</p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Types of Events */}
      <section className="py-16 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Event Types</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10">Types of Events in {cityName}</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((evt, i) => (
              <AnimatedSection key={evt.title} delay={Math.min(i * 0.05, 0.25)}>
                <div className="border border-border p-6 h-full bg-background">
                  <h3 className="font-serif text-lg text-foreground mb-2">{evt.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">{evt.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Venues */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-2">
              <Building2 size={18} className="text-accent" />
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent">Venues</p>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">Popular Venues in {cityName}</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue, i) => (
              <AnimatedSection key={venue} delay={Math.min(i * 0.08, 0.3)}>
                <div className="border border-border p-5 flex items-center gap-3">
                  <MapPin size={16} className="text-accent flex-shrink-0" />
                  <span className="font-sans text-sm text-foreground">{venue}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Service Pages */}
      {matchingPages.length > 0 && (
        <section className="py-16 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Services in {cityName}</p>
              <h2 className="font-serif text-3xl text-foreground mb-8">
                {matchingPages.length} Entertainment {matchingPages.length === 1 ? "Option" : "Options"}
              </h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingPages.map((page, i) => (
                <AnimatedSection key={page.slug} delay={Math.min(i * 0.05, 0.25)}>
                  <Link to={`/blog/${page.slug}`} className="group block border border-border p-6 hover:border-accent/40 transition-colors">
                    <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">{page.category}</p>
                    <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-accent transition-colors">{page.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground line-clamp-2">{page.metaDescription}</p>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Articles */}
      {matchingArticles.length > 0 && (
        <section className="py-16 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Related Articles</p>
              <h2 className="font-serif text-3xl text-foreground mb-8">Guides & Insights</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingArticles.map((article, i) => (
                <AnimatedSection key={article.slug} delay={Math.min(i * 0.1, 0.3)}>
                  <Link to={`/blog/${article.slug}`} className="group block border border-border p-6 hover:border-accent/40 transition-colors h-full">
                    <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">{article.category} · {article.readTime}</p>
                    <h3 className="font-serif text-xl text-foreground mb-3 group-hover:text-accent transition-colors">{article.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed line-clamp-3">{article.excerpt}</p>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Insights & Guides — city-specific editorial articles */}
      {(() => {
        const insightArticles = getArticleSlugsForCity(citySlug)
          .map((s) => getBlogArticleBySlug(s))
          .filter(Boolean);
        return insightArticles.length > 0 ? (
          <section className="py-16 border-t border-border">
            <div className="max-w-5xl mx-auto px-6">
              <AnimatedSection>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Insights &amp; Guides</p>
                <h2 className="font-serif text-3xl text-foreground mb-8">Recommended Reading</h2>
              </AnimatedSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insightArticles.map((article, i) => (
                  <AnimatedSection key={article!.slug} delay={Math.min(i * 0.1, 0.3)}>
                    <div className="border border-border p-6 h-full flex flex-col">
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">{article!.category}</p>
                      <h3 className="font-serif text-lg text-foreground mb-2 leading-snug">{article!.title}</h3>
                      <p className="font-sans text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{article!.excerpt}</p>
                      <Link to={`/blog/${article!.slug}`} className="mt-auto font-sans text-sm text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1">
                        Read <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      })()}

      {/* FAQ */}
      <FAQSection
        schemaId={`city-faq-${citySlug}`}
        subtitle="Common Questions"
        title={`Frequently Asked Questions — ${cityName}`}
        faqs={faqs}
      />

      {/* Book CTA */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Book a Magician in {cityName}</h2>
            <p className="font-sans text-base text-muted-foreground mb-2">
              Ready to make your {cityName} event unforgettable? Book now or call{" "}
              <a href="tel:+14243941850" className="text-accent hover:underline">(424) 394-1850</a>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/contact" className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors">
                Book Now
              </Link>
              <Link to="/quiz" className="font-sans text-sm tracking-[0.2em] uppercase border border-border text-foreground px-10 py-4 hover:border-accent/40 transition-colors">
                Take the Quiz
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* We Also Serve (nearby cities) */}
      {nearbyAreas.length > 0 && (
        <section className="py-16 border-t border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-6">
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Nearby</p>
              <h2 className="font-serif text-3xl text-foreground mb-8">We Also Serve</h2>
            </AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {nearbyAreas.map((area, i) => (
                <AnimatedSection key={area!.slug} delay={Math.min(i * 0.08, 0.3)}>
                  <Link to={`/areas/${area!.slug}`} className="group block relative overflow-hidden aspect-[3/2] rounded-sm">
                    <img src={area!.photo} alt={`${area!.city} — magician for luxury events`} width={600} height={400} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-serif text-sm text-cream leading-tight">{area!.city}</h3>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quiz CTA */}
      <QuizCTA title={`Planning an Event in ${cityName}?`} />

      {/* Final CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-cream mb-6">Book White Rabbit in {cityName}</h2>
            <Link to="/contact" className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors">
              Inquire Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

// ─── FAQ Helpers ───────────────────────────────────────────────────────────────

function buildFaqs(city: string, region: string) {
  return [
    {
      question: `How do I book a magician for an event in ${city}?`,
      answer: `Visit our contact page or call (424) 394-1850 to check availability. We'll discuss your event details, recommend the right format (close-up, parlor, or stage), and put together a custom package for your ${city} event.`,
    },
    {
      question: `What types of events can a magician perform at in ${city}?`,
      answer: `White Rabbit LA performs at corporate events, weddings, private parties, fundraisers, holiday parties, and restaurant/venue entertainment throughout ${city} and greater Los Angeles.`,
    },
    {
      question: `How far in advance should I book a magician in ${city}?`,
      answer: `We recommend booking 4-8 weeks in advance for events in ${city}, though last-minute availability is sometimes possible. Popular dates (holidays, wedding season) book 2-3 months out.`,
    },
    {
      question: `Does the magician travel to ${city}?`,
      answer: `Yes. White Rabbit LA serves all of ${city} and the greater ${region} area. There is no additional travel fee for events in the region.`,
    },
    {
      question: `What is close-up magic and is it right for my ${city} event?`,
      answer: `Close-up magic is performed inches from your guests using cards, coins, and everyday objects. It's perfect for cocktail hours, receptions, and networking events in ${city}. Guests interact directly with the magician, making it the most memorable form of live entertainment.`,
    },
  ];
}


export default CityPage;
