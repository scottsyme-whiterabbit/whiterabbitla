import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { getSeoPageBySlug } from "@/data/seoPages";
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

const trustLogos = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "Paramount", logo: paramountLogo },
  { name: "Rivian", logo: rivianLogo },
];

const SeoLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getSeoPageBySlug(slug) : undefined;
  const { openQuiz } = useBookingQuiz();

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", page.metaDescription);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = page.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [page]);

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
    return <Navigate to="/blog" replace />;
  }

  const heroImage = page.category === "Parlor Shows" ? parlorImg : experienceImg;

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
        "Travel coordination handled seamlessly. Scott regularly performs in " + page.location,
        "A follow-up to make sure your event exceeded expectations",
      ]
    : [
        "Pre-event consultation to tailor the performance to your audience and goals",
        "World-class close-up magic, mentalism, and audience interaction",
        "Professional appearance. Scott arrives in signature style, ready to elevate",
        "Full production support for private shows (lighting, sound, staging)",
        "A follow-up to make sure your event exceeded expectations",
      ];

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={page.heroHeadline}
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

      {/* Trust Bar */}
      <section className="bg-forest-dark py-8 border-t border-cream/10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-6">
            Trusted by World-Class Brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {trustLogos.map((client) => (
              <img
                key={client.name}
                src={client.logo}
                alt={client.name}
                className="h-6 md:h-8 w-auto object-contain opacity-50 brightness-0 invert"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Intro + Body */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-lg text-foreground leading-relaxed mb-10 font-medium">
              {page.introParagraph}
            </p>
          </AnimatedSection>

          {page.bodyParagraphs.slice(0, 2).map((paragraph, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {paragraph}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Mid-page CTA */}
      <AnimatedSection>
        <section className="bg-secondary/30 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              {page.midCtaText}
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Dates fill quickly, especially during peak event season. Tell us about your event and we'll confirm availability within 24 hours.
            </p>
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

      {/* Testimonial */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 leading-relaxed mb-6">
              "{page.socialProof}"
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              {page.socialProofAttribution}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Make Your Next Event Unforgettable
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-6">
              Tell us about your {page.location} event (date, guest count, and vibe) and we'll craft a custom experience your guests will never forget.
            </p>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">
              Most clients book 4–8 weeks in advance · No obligation to inquire
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Book White Rabbit Now
            </button>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default SeoLanding;
