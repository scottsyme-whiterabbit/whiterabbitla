import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { trackEvent } from "@/lib/analytics";
import {
  EXIT_ARM_DELAY_MS,
  LADY_CLAIM_KEY,
  LADY_DISMISS_KEY,
  canShowLadyPopup,
  reachedScrollTrigger,
} from "@/lib/findTheLadyPopup";

const FindTheLadyGame = lazy(() => import("./FindTheLadyGame"));

type Trigger = "exit" | "scroll";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const FindTheLadyPopup = () => {
  const { pathname } = useLocation();
  const { isOpen: quizOpen } = useBookingQuiz();
  const quizOpenRef = useRef(quizOpen);
  quizOpenRef.current = quizOpen;
  const shownThisVisit = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shownThisVisit.current) return;
    if (!canShowLadyPopup({ path: pathname, dismissedAt: read(LADY_DISMISS_KEY), hasClaim: !!read(LADY_CLAIM_KEY), now: Date.now() })) return;

    const fire = (trigger: Trigger) => {
      if (shownThisVisit.current || quizOpenRef.current) return;
      shownThisVisit.current = true;
      setOpen(true);
      trackEvent("find_the_lady_view", { trigger });
      window.__lovableEvents?.track?.("project.find_the_lady_view", { trigger });
    };

    const onScroll = () => {
      if (reachedScrollTrigger(window.scrollY, document.documentElement.scrollHeight, window.innerHeight)) fire("scroll");
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) fire("exit");
    };
    const desktop = !window.matchMedia("(pointer: coarse)").matches && window.innerWidth >= 768;

    window.addEventListener("scroll", onScroll, { passive: true });
    const armExit = desktop ? setTimeout(() => document.addEventListener("mouseleave", onLeave), EXIT_ARM_DELAY_MS) : undefined;
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (armExit) clearTimeout(armExit);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    // A claimed credit already keeps the pop-up away for good; otherwise rest it for a while.
    if (!read(LADY_CLAIM_KEY)) {
      try {
        localStorage.setItem(LADY_DISMISS_KEY, new Date().toISOString());
      } catch { /* private mode: it simply will not be remembered */ }
    }
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-forest-dark/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby="lady-popup-intro"
          className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain p-3 sm:p-6 flex outline-none"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus(); }}
        >
          <div className="relative m-auto w-full max-w-xl bg-forest-dark border border-accent/20 px-4 pt-10 pb-6 sm:px-8 sm:pt-10 sm:pb-8 animate-in fade-in zoom-in-95 duration-300">
            <DialogPrimitive.Close
              className="absolute top-2 right-2 inline-flex items-center justify-center w-11 h-11 text-cream/50 hover:text-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Close"
            >
              <X size={20} />
            </DialogPrimitive.Close>
            <div className="text-center px-2">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">A Small Game</p>
              <DialogPrimitive.Title className="font-serif text-3xl md:text-4xl text-cream mb-3 leading-tight">
                Can you find the Lady?
              </DialogPrimitive.Title>
              <p id="lady-popup-intro" className="font-sans text-sm text-cream/70 max-w-sm mx-auto leading-relaxed">
                Three cards, one Queen of Hearts. Watch her as the cards move, then choose the one you believe is her.
              </p>
            </div>
            <Suspense fallback={<div className="h-[320px]" />}>
              <FindTheLadyGame onClose={close} />
            </Suspense>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default FindTheLadyPopup;
