import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { useLocation } from "react-router-dom";

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { openQuiz } = useBookingQuiz();
  const location = useLocation();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0) {
      const dismissed = sessionStorage.getItem("wr-exit-dismissed");
      if (dismissed) return;
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    // Only trigger on blog/service pages
    if (!location.pathname.startsWith("/blog/") && !location.pathname.startsWith("/services/")) return;

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Wait 5s before arming

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave, location.pathname]);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("wr-exit-dismissed", "true");
  };

  const handleBook = () => {
    dismiss();
    openQuiz();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-forest-dark border border-accent/30 max-w-md w-full p-10 text-center animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-cream/40 hover:text-cream transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
          Before You Go
        </p>
        <h3 className="font-serif text-3xl text-cream mb-4">
          Don't Miss Your Date
        </h3>
        <p className="font-sans text-sm text-cream/70 mb-8 leading-relaxed">
          Peak season dates are filling fast. Check availability for your event now and we'll respond within 24 hours. No obligation.
        </p>
        <button
          onClick={handleBook}
          className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors mb-4"
        >
          Check Availability
        </button>
        <button
          onClick={dismiss}
          className="font-sans text-xs text-cream/40 hover:text-cream/60 transition-colors"
        >
          No thanks, I'll come back later
        </button>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
