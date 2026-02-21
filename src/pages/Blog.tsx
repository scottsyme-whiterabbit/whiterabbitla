import { Link } from "react-router-dom";
import { useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import QuizCTA from "@/components/QuizCTA";
import { seoPages, seoCategories, seoLocations } from "@/data/seoPages";
import { blogArticles } from "@/data/blogArticles";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useWebPageSchema } from "@/hooks/useSchemaOrg";

const Blog = () => {
  usePageMeta({
    title: "Insights & Guides | White Rabbit Magic — Los Angeles",
    description: "Explore guides on luxury magic entertainment, from corporate galas to intimate private celebrations across Southern California and beyond.",
    path: "/blog",
  });
  useWebPageSchema({ name: "Insights & Guides", description: "Explore guides on luxury magic entertainment, from corporate galas to intimate private celebrations.", path: "/blog", type: "CollectionPage" });
  const [activeArticleCategory, setActiveArticleCategory] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  // Editor's picks — handpicked top-performing articles
  const editorPickSlugs = [
    "why-cocktail-hour-entertainment-matters",
    "entertainment-gap-planners-dont-know",
    "golf-tournament-entertainment-ideas",
    "best-magic-experiences-los-angeles",
  ];
  const editorPicks = editorPickSlugs
    .map((slug) => blogArticles.find((a) => a.slug === slug))
    .filter(Boolean) as typeof blogArticles;

  const filteredPages = seoPages.filter((page) => {
    if (activeCategory && page.category !== activeCategory) return false;
    if (activeLocation && page.location !== activeLocation) return false;
    return true;
  });

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Site Guide</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              Insights & Guides
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              Explore the world of luxury magic entertainment, from corporate galas to intimate private celebrations across Southern California and beyond.
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

      {/* Editor's Picks */}
      <section className="py-16 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-secondary mb-4">Editor's Picks</p>
            <h2 className="font-serif text-3xl text-foreground mb-8">Start Here</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {editorPicks.map((article, i) => (
              <AnimatedSection key={article.slug} delay={Math.min(i * 0.1, 0.3)}>
                <Link to={`/blog/${article.slug}`} className="group block border border-accent/20 bg-background p-8 hover:border-accent/50 transition-colors h-full">
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

      {/* All Articles */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">All Articles</p>
            <h2 className="font-serif text-3xl text-foreground mb-6">Insights on Luxury Entertainment</h2>
          </AnimatedSection>
          <div className="flex flex-wrap gap-2 mb-8">
            {[null, "For Planners", "For DMCs", "For Production Companies", "Resident Events", "Luxury Nightlife", "Event Planning", "Corporate", "Private Events", "Weddings", "Magic Destinations"].map((cat) => {
              const hasArticles = cat === null || blogArticles.some(a => a.category === cat);
              if (!hasArticles) return null;
              return (
                <button
                  key={cat || "all"}
                  onClick={() => setActiveArticleCategory(cat)}
                  className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                    activeArticleCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {cat || "All"}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogArticles
              .filter(a => !activeArticleCategory || a.category === activeArticleCategory)
              .map((article, i) => (
              <AnimatedSection key={article.slug} delay={Math.min(i * 0.1, 0.3)}>
                <Link to={`/blog/${article.slug}`} className="group block border border-border p-6 hover:border-accent/40 transition-colors h-full">
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

      {/* Pages Grid */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">City Guides</p>
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

      {/* Quiz CTA */}
      <QuizCTA title="Curious If Magic Is the Right Fit?" />

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
