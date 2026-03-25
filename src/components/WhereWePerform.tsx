import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";

const expandedCities = [
  { slug: "chicago", name: "Chicago", tagline: "Corporate Galas & Convention Entertainment" },
  { slug: "miami", name: "Miami", tagline: "Luxury Waterfront Events & Private Soirées" },
  { slug: "new-york", name: "New York", tagline: "Manhattan Events & Black-Tie Entertainment" },
  { slug: "las-vegas", name: "Las Vegas", tagline: "High-Roller Events & Casino Nights" },
  { slug: "san-francisco", name: "San Francisco", tagline: "Tech Events & Bay Area Private Parties" },
  { slug: "dallas", name: "Dallas", tagline: "Oil & Energy Galas & Private Ranch Events" },
  { slug: "houston", name: "Houston", tagline: "Corporate Dinners & Fundraiser Entertainment" },
  { slug: "atlanta", name: "Atlanta", tagline: "Southern Hospitality Events & Film Industry Parties" },
  { slug: "nashville", name: "Nashville", tagline: "Music City Weddings & Private Celebrations" },
  { slug: "scottsdale", name: "Scottsdale", tagline: "Resort Events & Golf Tournament Entertainment" },
  { slug: "malibu", name: "Malibu", tagline: "Beachside Estates & Intimate Dinners" },
  { slug: "beverly-hills", name: "Beverly Hills", tagline: "Estate Galas & Private Dinners" },
];

interface WhereWePerformProps {
  /** Index of the current article in blogArticles array, used for rotation */
  articleIndex: number;
}

const WhereWePerform = ({ articleIndex }: WhereWePerformProps) => {
  const offset = (articleIndex * 3) % expandedCities.length;
  const cities = Array.from({ length: 4 }, (_, i) =>
    expandedCities[(offset + i) % expandedCities.length]
  );

  return (
    <section className="py-16 border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedSection>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
            Where We Perform
          </p>
          <h2 className="font-serif text-3xl text-foreground mb-8">
            Luxury Event Entertainment Nationwide
          </h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cities.map((city, i) => (
            <AnimatedSection key={city.slug} delay={Math.min(i * 0.08, 0.25)}>
              <Link
                to={`/areas/${city.slug}`}
                className="group block border border-border p-5 hover:border-accent/40 transition-colors"
              >
                <h3 className="font-serif text-lg text-foreground group-hover:text-accent transition-colors">
                  {city.name}
                </h3>
                <p className="font-sans text-sm text-muted-foreground mt-1">
                  {city.tagline}
                </p>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhereWePerform;
