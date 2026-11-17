import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Loader2, X } from "lucide-react";
import threeStars from "@/assets/three-stars-gold.png";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import {
  EXIT_ARM_DELAY_MS,
  MOBILE_TIMER_MS,
  QUEEN_CLAIMED_KEY,
  QUEEN_CLOSED_KEY,
  canShowLadyPopup,
  reachedScrollTrigger,
  showCornerTab,
} from "@/lib/findTheLadyPopup";

import { DealtQueen } from "./PlayingCard";

const FindTheQueenGame = lazy(() => import("./FindTheQueenGame"));

type Trigger = "exit" | "scroll" | "timer" | "tab";
type Step = "intro" | "game" | "reveal" | "form" | "done";

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private mode: simply not remembered */ }
}

const primaryBtn = "inline-flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 min-h-[52px] hover:bg-accent/85 transition-colors disabled:opacity-60";
const quietLink = "inline-flex items-center justify-center min-h-[44px] px-3 font-sans text-xs tracking-[0.2em] uppercase text-cream/55 hover:text-cream transition-colors";
const smallLink = "underline underline-offset-2 hover:text-cream transition-colors";
const fieldCls = "w-full bg-transparent border border-cream/25 px-4 py-3 min-h-[48px] font-sans text-base text-cream placeholder:text-cream/40 focus:outline-none focus:border-accent transition-colors";
const labelCls = "block font-sans text-[11px] tracking-[0.2em] uppercase text-cream/70 mb-2";

const FindTheQueenPopup = () => {
  const { pathname } = useLocation();
  const { isOpen: quizOpen } = useBookingQuiz();
  const quizOpenRef = useRef(quizOpen);
  quizOpenRef.current = quizOpen;
  const shownThisVisit = useRef(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [closedAt, setClosedAt] = useState<string | null>(() => (typeof window === "undefined" ? null : read(QUEEN_CLOSED_KEY)));
  const [claimed, setClaimed] = useState<boolean>(() => (typeof window === "undefined" ? false : !!read(QUEEN_CLAIMED_KEY)));
  const [form, setForm] = useState({ firstName: "", email: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const show = useCallback((trigger: Trigger) => {
    setStep("intro");
    setOpen(true);
    trackEvent("find_the_queen_view", { trigger });
    window.__lovableEvents?.track?.("project.find_the_queen_view", { trigger });
  }, []);

  // Automatic opening: once per visit, never after a claim, and not again for 14 days after closing.
  useEffect(() => {
    if (shownThisVisit.current) return;
    if (!canShowLadyPopup({ path: pathname, closedAt: read(QUEEN_CLOSED_KEY), claimed: !!read(QUEEN_CLAIMED_KEY), now: Date.now() })) return;

    const fire = (trigger: Trigger) => {
      if (shownThisVisit.current || quizOpenRef.current) return;
      shownThisVisit.current = true;
      show(trigger);
    };
    const onScroll = () => {
      if (reachedScrollTrigger(window.scrollY, document.documentElement.scrollHeight, window.innerHeight)) fire("scroll");
    };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) fire("exit"); };
    const desktop = !window.matchMedia("(pointer: coarse)").matches && window.innerWidth >= 768;

    window.addEventListener("scroll", onScroll, { passive: true });
    const armExit = desktop ? setTimeout(() => document.addEventListener("mouseleave", onLeave), EXIT_ARM_DELAY_MS) : undefined;
    const timer = desktop ? undefined : setTimeout(() => fire("timer"), MOBILE_TIMER_MS);
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (armExit) clearTimeout(armExit);
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [pathname, show]);

  const close = useCallback(() => {
    setOpen(false);
    if (!read(QUEEN_CLAIMED_KEY)) {
      const now = new Date().toISOString();
      write(QUEEN_CLOSED_KEY, now);
      setClosedAt(now);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.firstName.trim()) return setFormError("Please add your first name.");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim())) return setFormError("Please check your email address.");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-the-lady-claim", {
        body: { firstName: form.firstName.trim(), email: form.email.trim(), website: form.website },
      });
      if (error) {
        let message = "Something went wrong. Please try again.";
        try {
          const ctx = (error as { context?: Response }).context;
          const body = ctx ? await ctx.json() : null;
          if (body?.error) message = body.error;
        } catch { /* keep the general message */ }
        setFormError(message);
        return;
      }
      if (data?.ok) {
        write(QUEEN_CLAIMED_KEY, new Date().toISOString());
        setClaimed(true);
        setStep("done");
        trackEvent("find_the_queen_claim");
        window.__lovableEvents?.track?.("project.find_the_queen_claim", {});
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const tab = showCornerTab({ path: pathname, closedAt, claimed, open });

  return (
    <>
      {tab && (
        <button
          type="button"
          onClick={() => show("tab")}
          className="fixed left-0 bottom-24 md:bottom-8 z-40 flex items-center gap-2 bg-forest-dark border border-l-0 border-accent/40 pl-3 pr-4 min-h-[44px] font-sans text-[11px] tracking-[0.2em] uppercase text-accent shadow-lg hover:text-cream transition-colors"
        >
          <span aria-hidden="true" className="text-[hsl(var(--suit-red))] text-sm">♥</span>
          Find the Queen
        </button>
      )}

      <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-forest-dark/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain p-3 sm:p-6 flex outline-none"
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
            onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus(); }}
          >
            <div className="relative m-auto w-full max-w-xl bg-forest-dark border border-accent/20 px-5 pt-12 pb-7 sm:px-10 sm:pt-12 sm:pb-9 animate-in fade-in zoom-in-95 duration-300">
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/40" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/40" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/40" />
              <DialogPrimitive.Close
                className="absolute top-2 right-2 inline-flex items-center justify-center w-11 h-11 text-cream/60 hover:text-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close"
              >
                <X size={20} />
              </DialogPrimitive.Close>

              {step === "intro" && (
                <div className="text-center">
                  <DealtQueen className="-mt-7 mb-4 sm:-mt-6" />
                  <DialogPrimitive.Title className="font-serif text-[1.75rem] sm:text-3xl md:text-4xl text-cream mb-3 leading-tight [text-wrap:balance]">
                    Can you find the Queen of Hearts?
                  </DialogPrimitive.Title>
                  <p className="font-sans text-base text-cream/70 mb-5">Win a complimentary White Rabbit show.</p>
                  <p className="font-sans text-xs text-cream/55 leading-relaxed mb-8">
                    Valued at $2,500. Drawing held quarterly. No purchase necessary.{" "}
                    <a href="/official-rules" target="_blank" rel="noopener" className={smallLink}>Official Rules</a>
                  </p>
                  <button type="button" onClick={() => setStep("game")} className={`${primaryBtn} w-full sm:w-auto`}>
                    Pick a Card <ArrowRight size={14} />
                  </button>
                  <div className="mt-3">
                    <button type="button" onClick={close} className={quietLink}>No thanks</button>
                  </div>
                </div>
              )}

              {step === "game" && (
                <>
                  <DialogPrimitive.Title className="sr-only">Find the Queen</DialogPrimitive.Title>
                  <Suspense fallback={<div className="h-[360px]" />}>
                    <FindTheQueenGame onSurprise={() => setStep("reveal")} />
                  </Suspense>
                </>
              )}

              {step === "reveal" && (
                <div className="text-center animate-in fade-in duration-500">
                  <img src={threeStars} alt="" aria-hidden="true" width={120} height={48} className="h-9 w-auto opacity-60 mx-auto mb-5" />
                  <DialogPrimitive.Title className="font-serif text-3xl md:text-4xl text-cream mb-4 leading-tight">
                    You've won a $500 credit toward your next show.
                  </DialogPrimitive.Title>
                  <p className="font-sans text-base text-cream/70 mb-8">You're also entered in this quarter's drawing.</p>
                  <button type="button" onClick={() => setStep("form")} className={`${primaryBtn} w-full sm:w-auto`}>
                    Claim my credit <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {step === "form" && (
                <div className="animate-in fade-in duration-300">
                  <DialogPrimitive.Title className="font-serif text-2xl md:text-3xl text-cream mb-7 leading-snug text-center">
                    Enter your name and email, and we'll send your credit and let you know if you've won the show.
                  </DialogPrimitive.Title>
                  <form onSubmit={submit} noValidate className="space-y-5">
                    <div className="hidden" aria-hidden="true">
                      <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} /></label>
                    </div>
                    <div>
                      <label htmlFor="queen-first-name" className={labelCls}>First name</label>
                      <input id="queen-first-name" className={fieldCls} autoComplete="given-name" maxLength={60} required
                        value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label htmlFor="queen-email" className={labelCls}>Email</label>
                      <input id="queen-email" type="email" inputMode="email" className={fieldCls} autoComplete="email" maxLength={255} required
                        value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                    </div>
                    {formError && <p role="alert" className="font-sans text-sm text-rose">{formError}</p>}
                    <button type="submit" disabled={submitting} className={`${primaryBtn} w-full`}>
                      {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending</> : "Send my credit"}
                    </button>
                    <p className="font-sans text-[11px] leading-relaxed text-cream/50 text-center">
                      One $500 credit per household. Valid 12 months. We'll write now and then from the house. Unsubscribe any time.
                      <br />
                      <a href="/official-rules#credit-terms" target="_blank" rel="noopener" className={smallLink}>Credit terms</a>
                      {" · "}
                      <a href="/privacy" target="_blank" rel="noopener" className={smallLink}>Privacy policy</a>
                      {" · "}
                      <a href="/official-rules" target="_blank" rel="noopener" className={smallLink}>Official Rules</a>
                    </p>
                  </form>
                  <div className="mt-2 text-center">
                    <button type="button" onClick={close} className={quietLink}>I'll pass</button>
                  </div>
                </div>
              )}

              {step === "done" && (
                <div className="text-center animate-in fade-in duration-500">
                  <img src={threeStars} alt="" aria-hidden="true" width={120} height={48} className="h-9 w-auto opacity-60 mx-auto mb-5" />
                  <DialogPrimitive.Title className="font-serif text-3xl md:text-4xl text-cream mb-4 leading-tight">
                    Your $500 credit is on its way.
                  </DialogPrimitive.Title>
                  <p className="font-sans text-base text-cream/70 leading-relaxed mb-8">
                    Check your inbox for the details. The winner of the drawing will be notified by email.
                  </p>
                  <button type="button" onClick={close} className={`${primaryBtn} w-full sm:w-auto`}>Continue</button>
                  <div className="mt-3">
                    <Link to="/contact" onClick={close} className={quietLink}>Plan a show</Link>
                  </div>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
};

export default FindTheQueenPopup;
