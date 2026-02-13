import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Star } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { getSeoPageBySlug } from "@/data/seoPages";
import experienceImg from "@/assets/experience-closeup.jpg";
import parlorImg from "@/assets/event-parlor-show.jpg";

const SeoLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getSeoPageBySlug(slug) : undefined;

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

  if (!page) {
    return <Navigate to="/blog" replace />;
  }

  const heroImage = page.category === "Parlor Shows" ? parlorImg : experienceImg;

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={page.heroHeadline}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-forest-dark/75" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              {page.category}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              {page.heroHeadline}
            </h1>
            <p className="font-sans text-lg text-cream/80 max-w-2xl mx-auto">
              {page.heroSubheadline}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-lg text-muted-foreground leading-relaxed mb-12">
              {page.introParagraph}
            </p>
          </AnimatedSection>

          {page.bodyParagraphs.map((paragraph, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {paragraph}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </section>

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
              "Scott didn't just entertain our guests — he made them feel like the most important people in the room. 
              That's a rare gift, and it's exactly what we needed."
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              — Private Client, {page.location}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
              {page.ctaText}
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-10">
              Every experience is tailored to your event, your guests, and your vision. 
              Tell us about your occasion and we'll craft something extraordinary.
            </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Inquire Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default SeoLanding;
