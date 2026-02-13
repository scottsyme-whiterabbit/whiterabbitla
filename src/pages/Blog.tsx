import { Link } from "react-router-dom";
import { useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { seoPages, seoCategories, seoLocations } from "@/data/seoPages";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const filteredPages = seoPages.filter((page) => {
    if (activeCategory && page.category !== activeCategory) return false;
    if (activeLocation && page.location !== activeLocation) return false;
    return true;
  });

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Site Guide</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              Insights & Guides
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              Explore the world of luxury magic entertainment — from corporate galas to intimate private celebrations across Southern California and beyond.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      <section className="py-12 border-b border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">By Service</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
              >
                All
              </button>
              {seoCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">By Location</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveLocation(null)}
                className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                  !activeLocation
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
              >
                All
              </button>
              {seoLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setActiveLocation(activeLocation === loc ? null : loc)}
                  className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                    activeLocation === loc
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pages Grid */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-sans text-sm text-muted-foreground mb-8">
            {filteredPages.length} {filteredPages.length === 1 ? "guide" : "guides"} found
          </p>
          <div className="space-y-0 divide-y divide-border">
            {filteredPages.map((page, index) => (
              <AnimatedSection key={page.slug} delay={Math.min(index * 0.05, 0.3)}>
                <Link to={`/blog/${page.slug}`} className="block group">
                  <article className="py-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
                          {page.category} · {page.location}
                        </p>
                        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3 group-hover:text-accent transition-colors">
                          {page.title}
                        </h2>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-3xl line-clamp-2">
                          {page.metaDescription}
                        </p>
                      </div>
                      <span className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground group-hover:text-accent transition-colors mt-2 shrink-0 hidden md:block">
                        Read →
                      </span>
                    </div>
                  </article>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-cream mb-6">Ready to Experience the Magic?</h2>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default Blog;
