import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const destinations = [
  {
    slug: "new-york",
    city: "New York",
    line: "Manhattan penthouses and Hamptons estates.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&h=600&fit=crop",
  },
  {
    slug: "san-francisco",
    city: "San Francisco",
    line: "Tech galas and Pacific Heights soirées.",
    image: "https://images.unsplash.com/photo-1521464302861-ce943915d1c3?w=900&h=600&fit=crop",
  },
  {
    slug: "miami",
    city: "Miami",
    line: "South Beach parties and Brickell penthouse events.",
    image: "/areas/miami.jpg",
  },
  {
    slug: "las-vegas",
    city: "Las Vegas",
    line: "Casino nights, conventions and VIP suites.",
    image: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=900&h=600&fit=crop",
  },
  {
    slug: "beverly-hills",
    city: "Beverly Hills",
    line: "An estate gala off Rodeo Drive.",
    image: "/areas/beverly-hills.jpg",
  },
  {
    slug: "aspen",
    city: "Aspen",
    line: "A mountain wedding at The Little Nell.",
    image: "https://images.unsplash.com/photo-1578241561880-0a1d5db3cb8a?w=900&h=600&fit=crop",
  },
];

const AUTO_ADVANCE_MS = 5000;

const Guestbook = () => {
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const cardsPerPage = isMobile ? 1 : 3;
  const totalPages = Math.ceil(destinations.length / cardsPerPage);

  const nextPage = useCallback(() => {
    setPage((p) => (p + 1) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (isPaused || totalPages <= 1) return;
    const interval = setInterval(nextPage, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [isPaused, totalPages, nextPage]);

  const currentCards = destinations.slice(
    page * cardsPerPage,
    page * cardsPerPage + cardsPerPage
  );

  return (
    <section
      className="bg-background py-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-12">
          From the Guestbook
        </p>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {currentCards.map((card) => (
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
                      className="w-full h-full object-cover saturate-[0.85] transition-all duration-500 group-hover:saturate-100 group-hover:scale-105"
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center items-center gap-3 mt-10">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Show guestbook page ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === page
                  ? "bg-accent w-6"
                  : "bg-accent/30 hover:bg-accent/60"
              }`}
            />
          ))}
        </div>

        <p className="text-center font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-4 md:hidden">
          Swipe to explore →
        </p>
      </div>
    </section>
  );
};

export default Guestbook;
