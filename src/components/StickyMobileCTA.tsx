import { useState, useEffect } from "react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { useLocation } from "react-router-dom";

const StickyMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { openQuiz } = useBookingQuiz();
  const location = useLocation();

  useEffect(() => {
    // Only show on blog and service pages
    if (!location.pathname.startsWith("/blog/") && !location.pathname.startsWith("/services/")) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forest-dark/95 backdrop-blur-md border-t border-accent/20 p-3 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={openQuiz}
        className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground py-3.5 hover:bg-accent/80 transition-colors"
      >
        Check Availability
      </button>
    </div>
  );
};

export default StickyMobileCTA;
