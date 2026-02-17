import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Check, CalendarCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { supabase } from "@/integrations/supabase/client";

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<"choice" | "guide" | "success">("choice");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const { openQuiz } = useBookingQuiz();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0) {
      const dismissed = sessionStorage.getItem("wr-exit-dismissed");
      if (dismissed) return;
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === "/contact" || location.pathname === "/guide" || location.pathname === "/quiz") return;

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 8000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave, location.pathname]);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("wr-exit-dismissed", "true");
  };

  const handleCheckAvailability = () => {
    dismiss();
    openQuiz();
  };

  const handleGetGuide = () => {
    setMode("guide");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from("lead_magnet_signups").insert({
        email: email.trim(),
        source_page: location.pathname,
      });
      await supabase.functions.invoke("send-lead-magnet", {
        body: { email: email.trim(), sourcePage: location.pathname },
      });
    } catch {
      // Still show success
    }
    setMode("success");
    setSubmitting(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-forest-dark border border-accent/30 max-w-lg w-full p-10 text-center animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-cream/40 hover:text-cream transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {mode === "choice" && (
          <>
            <Sparkles className="mx-auto mb-4 text-accent" size={28} />
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
              Before You Go
            </p>
            <h3 className="font-serif text-3xl text-cream mb-3">
              Don't Leave Without This
            </h3>
            <p className="font-sans text-sm text-cream/60 leading-relaxed mb-8 max-w-sm mx-auto">
              Whether you're ready to book or still exploring, we've got you covered.
            </p>

            {/* Primary CTA: Check Availability */}
            <button
              onClick={handleCheckAvailability}
              className="w-full flex items-center justify-center gap-2.5 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors mb-4"
            >
              <CalendarCheck size={16} strokeWidth={1.5} />
              Check Availability
            </button>

            {/* Secondary CTA: Free Guide */}
            <button
              onClick={handleGetGuide}
              className="w-full font-sans text-sm tracking-[0.2em] uppercase border border-accent/40 text-cream px-8 py-4 hover:bg-accent/10 hover:border-accent transition-colors mb-6"
            >
              Get the Free Host's Playbook
            </button>

            <p className="font-sans text-xs text-cream/30">
              Join 200+ hosts who've elevated their events with White Rabbit.
            </p>
          </>
        )}

        {mode === "guide" && (
          <>
            <Sparkles className="mx-auto mb-4 text-accent" size={28} />
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
              Free Guide
            </p>
            <h3 className="font-serif text-3xl text-cream mb-3">
              The Host's Playbook
            </h3>
            <p className="font-serif text-base text-cream/50 italic mb-5">
              7 Secrets to Choosing Entertainment That Makes Your Event Legendary
            </p>
            <div className="text-left space-y-2.5 mb-8 max-w-sm mx-auto">
              {[
                "The #1 mistake hosts make when booking entertainment",
                "How to match the right performer to your event format",
                "The cocktail hour trick that transforms guest energy",
                "What luxury brands like Netflix and Morgan Stanley look for",
                "Questions to ask any entertainer before signing a contract",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check size={14} className="text-accent mt-1 flex-shrink-0" />
                  <p className="font-sans text-sm text-cream/70">{item}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-cream/5 border border-cream/15 rounded px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send Me the Free Guide"}
              </button>
            </form>
            <p className="font-sans text-xs text-cream/30 mt-4">
              No spam. Just one beautifully useful guide.
            </p>
          </>
        )}

        {mode === "success" && (
          <>
            <Check className="mx-auto mb-4 text-accent" size={32} />
            <h3 className="font-serif text-3xl text-cream mb-3">
              Check Your Inbox
            </h3>
            <p className="font-sans text-sm text-cream/60 leading-relaxed mb-6">
              Your copy of The Host's Playbook is on its way. In the meantime, want to see if your date is available?
            </p>
            <button
              onClick={handleCheckAvailability}
              className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3.5 hover:bg-accent/80 transition-colors mb-3"
            >
              Check Availability
            </button>
            <button
              onClick={dismiss}
              className="font-sans text-sm tracking-[0.2em] uppercase text-cream/40 hover:text-cream transition-colors"
            >
              Continue Exploring
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExitIntentPopup;
