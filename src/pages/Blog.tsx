import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";

const blogPosts = [
  {
    slug: "los-angeles-corporate-event-magician",
    title: "Los Angeles Corporate Event Magician",
    excerpt: "Looking for unforgettable corporate entertainment in LA? Discover how White Rabbit brings sophisticated close-up magic to Fortune 500 galas, product launches, and executive retreats across Los Angeles.",
    category: "Corporate Events",
  },
  {
    slug: "luxury-private-party-entertainment-la",
    title: "Luxury Private Party Entertainment in Los Angeles",
    excerpt: "Elevate your private celebration with bespoke magic entertainment. From intimate dinner parties to extravagant birthday celebrations, White Rabbit crafts personalized magical experiences in Los Angeles.",
    category: "Private Events",
  },
  {
    slug: "close-up-magic-for-corporate-events",
    title: "Why Close-Up Magic is the Perfect Corporate Icebreaker",
    excerpt: "Close-up magic creates genuine connections between guests in a way no other entertainment can. Learn why the world's top companies choose intimate magic for their most important events.",
    category: "Insights",
  },
  {
    slug: "wedding-entertainment-los-angeles",
    title: "Wedding Entertainment Ideas: Los Angeles Magician",
    excerpt: "Make your wedding cocktail hour unforgettable with sophisticated close-up magic. Discover how White Rabbit creates magical moments that bring your guests together.",
    category: "Weddings",
  },
  {
    slug: "hire-magician-beverly-hills",
    title: "Hire a Magician in Beverly Hills & West Los Angeles",
    excerpt: "From Beverly Hills to Santa Monica, White Rabbit is the premier choice for luxury magic entertainment on the Westside. Available for private homes, restaurants, hotels, and corporate venues.",
    category: "Location Guide",
  },
  {
    slug: "parlor-magic-show-los-angeles",
    title: "The Art of the Parlor Magic Show",
    excerpt: "Experience the intimate theater of a parlor magic show — a curated 45-minute performance blending storytelling, mystery, and wonder for groups of 20 to 100 guests.",
    category: "Experiences",
  },
];

const Blog = () => {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Journal</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              Insights & Guides
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              Explore the world of luxury entertainment, event planning tips, and the art of magic.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Posts */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="space-y-0 divide-y divide-border">
            {blogPosts.map((post, index) => (
              <AnimatedSection key={post.slug} delay={index * 0.1}>
                <article className="py-10 group cursor-pointer">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">{post.category}</p>
                  <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4 group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-3xl">
                    {post.excerpt}
                  </p>
                </article>
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
