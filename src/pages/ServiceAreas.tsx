import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import QuizCTA from "@/components/QuizCTA";
import threeStars from "@/assets/three-stars-gold.png";
import { serviceAreas, getAreasByRegion, serviceAreaRegions } from "@/data/serviceAreas";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useWebPageSchema } from "@/hooks/useSchemaOrg";

const ServiceAreas = () => {
  usePageMeta({
    title: "Service Areas | White Rabbit Magic — Luxury Entertainment Nationwide",
    description:
      "White Rabbit brings world-class close-up magic and parlor shows to luxury events across 70+ cities — from Los Angeles to New York, Aspen to Miami.",
    path: "/areas",
  });
  useWebPageSchema({
    name: "Service Areas",
    description: "Luxury magic entertainment in 70+ cities nationwide.",
    path: "/areas",
    type: "CollectionPage",
  });

  const grouped = getAreasByRegion();

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              Nationwide
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              Where We Perform
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              Based in Los Angeles, Scott Syme brings White Rabbit's immersive magic experiences to luxury events in over 70 cities across the country.
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
                  <img src={threeStars} alt="" aria-hidden="true" className="h-10 w-auto opacity-50" />
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
                        alt={`${area.city}, ${area.region} — magician for luxury events`}
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
              White Rabbit travels worldwide for the right event. Let's talk.
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
    </main>
  );
};

export default ServiceAreas;
