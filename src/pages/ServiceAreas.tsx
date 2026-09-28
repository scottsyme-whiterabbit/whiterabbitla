import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import QuizCTA from "@/components/QuizCTA";
import threeStars from "@/assets/three-stars-gold.png";
import { serviceAreas, getAreasByRegion, serviceAreaRegions } from "@/data/serviceAreas";
import { cityHeroVideos } from "@/data/cityHeroVideos";
import SEOHead from "@/components/SEOHead";
import { useWebPageSchema } from "@/hooks/useSchemaOrg";
import ServicesFooterBlock from "@/components/ServicesFooterBlock";

const ServiceAreas = () => {
  const seoTitle = "Service Areas | White Rabbit Magic, Luxury Entertainment Nationwide";
  const seoDescription = "Close-up magic and private shows for luxury events across Southern California and select destinations, from Aspen to the Hamptons.";
  useWebPageSchema({
    name: "Service Areas",
    description: "Close-up magic and private shows across Southern California and select destinations.",
    path: "/areas",
    type: "CollectionPage",
  });

  const grouped = getAreasByRegion();
  const losAngelesHero = cityHeroVideos["los-angeles"];
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <main id="main-content" className="pt-20">
      <SEOHead title={seoTitle} description={seoDescription} canonical="/areas" />
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-forest-dark">
        {prefersReducedMotion ? (
          <img
            src={losAngelesHero.poster}
            alt=""
            width={1600}
            height={900}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            src={losAngelesHero.video}
            poster={losAngelesHero.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            width={1280}
            height={720}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = 0.85;
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-forest-dark/60 to-forest-dark/40" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              Los Angeles &amp; Select Destinations
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              Where We Perform
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              Based in Los Angeles. Performing across Southern California and in select destinations, from Aspen to the Hamptons.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Region sections */}
      {serviceAreaRegions.map((region) => {
        const areas = grouped[region];
        if (!areas || areas.length === 0) return null;
        return (
          <section key={region} className="py-16 border-b border-border">
            <div className="max-w-6xl mx-auto px-6">
              <AnimatedSection>
                <div className="flex justify-center mb-4">
                  <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={100} height={40} className="h-10 w-auto opacity-50" />
                </div>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
                  {region}
                </p>
                <h2 className="font-serif text-3xl text-foreground mb-8">
                  {areas.length} {areas.length === 1 ? "City" : "Cities"}
                </h2>
              </AnimatedSection>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {areas.map((area, i) => (
                  <AnimatedSection key={area.slug} delay={Math.min(i * 0.05, 0.25)}>
                    <Link
                      to={`/areas/${area.slug}`}
                      className="group block relative overflow-hidden aspect-[3/2] rounded-sm"
                    >
                      <img
                        src={area.photo}
                        alt={`${area.city}, ${area.region}, magician for luxury events`}
                        width={600}
                        height={400}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-serif text-lg text-cream leading-tight">
                          {area.city}
                        </h3>
                        <p className="font-sans text-xs text-cream/60 mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {area.tagline}
                        </p>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Quiz CTA */}
      <QuizCTA title="Not Sure Which Experience Fits Your Event?" />

      {/* Final CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-cream mb-4">
              Don't See Your City?
            </h2>
            <p className="font-sans text-sm text-cream/70 mb-8">
              White Rabbit travels for the right evening. Let's talk.
            </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Inquire
            </Link>
          </div>
        </section>
      </AnimatedSection>

      <ServicesFooterBlock variant="light" />
    </main>
  );
};

export default ServiceAreas;
