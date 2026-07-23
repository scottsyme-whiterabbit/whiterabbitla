import { Link } from "react-router-dom";

const trio = [
  {
    slug: "aspen",
    city: "Aspen",
    line: "A mountain wedding at The Little Nell.",
    image: "https://images.unsplash.com/photo-1578241561880-0a1d5db3cb8a?w=900&h=600&fit=crop",
  },
  {
    slug: "beverly-hills",
    city: "Beverly Hills",
    line: "An estate gala off Rodeo Drive.",
    image: "/areas/beverly-hills.jpg",
  },
  {
    slug: "jackson-hole",
    city: "Jackson Hole",
    line: "A family office retreat at Snake River Lodge.",
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=900&h=600&fit=crop",
  },
];

const Guestbook = () => {
  return (
    <section className="bg-background py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-12">
          From the Guestbook
        </p>

        {/* Mobile: horizontal swipeable scroll */}
        <div className="md:hidden -mx-6 px-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-4 pb-2">
            {trio.map((card) => (
              <Link
                key={card.slug}
                to={`/areas/${card.slug}`}
                className="group flex-shrink-0 w-[75vw] max-w-[280px] snap-start flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden border border-accent/15 mb-3">
                  <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-accent/30 z-10" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-accent/30 z-10" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-accent/30 z-10" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-accent/30 z-10" />
                  <img
                    src={card.image}
                    alt={`${card.city} — White Rabbit private magic destination`}
                    width={400}
                    height={400}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover saturate-[0.85]"
                  />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-1">{card.city}</h3>
                <p className="font-sans text-xs text-muted-foreground italic leading-relaxed">
                  {card.line}
                </p>
              </Link>
            ))}
          </div>
          <p className="text-center font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-4">
            Swipe →
          </p>
        </div>

        {/* Desktop: original grid */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {trio.map((card) => (
            <Link
              key={card.slug}
              to={`/areas/${card.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden border border-accent/15 mb-5">
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
                <img
                  src={card.image}
                  alt={`${card.city} — White Rabbit private magic destination`}
                  width={600}
                  height={450}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover saturate-[0.85] transition-all duration-500 group-hover:saturate-100"
                />
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-2">{card.city}</h3>
              <p className="font-sans text-sm text-muted-foreground italic mb-4 leading-relaxed">
                {card.line}
              </p>
              <span className="font-sans text-xs tracking-[0.2em] uppercase text-accent mt-auto">
                Read <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};


export default Guestbook;
