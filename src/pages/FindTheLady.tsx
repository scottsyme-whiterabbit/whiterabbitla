import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { animate, motion, motionValue, useReducedMotion, type MotionValue } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { CardBack, CardFace, CARD_LABELS, type CardId } from "@/components/findTheLady/PlayingCard";
import threeStars from "@/assets/three-stars-gold.png";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

type Phase = "ready" | "showing" | "shuffling" | "pick" | "revealed";

const HOME: CardId[] = ["spades", "queen", "clubs"];
/** One slot to the next, as a share of a card's own width (card 30%, gap 5% of the table). */
const STEP = 116.667;
const SLOT_NAMES = ["left", "middle", "right"];
const CLAIM_KEY = "wr-find-the-lady-claim";

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "private_party", label: "Private party" },
  { value: "other", label: "Other" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CardMotion {
  x: MotionValue<string>;
  y: MotionValue<string>;
  rotateY: MotionValue<number>;
  back: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  z: MotionValue<number>;
}

interface SavedClaim { code: string; expiresOn: string }

function readSavedClaim(): SavedClaim | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAIM_KEY) || "null");
    return v && typeof v.code === "string" && typeof v.expiresOn === "string" ? v : null;
  } catch {
    return null;
  }
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

const fieldCls = "w-full bg-transparent border border-cream/25 px-4 py-3 min-h-[48px] font-sans text-base text-cream placeholder:text-cream/40 focus:outline-none focus:border-accent transition-colors";
const labelCls = "block font-sans text-[11px] tracking-[0.2em] uppercase text-cream/70 mb-2";

const FindTheLady = () => {
  const reduce = useReducedMotion() ?? false;
  const motions = useRef<Record<CardId, CardMotion> | null>(null);
  if (!motions.current) {
    const make = (slot: number): CardMotion => ({
      x: motionValue(`${slot * STEP}%`), y: motionValue("0%"), rotateY: motionValue(0), back: motionValue(0),
      opacity: motionValue(1), scale: motionValue(1), z: motionValue(1),
    });
    motions.current = { spades: make(0), queen: make(1), clubs: make(2) };
  }
  const slotsRef = useRef<CardId[]>([...HOME]);
  const [order, setOrder] = useState<CardId[]>([...HOME]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [picked, setPicked] = useState<CardId | null>(null);
  const [faceUp, setFaceUp] = useState(true);
  const [plays, setPlays] = useState(0);
  const running = useRef(false);

  const [claim, setClaim] = useState<SavedClaim | null>(() => (typeof window === "undefined" ? null : readSavedClaim()));
  const [form, setForm] = useState({ firstName: "", email: "", eventType: "", approxDate: "", optIn: false, website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { trackEvent("find_the_lady_view"); }, []);

  const flip = useCallback(async (up: boolean) => {
    const m = motions.current!;
    const ids = Object.keys(m) as CardId[];
    if (reduce) {
      await Promise.all(ids.map((id) => animate(m[id].back, up ? 0 : 1, { duration: 0.35 })));
    } else {
      await Promise.all(ids.map((id) => animate(m[id].rotateY, up ? 0 : 180, { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const })));
    }
    setFaceUp(up);
  }, [reduce]);

  const swap = useCallback(async (a: number, b: number) => {
    const m = motions.current!;
    const slots = slotsRef.current;
    const ca = slots[a];
    const cb = slots[b];
    if (reduce) {
      await Promise.all([animate(m[ca].opacity, 0.1, { duration: 0.2 }), animate(m[cb].opacity, 0.1, { duration: 0.2 })]);
      m[ca].x.set(`${b * STEP}%`);
      m[cb].x.set(`${a * STEP}%`);
      await Promise.all([animate(m[ca].opacity, 1, { duration: 0.2 }), animate(m[cb].opacity, 1, { duration: 0.2 })]);
    } else {
      const duration = 0.52;
      const ease = [0.45, 0, 0.25, 1] as const;
      m[ca].z.set(3);
      m[cb].z.set(2);
      await Promise.all([
        animate(m[ca].x, `${b * STEP}%`, { duration, ease }),
        animate(m[ca].y, ["0%", "-16%", "0%"], { duration, times: [0, 0.5, 1] }),
        animate(m[cb].x, `${a * STEP}%`, { duration, ease }),
        animate(m[cb].y, ["0%", "10%", "0%"], { duration, times: [0, 0.5, 1] }),
      ]);
      m[ca].z.set(1);
      m[cb].z.set(1);
    }
    const next = [...slots];
    next[a] = cb;
    next[b] = ca;
    slotsRef.current = next;
  }, [reduce]);

  const play = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    const m = motions.current!;
    setPicked(null);
    setPlays((n) => n + 1);
    trackEvent("find_the_lady_play");
    window.__lovableEvents?.track?.("project.find_the_lady_play", {});

    // Settle any lift from the previous round, then show the Lady face up.
    (Object.keys(m) as CardId[]).forEach((id) => { animate(m[id].scale, 1, { duration: 0.2 }); animate(m[id].y, "0%", { duration: 0.2 }); });
    if (!faceUp) await flip(true);
    setPhase("showing");
    const q = m.queen;
    if (!reduce) {
      await animate(q.y, ["0%", "-9%", "0%"], { duration: 0.9, times: [0, 0.45, 1] });
    }
    await wait(reduce ? 1400 : 700);

    await flip(false);
    setPhase("shuffling");
    await wait(250);
    const swaps = 5 + Math.floor(Math.random() * 3);
    let last = "";
    for (let i = 0; i < swaps; i++) {
      let a = 0;
      let b = 0;
      let key = "";
      do {
        a = Math.floor(Math.random() * 3);
        b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
        key = [a, b].sort().join("");
      } while (key === last && Math.random() < 0.7);
      last = key;
      await swap(a, b);
      await wait(reduce ? 120 : 90);
    }
    setOrder([...slotsRef.current]);
    setPhase("pick");
    running.current = false;
  }, [faceUp, flip, reduce, swap]);

  const choose = useCallback(async (id: CardId) => {
    if (phase !== "pick" || running.current) return;
    running.current = true;
    setPicked(id);
    const m = motions.current!;
    if (!reduce) animate(m[id].y, "-6%", { duration: 0.25 });
    animate(m[id].scale, 1.04, { duration: 0.25 });
    await wait(200);
    await flip(true);
    const found = id === "queen";
    setPhase("revealed");
    trackEvent("find_the_lady_reveal", { found_queen: found ? "yes" : "no" });
    window.__lovableEvents?.track?.("project.find_the_lady_reveal", { found_queen: found });
    running.current = false;
    setTimeout(() => resultRef.current?.focus({ preventScroll: true }), 50);
  }, [flip, phase, reduce]);

  const found = picked === "queen";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.firstName.trim()) return setFormError("Please add your first name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setFormError("Please check your email address.");
    if (!form.eventType) return setFormError("Please choose an event type.");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-the-lady-claim", {
        body: { ...form, firstName: form.firstName.trim(), email: form.email.trim(), foundQueen: found },
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
      if (data?.code && data?.expiresOn) {
        const saved = { code: data.code as string, expiresOn: data.expiresOn as string };
        localStorage.setItem(CLAIM_KEY, JSON.stringify(saved));
        setClaim(saved);
        trackEvent("find_the_lady_email_captured", { event_type: form.eventType });
        window.__lovableEvents?.track?.("project.find_the_lady_email_captured", { event_type: form.eventType, found_queen: found, opt_in: form.optIn });
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const status =
    phase === "ready" ? "Here is the Lady, in the middle. Keep your eye on her."
    : phase === "showing" ? "Keep your eye on the Queen."
    : phase === "shuffling" ? "Watch closely."
    : phase === "pick" ? "Where is she? Choose a card."
    : found ? "You found her. Nicely done." : "She slipped away this time. Lucky for you, the reward is the same.";

  const m = motions.current;

  return (
    <main id="main-content" className="pt-20 bg-forest-dark min-h-screen">
      <SEOHead
        title="Find the Lady | White Rabbit LA"
        description="A small game of Find the Lady from White Rabbit LA. Follow the Queen of Hearts and receive a booking credit."
        canonical="/find-the-lady"
        noIndex
      />

      <section className="px-5 pt-8 pb-8 md:pt-20 md:pb-10 text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">A Small Game</p>
        <h1 className="font-serif text-4xl md:text-6xl text-cream mb-4 md:mb-5 leading-tight">Can you find the Lady?</h1>
        <p className="font-sans text-base text-cream/70 max-w-md mx-auto leading-relaxed">
          Three cards, one Queen of Hearts. Watch her as the cards move, then choose the one you believe is her.
        </p>
      </section>

      <section className="px-4 pb-10" aria-label="Find the Lady game">
        <div className="relative mx-auto w-full max-w-[560px] pt-[7%] pb-[5%]">
          <div className="relative w-full aspect-[100/42]" style={{ perspective: "1200px" }}>
            {m && order.map((id) => {
              const slot = order.indexOf(id);
              const mv = m[id];
              const clickable = phase === "pick";
              const isPicked = picked === id;
              const label = phase === "revealed" || phase === "ready"
                ? `${CARD_LABELS[id]}${isPicked ? ", your choice" : ""}`
                : clickable ? `Card in the ${SLOT_NAMES[slot]} position` : "Face down card";
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  disabled={!clickable}
                  aria-label={label}
                  className={`absolute top-0 left-0 w-[30%] aspect-[5/7] p-0 bg-transparent border-0 outline-none rounded-[6%] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-forest-dark ${clickable ? "cursor-pointer" : "cursor-default"}`}
                  style={{ x: mv.x, y: mv.y, scale: mv.scale, zIndex: mv.z, opacity: mv.opacity, willChange: "transform" }}
                >
                  <div className={`w-full h-full transition-transform duration-200 ${clickable && !reduce ? "hover:-translate-y-[4%]" : ""}`} style={{ transformStyle: "preserve-3d" }}>
                  <motion.div
                    className="relative w-full h-full"
                    style={{ rotateY: mv.rotateY, transformStyle: "preserve-3d" }}
                  >
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                      <CardFace id={id} className={`block w-full h-full drop-shadow-[0_14px_22px_hsl(0_0%_0%/0.35)] ${isPicked && phase === "revealed" ? "rounded-[6%] ring-2 ring-accent" : ""}`} />
                    </div>
                    <motion.div
                      className="absolute inset-0"
                      style={reduce
                        ? { opacity: mv.back }
                        : { transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    >
                      <CardBack className="block w-full h-full drop-shadow-[0_14px_22px_hsl(0_0%_0%/0.35)]" />
                    </motion.div>
                  </motion.div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="max-w-md mx-auto text-center min-h-[120px]">
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className={`outline-none font-serif text-cream mb-6 ${phase === "revealed" ? "text-2xl md:text-3xl" : "text-lg text-cream/80"}`}
          >
            {status}
          </div>
          {phase === "ready" && (
            <button
              type="button"
              onClick={play}
              className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 min-h-[48px] hover:bg-accent/85 transition-colors"
            >
              Shuffle the cards <ArrowRight size={14} />
            </button>
          )}
          {phase === "revealed" && (
            <button
              type="button"
              onClick={play}
              className="inline-flex items-center gap-2 min-h-[44px] font-sans text-xs tracking-[0.25em] uppercase text-cream/70 hover:text-accent transition-colors"
            >
              Play again
            </button>
          )}
        </div>
      </section>

      {(phase === "revealed" || (plays > 0 && claim)) && (
        <section className="px-5 pb-24" aria-labelledby="lady-reward">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative max-w-lg mx-auto border border-accent/25 p-6 sm:p-10"
          >
            <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/40" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/40" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/40" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/40" />
            <img src={threeStars} alt="" aria-hidden="true" width={120} height={48} className="h-10 w-auto opacity-60 mx-auto mb-5" />

            {claim ? (
              <div className="text-center">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Saved under your name</p>
                <h2 id="lady-reward" className="font-serif text-2xl md:text-3xl text-cream mb-5 leading-snug">
                  Your credit is saved. Mention code <span className="whitespace-nowrap text-accent">{claim.code}</span> when you reach out, or book a call below.
                </h2>
                <p className="font-sans text-sm text-cream/60 mb-8">Valid until {longDate(claim.expiresOn)}.</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 min-h-[48px] hover:bg-accent/85 transition-colors"
                >
                  Book a call <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">With our compliments</p>
                  <h2 id="lady-reward" className="font-serif text-3xl md:text-4xl text-cream mb-4 leading-tight">A $250 credit toward your evening</h2>
                  <p className="font-sans text-sm text-cream/70 leading-relaxed">
                    Everyone who plays receives the same credit. Tell us a little about your event and we will save it under your name.
                  </p>
                </div>
                <form onSubmit={submit} noValidate className="space-y-5">
                  <div className="hidden" aria-hidden="true">
                    <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} /></label>
                  </div>
                  <div>
                    <label htmlFor="lady-first-name" className={labelCls}>First name</label>
                    <input id="lady-first-name" className={fieldCls} autoComplete="given-name" maxLength={60} required
                      value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="lady-email" className={labelCls}>Email</label>
                    <input id="lady-email" type="email" inputMode="email" className={fieldCls} autoComplete="email" maxLength={255} required
                      value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="lady-event-type" className={labelCls}>Event type</label>
                    <select id="lady-event-type" className={`${fieldCls} appearance-none`} required
                      value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}>
                      <option value="" className="text-foreground">Choose one</option>
                      {EVENT_TYPES.map((t) => <option key={t.value} value={t.value} className="text-foreground">{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="lady-date" className={labelCls}>Approximate event date (optional)</label>
                    <input id="lady-date" type="date" className={`${fieldCls} [color-scheme:dark]`}
                      value={form.approxDate} onChange={(e) => setForm((f) => ({ ...f, approxDate: e.target.value }))} />
                  </div>
                  <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                    <input type="checkbox" className="mt-1 h-5 w-5 accent-[hsl(var(--gold))]"
                      checked={form.optIn} onChange={(e) => setForm((f) => ({ ...f, optIn: e.target.checked }))} />
                    <span className="font-sans text-sm text-cream/80">Send me occasional notes from White Rabbit.</span>
                  </label>
                  {formError && <p role="alert" className="font-sans text-sm text-rose">{formError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 min-h-[52px] hover:bg-accent/85 transition-colors disabled:opacity-60"
                  >
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving</> : "Claim my credit"}
                  </button>
                  <p className="font-sans text-[11px] leading-relaxed text-cream/50">
                    $250 credit toward a White Rabbit package of $2,500 or more. One per event, new bookings only, valid 12 months from today, non-transferable, no cash value. Not combinable with other offers.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </section>
      )}
    </main>
  );
};

export default FindTheLady;
