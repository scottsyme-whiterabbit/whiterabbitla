import { Link } from "react-router-dom";

const services: { slug: string; label: string }[] = [
  { slug: "corporate-magician", label: "Corporate Events" },
  { slug: "wedding-magician", label: "Weddings" },
  { slug: "private-party-magician", label: "Private Parties" },
  { slug: "close-up-magician", label: "Close-Up Magic" },
  { slug: "private-magic-show", label: "Private Magic Show" },
  { slug: "holiday-party-magician", label: "Holiday Parties" },
  { slug: "charity-gala-magician", label: "Charity Galas" },
  { slug: "trade-show-magician", label: "Trade Shows" },
  { slug: "golf-tournament-magician", label: "Golf Tournaments" },
  { slug: "dmc-entertainment", label: "DMC Programs" },
  { slug: "resident-event-magician", label: "Resident Events" },
];

interface ServicesFooterBlockProps {
  className?: string;
  variant?: "light" | "dark";
}

/**
 * Site-wide internal-link block that surfaces all 11 service pages.
 * Drop into high-traffic pages (About, Contact, Reviews, Experience, Areas)
 * so every service page receives inbound links from the site's authority hubs.
 */
const ServicesFooterBlock = ({ className = "", variant = "light" }: ServicesFooterBlockProps) => {
  const isDark = variant === "dark";
  return (
    <section
      aria-label="All White Rabbit LA magic services"
      className={`py-16 border-t ${isDark ? "border-cream/10 bg-forest-dark text-cream" : "border-border"} ${className}`}
    >
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p
          className={`font-sans text-xs tracking-[0.3em] uppercase mb-3 ${
            isDark ? "text-accent" : "text-accent"
          }`}
        >
          Services We Provide
        </p>
        <h2
          className={`font-serif text-2xl md:text-3xl mb-6 ${
            isDark ? "text-cream" : "text-foreground"
          }`}
        >
          Eleven dedicated magic services
        </h2>
        <p
          className={`font-sans text-sm leading-relaxed mb-8 max-w-2xl mx-auto ${
            isDark ? "text-cream/70" : "text-muted-foreground"
          }`}
        >
          From corporate galas and weddings to trade shows, charity galas, and DMC programs — explore every White
          Rabbit experience.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {services.map((s) => (
            <Link
              key={s.slug}
              to={`/services/${s.slug}`}
              className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                isDark
                  ? "border-cream/20 text-cream/70 hover:text-cream hover:border-cream"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link
            to="/services"
            className={`font-sans text-sm underline underline-offset-4 transition-colors ${
              isDark ? "text-accent hover:text-cream" : "text-accent hover:text-accent/80"
            }`}
          >
            See all services →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesFooterBlock;
