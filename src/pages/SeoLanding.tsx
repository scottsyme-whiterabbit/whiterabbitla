import { useParams, Link, Navigate } from "react-router-dom";
import NotFound from "./NotFound";
import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useServiceSchema } from "@/hooks/useSchemaOrg";
import { Star, CheckCircle, Clock } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { getSeoPageBySlug, getSeoPagesByCategory, getSeoPagesByLocation } from "@/data/seoPages";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import experienceImg from "@/assets/experience-closeup.jpg";
import parlorImg from "@/assets/event-parlor-show.jpg";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import paramountLogo from "@/assets/logos/paramount.png";
import rivianLogo from "@/assets/logos/rivian.png";
import agtLogo from "@/assets/logos/agt.png";
import youtubeLogo from "@/assets/logos/youtube.png";
import hyattLogo from "@/assets/logos/hyatt.png";
import lionsgateLogo from "@/assets/logos/lionsgate.png";

const trustLogos = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "America's Got Talent", logo: agtLogo },
  { name: "Paramount", logo: paramountLogo },
  { name: "YouTube", logo: youtubeLogo },
  { name: "Rivian", logo: rivianLogo },
  { name: "Hyatt", logo: hyattLogo },
  { name: "Lionsgate", logo: lionsgateLogo },
];

// Extended testimonials for city-specific rotation
const allTestimonials = [
  {
    quote: "Our guests didn't just enjoy the show. They came alive. Months later, they still talk about how Scott made them feel. That's not entertainment. That's something else entirely.",
    attribution: "Morgan Stanley, Private Client Event",
    region: "corporate",
  },
  {
    quote: "We've hired entertainers before. Scott is in a completely different category. He turned our cocktail hour into the highlight of the entire evening.",
    attribution: "Director of Events, Fortune 500 Company",
    region: "corporate",
  },
  {
    quote: "I've never seen a room full of executives laugh that hard. Every single person came up to me afterward asking where I found him.",
    attribution: "VP of Marketing, Tech Company",
    region: "corporate",
  },
  {
    quote: "Hiring Scott was the single best decision we made for our wedding. Our guests are STILL talking about him six months later.",
    attribution: "Private Client, Los Angeles",
    region: "wedding",
  },
  {
    quote: "He read my mind. Actually read it. I still don't know how. My guests were screaming with joy, and these are people who don't scream.",
    attribution: "Private Event Host, Beverly Hills",
    region: "private",
  },
  {
    quote: "Scott didn't just perform at our party. He made every single guest feel like the most important person in the room. That's a rare gift.",
    attribution: "Private Client, Malibu",
    region: "private",
  },
  {
    quote: "We flew Scott out for our annual client dinner. Best investment we made all year. Our clients are still emailing us about it.",
    attribution: "Managing Director, Private Equity Firm",
    region: "corporate",
  },
  {
    quote: "The moment Scott walked in, the energy shifted. By the end of the night, strangers were hugging. That's the White Rabbit effect.",
    attribution: "Event Planner, New York",
    region: "private",
  },
  {
    quote: "I've been to hundreds of events. This was the first time entertainment actually made me emotional. Truly extraordinary.",
    attribution: "Philanthropic Gala Host, Palm Beach",
    region: "private",
  },
  {
    quote: "Our holiday party went from 'nice' to 'legendary' the moment Scott started performing. Three months later, it's still the talk of the office.",
    attribution: "Chief People Officer, Tech Company",
    region: "corporate",
  },
];

function getCityTestimonial(slug: string, category: string) {
  // Match testimonial region to category
  const regionMap: Record<string, string> = {
    "Corporate Events": "corporate",
    "Weddings": "wedding",
    "Private Events": "private",
    "Close-Up Magic": "private",
    "Private Magic Shows": "private",
    "Golf Tournaments": "corporate",
    "Charity Galas": "corporate",
    "Holiday Parties": "corporate",
    "Trade Shows": "corporate",
    "Rehearsal Dinners": "wedding",
    "Halloween Events": "private",
    "Christmas & NYE": "corporate",
  };
  const targetRegion = regionMap[category] || "private";
  
  // Filter to matching region first
  const regionMatches = allTestimonials.filter(t => t.region === targetRegion);
  const pool = regionMatches.length > 0 ? regionMatches : allTestimonials;
  
  // Hash-based selection for consistency
  const hash = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[hash % pool.length];
}

// Dynamic urgency based on current month
function getUrgencyText(): string {
  const now = new Date();
  const month = now.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Peak seasons
  if (month >= 3 && month <= 5) return `Spring season is filling fast. Limited ${monthNames[month]} and ${monthNames[month + 1]} dates remaining.`;
  if (month >= 9 && month <= 11) return `Peak event season is here. ${monthNames[month]} dates are nearly full.`;
  if (month >= 6 && month <= 8) return `Summer events are booking now. Secure your ${monthNames[month]} date before it's gone.`;
  return `New year, new events. ${monthNames[month]} and ${monthNames[month + 1]} dates are now open for booking.`;
}

const SeoLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getSeoPageBySlug(slug) : undefined;
  const { openQuiz } = useBookingQuiz();

  const seoTitle = page?.metaTitle || "White Rabbit LA";
  const seoDescription = page?.metaDescription || "";
  const seoPath = slug ? `/blog/${slug}` : "/blog";

  useServiceSchema(page ? { title: page.title, metaDescription: page.metaDescription, slug: page.slug, intro: page.introParagraph } : { title: "", metaDescription: "", slug: "", intro: "" });

  // Inject FAQ structured data (JSON-LD)
  useEffect(() => {
    if (!page?.faqs?.length) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
    // Remove previous FAQ schema if exists
    document.getElementById("faq-schema")?.remove();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [page]);

  if (!page) {
    // De-risk redirect: pruned city×service SEO pages redirect to the canonical /services/{service}.
    const serviceSuffixMap: Record<string, string> = {
      "corporate-event-magician": "corporate-magician",
      "wedding-magician": "wedding-magician",
      "private-party-magician": "private-party-magician",
      "close-up-magician": "close-up-magician",
      "private-magic-show": "private-magic-show",
      "holiday-party-magician": "holiday-party-magician",
      "charity-gala-magician": "charity-gala-magician",
      "trade-show-magician": "trade-show-magician",
      "golf-tournament-magician": "golf-tournament-magician",
      "dmc-entertainment": "dmc-entertainment",
      "resident-event-magician": "resident-event-magician",
    };
    if (slug) {
      const match = Object.keys(serviceSuffixMap).find((suffix) => slug.endsWith(`-${suffix}`));
      if (match) return <Navigate to={`/services/${serviceSuffixMap[match]}`} replace />;
    }
    return <NotFound />;
  }

  const heroImage = page.category === "Parlor Shows" ? parlorImg : experienceImg;
  const testimonial = getCityTestimonial(page.slug, page.category);
  const urgencyText = getUrgencyText();

  const localMarkets = [
    "Los Angeles", "Beverly Hills", "Hollywood", "Santa Monica",
    "Malibu", "West Hollywood", "Bel Air", "Pasadena", "Calabasas",
  ];
  const isTravelMarket = !localMarkets.includes(page.location);

  const includedItems = isTravelMarket
    ? [
        "Pre-event consultation to tailor the performance to your audience and goals",
        "World-class close-up magic, mentalism, and audience interaction",
        "Professional appearance. Scott arrives in signature style, ready to elevate",
        "Travel coordination handled seamlessly. Scott travels from Los Angeles to serve clients in " + page.location,
        "A follow-up to make sure your event exceeded expectations",
      ]
    : [
        "Pre-event consultation to tailor the performance to your audience and goals",
        "World-class close-up magic, mentalism, and audience interaction",
        "Professional appearance. Scott arrives in signature style, ready to elevate",
        "Full production support for private shows (lighting, sound, staging)",
        "A follow-up to make sure your event exceeded expectations",
      ];

  // Thin/duplicate suffix patterns: keep page live but tell Google not to index.
  // Avoids "Discovered – not submitted" and "Duplicate without canonical" reports.
  // Thin city × service combos GSC flags as "Duplicate without canonical".
  // Kept live for direct/social traffic, but noindexed so Google stops
  // diluting the canonical /areas/[city] and /services/[service] pages.
  const noIndexSuffixes = [
    "rehearsal-dinner-magician",
    "halloween-party-magician",
    "christmas-party-magician",
    "premiere-red-carpet-magician",
    "red-carpet-magician",
    "dmc-entertainment",
    "resident-event-magician",
    "trade-show-magician",
    "holiday-party-magician",
    "charity-gala-magician",
    "golf-tournament-magician",
  ];
  const shouldNoIndex = noIndexSuffixes.some((s) => page.slug.endsWith(s));

  return (
    <main id="main-content" className="pt-20 pb-16 md:pb-0">
      <SEOHead title={seoTitle} description={seoDescription} canonical={seoPath} ogImage={experienceImg} noIndex={shouldNoIndex} />
      {/* Hero */}
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={page.heroHeadline}
            width={1200}
            height={630}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-forest-dark/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              {page.category} · {page.location}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              {page.heroHeadline}
            </h1>
            <p className="font-sans text-lg text-cream/80 max-w-2xl mx-auto mb-10">
              {page.heroSubheadline}
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

      {/* As Seen On / Trust Bar */}
      <section className="bg-forest-dark py-10 border-t border-cream/10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-6">
            As Seen On & Trusted By
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {trustLogos.map((client) => (
              <img
                key={client.name}
                src={client.logo}
                alt={client.name}
                width={70}
                height={28}
                loading="lazy"
                decoding="async"
                className="h-5 md:h-7 w-auto object-contain opacity-50 brightness-0 invert"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Author Byline */}
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-2 text-center">
        <p className="font-sans text-[11px] tracking-[0.25em] uppercase text-accent/70">
          By Scott Syme · Last Updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Intro + Body */}
      <section className="py-20 lg:py-28 pt-10">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-lg text-foreground leading-relaxed mb-10 font-medium">
              {page.introParagraph}
            </p>
          </AnimatedSection>

          {/* City-specific content replaces first 2 generic paragraphs when available */}
          {(page.citySpecificContent || page.bodyParagraphs.slice(0, 2)).map((paragraph, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {paragraph}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Mid-page CTA with Urgency */}
      <AnimatedSection>
        <section className="bg-secondary/30 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              {page.midCtaText}
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-4 max-w-xl mx-auto">
              Dates fill quickly, especially during peak event season. Tell us about your event and we'll usually confirm availability within a few hours.
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Clock size={14} className="text-accent" />
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-accent">
                {urgencyText}
              </p>
            </div>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Inquire Now, It's Free
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* Remaining body */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          {page.bodyParagraphs.slice(2).map((paragraph, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {paragraph}
              </p>
            </AnimatedSection>
          ))}

          {/* What You Get */}
          <AnimatedSection delay={0.2}>
            <div className="mt-8 p-8 border border-border">
              <h3 className="font-serif text-2xl text-foreground mb-6">What's Included</h3>
              <ul className="space-y-4">
                {includedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-accent mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              {isTravelMarket && (
                <p className="font-sans text-xs text-muted-foreground/70 mt-6 leading-relaxed italic">
                  White Rabbit is based in Los Angeles and travels nationwide for select engagements. Close-up magic, mentalism, and curated sound travel beautifully. Full theatrical staging (lighting rigs, curtains) is available for events in the greater Los Angeles area. For {page.location} events, Scott works with your venue's existing setup to deliver the same world-class experience.
                </p>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      {page.faqs.length > 0 && (
        <section className="py-20 border-t border-border">
          <div className="max-w-3xl mx-auto px-6">
            <AnimatedSection>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {page.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="font-sans text-sm md:text-base text-foreground text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* City-Specific Testimonial */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 leading-relaxed mb-6">
              "{testimonial.quote}"
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              {testimonial.attribution}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Related Links for Internal Linking */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-6">Explore More</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Link to dedicated service page */}
              <div>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">Deep Dive</p>
                <Link
                  to={`/services/${page.slug.replace(`${page.location.toLowerCase().replace(/\s+/g, "-")}-`, "")}`}
                  className="font-sans text-sm text-foreground hover:text-accent transition-colors underline underline-offset-4"
                >
                  Learn more about our {page.serviceType} services →
                </Link>
              </div>
              {/* Link to same service in other cities */}
              <div>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">Other Locations</p>
                <div className="flex flex-wrap gap-2">
                  {getSeoPagesByCategory(page.category)
                    .filter((p) => p.location !== page.location)
                    .slice(0, 5)
                    .map((p) => (
                      <Link
                        key={p.slug}
                        to={`/blog/${p.slug}`}
                        className="font-sans text-xs tracking-[0.15em] uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                      >
                        {p.location}
                      </Link>
                    ))}
                </div>
              </div>
              {/* Link to other services in same city */}
              <div className="md:col-span-2">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">More in {page.location}</p>
                <div className="flex flex-wrap gap-2">
                  {getSeoPagesByLocation(page.location)
                    .filter((p) => p.category !== page.category)
                    .map((p) => (
                      <Link
                        key={p.slug}
                        to={`/blog/${p.slug}`}
                        className="font-sans text-xs tracking-[0.15em] uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                      >
                        {p.serviceType}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA with Urgency */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Make Your Next Event Unforgettable
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-4">
              Tell us about your {page.location} event (date, guest count, and vibe) and we'll craft a custom experience your guests will never forget.
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock size={14} className="text-accent" />
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-accent">
                {urgencyText}
              </p>
            </div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">
              Most clients book 2–4 weeks in advance · No obligation to inquire
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Book White Rabbit Now
            </button>
            <p className="font-sans text-sm text-muted-foreground mt-8">
              Follow Scott on Instagram{" "}
              <a
                href="https://www.instagram.com/scottsyme_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 transition-colors underline underline-offset-4"
              >
                @scottsyme_
              </a>
              {" "}for behind-the-scenes magic and event highlights.
            </p>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default SeoLanding;
