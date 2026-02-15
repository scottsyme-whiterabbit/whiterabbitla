import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { getBlogArticleBySlug } from "@/data/blogArticles";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getBlogArticleBySlug(slug) : undefined;
  const { openQuiz } = useBookingQuiz();

  useEffect(() => {
    if (article) {
      document.title = article.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", article.metaDescription);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = article.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [article]);

  if (!article) return null;

  const publishDate = new Date(article.publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pick a pull quote: use a sentence from the middle content that's impactful
  const midIndex = Math.floor(article.content.length / 2);
  const pullQuoteSource = article.content[midIndex] || "";
  // Extract first sentence as pull quote
  const pullQuoteSentence = pullQuoteSource.split(". ").slice(0, 2).join(". ") + ".";
  const showPullQuote = article.content.length > 4;

  // Render paragraph with auto-bold for leading names/venues
  const renderParagraph = (text: string, index: number) => {
    const isFirst = index === 0;

    // Auto-detect bold lead-in: text before the first period if it looks like a name/venue (starts with capital, under 60 chars)
    const firstPeriod = text.indexOf(". ");
    const hasLeadIn =
      !isFirst &&
      firstPeriod > 0 &&
      firstPeriod < 60 &&
      /^[A-Z]/.test(text) &&
      (article.category === "Magic Destinations" || text.match(/^[A-Z][a-zA-Z\s&'']+( at | is | has | brings | offers | remains | built )/));

    if (isFirst) {
      // Drop cap + lede styling
      const firstChar = text.charAt(0);
      const rest = text.slice(1);
      return (
        <p className="font-sans text-lg md:text-xl text-foreground/90 leading-relaxed mb-8">
          <span
            className="font-serif text-6xl md:text-7xl float-left mr-3 mt-1 leading-[0.8] text-accent"
            style={{ fontStyle: "normal" }}
          >
            {firstChar}
          </span>
          {rest}
        </p>
      );
    }

    if (hasLeadIn) {
      const lead = text.slice(0, firstPeriod);
      const remaining = text.slice(firstPeriod);
      return (
        <p className="font-sans text-base text-muted-foreground leading-[1.85] mb-7">
          <strong className="text-foreground font-medium">{lead}</strong>
          {remaining}
        </p>
      );
    }

    return (
      <p className="font-sans text-base text-muted-foreground leading-[1.85] mb-7">
        {text}
      </p>
    );
  };

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-6">
              {article.category}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-8 leading-[1.15]">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-cream/50 font-sans text-xs tracking-[0.2em] uppercase">
              <span>By Scott Syme</span>
              <span className="w-1 h-1 rounded-full bg-cream/30" />
              <span>{publishDate}</span>
              <span className="w-1 h-1 rounded-full bg-cream/30" />
              <span>{article.readTime}</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Lede / Excerpt */}
      <section className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <AnimatedSection>
            <p className="font-serif text-xl md:text-2xl text-foreground/80 leading-relaxed text-center" style={{ fontStyle: "normal" }}>
              {article.excerpt}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-6">
          {article.content.map((paragraph, i) => {
            const elements = [];

            // Insert pull quote before the middle paragraph
            if (showPullQuote && i === midIndex) {
              elements.push(
                <AnimatedSection key={`pullquote-${i}`}>
                  <blockquote className="border-l-2 border-accent pl-8 my-12 md:my-16">
                    <p className="font-serif text-2xl md:text-3xl text-foreground/80 leading-snug" style={{ fontStyle: "normal" }}>
                      {pullQuoteSentence.length > 180
                        ? pullQuoteSentence.slice(0, 180).trim() + "..."
                        : pullQuoteSentence}
                    </p>
                  </blockquote>
                </AnimatedSection>
              );
            }

            // Insert decorative break every ~4 paragraphs (not first)
            if (i > 0 && i !== midIndex && i % 4 === 0) {
              elements.push(
                <div key={`divider-${i}`} className="flex justify-center my-10 md:my-14">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-accent/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                    <span className="w-8 h-px bg-accent/40" />
                  </div>
                </div>
              );
            }

            elements.push(
              <AnimatedSection key={i} delay={Math.min(i * 0.03, 0.15)}>
                {renderParagraph(paragraph, i)}
              </AnimatedSection>
            );

            return elements;
          })}
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">
              Ready to Elevate Your Next Event?
            </h2>
            <p className="font-sans text-sm text-cream/70 mb-8">
              Tell us about your event and we'll confirm availability within 24 hours.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Check Availability
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* Back link */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Link
            to="/blog"
            className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to All Guides
          </Link>
        </div>
      </section>
    </main>
  );
};

export default BlogArticle;
