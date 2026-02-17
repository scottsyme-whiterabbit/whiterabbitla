import { useState, useEffect } from "react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { useLocation } from "react-router-dom";
import { CalendarCheck } from "lucide-react";

const StickyMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { openQuiz } = useBookingQuiz();
  const location = useLocation();

  // Pages where we don't show the sticky CTA
  const excludedPaths = ["/contact", "/quiz", "/guide", "/admin"];

  useEffect(() => {
    const isExcluded = excludedPaths.some((p) => location.pathname.startsWith(p));
    if (isExcluded) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile: full-width bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forest-dark/95 backdrop-blur-md border-t border-accent/20 p-3 animate-in slide-in-from-bottom duration-300">
        <button
          onClick={openQuiz}
          className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground py-3.5 hover:bg-accent/80 transition-colors"
        >
          Check Availability
        </button>
      </div>

      {/* Desktop: floating pill button bottom-right */}
      <button
        onClick={openQuiz}
        className="hidden md:flex fixed bottom-8 right-8 z-50 items-center gap-2.5 bg-accent text-accent-foreground font-sans text-xs tracking-[0.2em] uppercase px-6 py-3.5 shadow-lg hover:bg-accent/90 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in"
        aria-label="Check Availability"
      >
        <CalendarCheck size={16} strokeWidth={1.5} />
        Check Availability
      </button>
    </>
  );
};

export default StickyMobileCTA;
