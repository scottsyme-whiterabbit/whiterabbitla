import { Link } from "react-router-dom";
import { blogArticles, BlogArticle } from "@/data/blogArticles";
import AnimatedSection from "@/components/AnimatedSection";

interface RelatedReadsProps {
  currentSlug: string;
  category: string;
}

const RelatedReads = ({ currentSlug, category }: RelatedReadsProps) => {
  // Prioritize same-category articles, then fill with other articles
  const sameCategory = blogArticles.filter(
    (a) => a.category === category && a.slug !== currentSlug
  );
  const otherArticles = blogArticles.filter(
    (a) => a.category !== category && a.slug !== currentSlug
  );
  const related = [...sameCategory, ...otherArticles].slice(0, 3);

  if (related.length === 0) return null;

  return (
    <AnimatedSection>
      <section className="border-t border-border py-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-6">
            Continue Reading
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((article) => (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                className="group block border border-border p-5 hover:border-accent/40 transition-colors"
              >
                <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-accent mb-2">
                  {article.category} · {article.readTime}
                </p>
                <h3 className="font-serif text-base text-foreground mb-2 group-hover:text-accent transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
};

export default RelatedReads;
