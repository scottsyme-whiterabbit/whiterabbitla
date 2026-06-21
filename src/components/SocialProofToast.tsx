import { useState, useEffect, useCallback } from "react";
import { Star, X } from "lucide-react";
import { useLocation } from "react-router-dom";

// Real testimonial snippets for social proof
const proofItems = [
  {
    quote: "Beyond magnificent! Scott is mesmerizing and my guests were in awe the entire time.",
    name: "Farnaz F.",
    context: "40th Birthday at Gravitas, Beverly Hills",
  },
  {
    quote: "Jaws were hitting the floor so hard the downstairs neighbors started wondering what was going down.",
    name: "Mohammad R.",
    context: "Private Event",
  },
  {
    quote: "He elevated our party in ways I didn't expect. He was everyone's favorite part.",
    name: "Zara M.",
    context: "Private Party",
  },
  {
    quote: "2nd year in a row hiring him and he knocks it out of the park both times!",
    name: "Taylor R.",
    context: "Corporate Holiday Party",
  },
  {
    quote: "200-person event… the guests absolutely LOVED him. We can't wait to have him back.",
    name: "Jamie I.",
    context: "Morgan Stanley Event",
  },
  {
    quote: "BOOK WHITE RABBIT! You won't regret it.",
    name: "Kenneth R.",
    context: "Private Show Guest",
  },
];

const SocialProofToast = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentProof, setCurrentProof] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  const excludedPaths = ["/contact", "/quiz", "/guide", "/admin", "/review"];

  const showToast = useCallback(() => {
    if (dismissed) return;
    const shown = sessionStorage.getItem("wr-proof-shown");
    if (shown) return;

    setCurrentProof(Math.floor(Math.random() * proofItems.length));
    setIsVisible(true);

    // Auto-hide after 6 seconds
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("wr-proof-shown", "true");
    }, 6000);
  }, [dismissed]);

  useEffect(() => {
    const isExcluded = excludedPaths.some((p) => location.pathname.startsWith(p));
    if (isExcluded || dismissed) return;

    const alreadyShown = sessionStorage.getItem("wr-proof-shown");
    if (alreadyShown) return;

    let triggered = false;
    const handleScroll = () => {
      if (triggered) return;
      // Show after scrolling ~40% of page
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.35) {
        triggered = true;
        showToast();
      }
    };

    // Delay arming to avoid immediate triggers
    const timer = setTimeout(() => {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 5000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname, dismissed, showToast]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    sessionStorage.setItem("wr-proof-shown", "true");
  };

  if (!isVisible) return null;

  const proof = proofItems[currentProof];

  return (
    <div className="fixed bottom-24 md:bottom-20 left-4 md:left-8 z-40 max-w-sm animate-in slide-in-from-left-4 fade-in duration-500">
      <div className="bg-forest-dark/95 backdrop-blur-md border border-accent/20 p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-cream/30 hover:text-cream/60 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
        <div className="flex gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className="fill-accent text-accent" />
          ))}
        </div>
        <p className="font-serif text-sm text-cream/90 leading-relaxed mb-2 pr-4">
          "{proof.quote}"
        </p>
        <p className="font-sans text-xs tracking-[0.15em] uppercase text-cream/40">
          {proof.name} · {proof.context}
        </p>
      </div>
    </div>
  );
};

export default SocialProofToast;
