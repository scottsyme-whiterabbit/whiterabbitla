import { useParams, Link, Navigate } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import { getAreaBySlug } from "@/data/serviceAreas";
import { seoPages } from "@/data/seoPages";
import { blogArticles } from "@/data/blogArticles";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useWebPageSchema } from "@/hooks/useSchemaOrg";

const ServiceAreaDetail = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const area = citySlug ? getAreaBySlug(citySlug) : undefined;
  const { openQuiz } = useBookingQuiz();

  usePageMeta({
    title: area
      ? `${area.city} Magician | White Rabbit Magic — Luxury Event Entertainment`
      : "Service Area | White Rabbit Magic",
    description: area
      ? `Hire a world-class magician for luxury events in ${area.city}. Close-up magic, parlor shows, and bespoke entertainment by White Rabbit.`
      : "",
    path: `/areas/${citySlug}`,
  });

  useWebPageSchema({
    name: area ? `Magician in ${area.city}` : "Service Area",
    description: area
      ? `Hire a world-class magician for luxury events in ${area.city}. Close-up magic, parlor shows, and bespoke entertainment.`
      : "",
    path: `/areas/${citySlug}`,
    type: "WebPage",
  });

  if (!area) return <Navigate to="/areas" replace />;

  // Find SEO pages matching this location
  const matchingPages = seoPages.filter(
    (p) => p.location === area.city
  );

  // Find blog articles relevant to the city (check title/excerpt)
  const cityLower = area.city.toLowerCase();
  const matchingArticles = blogArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(cityLower) ||
      a.excerpt.toLowerCase().includes(cityLower) ||
      a.slug.includes(citySlug!)
  );

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <img
          src={area.photo.replace("w=600&h=400", "w=1600&h=900")}
          alt={`${area.city}, ${area.region} — luxury event entertainment destination`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-12 w-full">
            <AnimatedSection>
              <Link
                to="/areas"
                className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 inline-block hover:text-accent/80 transition-colors"
              >
                ← All Service Areas
              </Link>
              <h1 className="font-serif text-5xl md:text-6xl text-cream mb-3">
                {area.city}
              </h1>
              <p className="font-sans text-base text-cream/70 max-w-lg">
                {area.tagline}
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Intro + Book Now CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
              White Rabbit brings world-class close-up magic, mentalism, and parlor shows to {area.city}'s most prestigious venues and private residences. Whether you're planning a corporate gala, intimate dinner party, or milestone celebration, Scott Syme delivers an unforgettable experience tailored to your event.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={openQuiz}
                className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
              >
                Book Now
              </button>
              <Link
                to="/contact"
                className="font-sans text-sm tracking-[0.2em] uppercase border border-border text-foreground px-10 py-4 hover:border-accent/40 transition-colors text-center"
              >
                Inquire
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Service Pages */}
      {matchingPages.length > 0 && (
        <section className="py-16 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
                Services in {area.city}
              </p>
              <h2 className="font-serif text-3xl text-foreground mb-8">
                {matchingPages.length} Entertainment {matchingPages.length === 1 ? "Option" : "Options"}
              </h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingPages.map((page, i) => (
                <AnimatedSection key={page.slug} delay={Math.min(i * 0.05, 0.25)}>
                  <Link
                    to={`/blog/${page.slug}`}
                    className="group block border border-border p-6 hover:border-accent/40 transition-colors"
                  >
                    <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
                      {page.category}
                    </p>
                    <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-accent transition-colors">
                      {page.title}
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground line-clamp-2">
                      {page.metaDescription}
                    </p>
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
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
                Related Articles
              </p>
              <h2 className="font-serif text-3xl text-foreground mb-8">
                Guides & Insights
              </h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingArticles.map((article, i) => (
                <AnimatedSection key={article.slug} delay={Math.min(i * 0.1, 0.3)}>
                  <Link
                    to={`/blog/${article.slug}`}
                    className="group block border border-border p-6 hover:border-accent/40 transition-colors h-full"
                  >
                    <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
                      {article.category} · {article.readTime}
                    </p>
                    <h3 className="font-serif text-xl text-foreground mb-3 group-hover:text-accent transition-colors">
                      {article.title}
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <QuizCTA title={`Planning an Event in ${area.city}?`} />

      <AnimatedSection>
        <section className="bg-forest-dark py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-cream mb-6">
              Book White Rabbit in {area.city}
            </h2>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Inquire Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default ServiceAreaDetail;
