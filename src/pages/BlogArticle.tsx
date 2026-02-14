import { useParams, Link, Navigate } from "react-router-dom";
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

  if (!article) return null; // Will fall through to SeoLanding in router

  return (
    <main id="main-content" className="pt-20">
      <section className="bg-forest-dark py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              {article.category} · {article.readTime}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-cream mb-6 leading-tight">
              {article.title}
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              {article.excerpt}
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          {article.content.map((paragraph, i) => (
            <AnimatedSection key={i} delay={Math.min(i * 0.05, 0.2)}>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {paragraph}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </section>

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
