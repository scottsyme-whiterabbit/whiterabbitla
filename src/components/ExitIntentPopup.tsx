import { useState, useEffect, useCallback, useRef } from "react";
import { X, Check, CalendarCheck, ArrowRight } from "lucide-react";
import threeStars from "@/assets/three-stars-gold.png";
import playbookMockup from "@/assets/hosts-playbook-mockup.png";
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
  const hasTriggered = useRef(false);
  const scrollDepthRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDesktop = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(pointer: coarse)").matches) return false;
    return window.innerWidth >= 768;
  }, []);

  const canTrigger = useCallback(() => {
    const dismissed = sessionStorage.getItem("wr-exit-dismissed");
    if (dismissed || hasTriggered.current) return false;
    if (!isDesktop()) return false;
    return true;
  }, [isDesktop]);

  const trigger = useCallback(() => {
    if (!canTrigger()) return;
    hasTriggered.current = true;
    setIsVisible(true);
  }, [canTrigger]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollDepthRef.current = Math.max(scrollDepthRef.current, depth);
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track activity for inactivity trigger
  useEffect(() => {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("mousemove", resetActivity, { passive: true });
    window.addEventListener("keydown", resetActivity, { passive: true });
    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
    };
  }, []);

  useEffect(() => {
    const excludedPaths = ["/contact", "/guide", "/quiz", "/consultation"];
    if (excludedPaths.some(p => location.pathname.startsWith(p))) return;
    if (typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768)) return;

    // 1. Mouse-leave trigger (desktop) — after 5s and 25%+ scroll
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && scrollDepthRef.current >= 25) {
        trigger();
      }
    };

    // 2. Inactivity trigger — 45s idle after 20%+ scroll
    const checkInactivity = () => {
      if (Date.now() - lastActivityRef.current > 45000 && scrollDepthRef.current >= 20) {
        trigger();
      }
    };

    const mouseTimer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    inactivityTimerRef.current = setInterval(checkInactivity, 5000);

    return () => {
      clearTimeout(mouseTimer);
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [trigger, location.pathname]);

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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-forest-dark border border-accent/20 max-w-xl w-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 text-cream/40 hover:text-cream transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {mode === "choice" && (
          <div className="p-8 md:p-10 text-center">
            <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-8 w-auto opacity-50 mx-auto mb-4" />
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
              Before You Go
            </p>
            <h3 className="font-serif text-2xl md:text-3xl text-cream mb-3 leading-tight">
              The Guide Luxury Hosts Swear By
            </h3>
            <p className="font-sans text-sm text-cream/50 leading-relaxed mb-6 max-w-sm mx-auto">
              Used by planners at Morgan Stanley, Netflix & Soho House. Get the 7 secrets before your next event.
            </p>

            {/* Primary: Check Availability */}
            <button
              onClick={handleCheckAvailability}
              className="w-full flex items-center justify-center gap-2.5 font-sans text-sm md:text-base tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors mb-3"
            >
              <CalendarCheck size={16} strokeWidth={1.5} />
              Check Availability
            </button>

            {/* Secondary: Get the Guide */}
            <button
              onClick={handleGetGuide}
              className="w-full flex items-center justify-center gap-2 font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent bg-transparent px-6 py-3 hover:bg-accent/10 transition-colors"
            >
              Get the Free Guide
              <ArrowRight size={14} strokeWidth={2} />
            </button>

            <p className="font-sans text-[10px] text-cream/25 mt-5">
              Free instant download · No spam · Unsubscribe anytime
            </p>
          </div>
        )}

        {mode === "guide" && (
          <div className="flex flex-col md:flex-row">
            {/* Guide Preview Image */}
            <div className="hidden md:flex md:w-2/5 bg-forest-dark/50 items-center justify-center p-6">
              <img
                src={playbookMockup}
                alt="The Host's Playbook"
                className="w-full max-w-[180px] h-auto drop-shadow-2xl"
              />
            </div>

            {/* Form */}
            <div className="md:w-3/5 p-8 md:p-10">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
                Almost There
              </p>
              <h3 className="font-serif text-2xl text-cream mb-2">
                Where Should We Send It?
              </h3>
              <p className="font-serif text-sm text-cream/40 italic mb-5">
                The Host's Playbook — 7 Secrets Inside
              </p>
              <div className="space-y-2 mb-6">
                {[
                  "The #1 mistake hosts make booking entertainment",
                  "How to match a performer to your event format",
                  "The cocktail hour trick that transforms energy",
                  "Questions to ask before signing any contract",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <Check size={12} className="text-accent mt-1 flex-shrink-0" />
                    <p className="font-sans text-xs text-cream/60">{item}</p>
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
                  className="w-full bg-cream/5 border border-cream/15 rounded-none px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send Me the Guide →"}
                </button>
              </form>
              <p className="font-sans text-[10px] text-cream/25 mt-3 text-center">
                Instant delivery · No spam ever
              </p>
            </div>
          </div>
        )}

        {mode === "success" && (
          <div className="p-10 text-center">
            <Check className="mx-auto mb-4 text-accent" size={32} />
            <h3 className="font-serif text-3xl text-cream mb-3">
              Check Your Inbox ✨
            </h3>
            <p className="font-sans text-sm text-cream/60 leading-relaxed mb-6 max-w-sm mx-auto">
              The Host's Playbook is on its way. While you wait — want to see if your date is available?
            </p>
            <button
              onClick={handleCheckAvailability}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3.5 hover:bg-accent/80 transition-colors mb-3"
            >
              <CalendarCheck size={14} strokeWidth={1.5} />
              Inquire
            </button>
            <button
              onClick={dismiss}
              className="font-sans text-sm tracking-[0.2em] uppercase text-cream/40 hover:text-cream transition-colors"
            >
              Continue Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExitIntentPopup;
