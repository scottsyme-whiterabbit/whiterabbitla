import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useReducedMotion, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CardBack, CardFace, CARD_LABELS } from "@/components/findTheLady/PlayingCard";
import { SLOT_COUNT, dealCards, planSwaps, type GameCard } from "@/lib/findTheLadyPopup";

type Phase = "showing" | "shuffling" | "pick" | "revealing" | "revealed";

/** Card 18% of the table, gap 2.5%: one slot to the next is this share of a card's own width. */
const STEP = (20.5 / 18) * 100;
const SLOT_NAMES = ["first", "second", "third", "fourth", "fifth"];
const KEYS = Array.from({ length: SLOT_COUNT }, (_, i) => i);
const SHOW_QUEEN_MS = 1300;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CardMotion {
  x: MotionValue<string>;
  y: MotionValue<string>;
  rotateY: MotionValue<number>;
  back: MotionValue<number>;
  fade: MotionValue<number>;
  scale: MotionValue<number>;
  z: MotionValue<number>;
}

interface Props {
  /** Called once the guest presses Continue after the reveal. */
  onDone: (foundQueen: boolean) => void;
  /** Called when the guest picks a card, with whether it was the Queen. */
  onPick?: (foundQueen: boolean) => void;
}

/** Step 2 of Find the Queen: five cards, the Queen shown, a fast fair shuffle, one honest pick. */
const FindTheQueenGame = ({ onDone, onPick }: Props) => {
  const reduce = useReducedMotion() ?? false;
  // deal.current[k] is the card with key k; key k starts in slot k.
  const deal = useRef<GameCard[]>(dealCards());
  const queenKey = deal.current.indexOf("queen");
  const motions = useRef<CardMotion[] | null>(null);
  if (!motions.current) {
    motions.current = KEYS.map((slot) => ({
      x: motionValue(`${slot * STEP}%`), y: motionValue("0%"), rotateY: motionValue(180), back: motionValue(1),
      fade: motionValue(1), scale: motionValue(1), z: motionValue(1),
    }));
  }
  const slotOf = useRef<number[]>([...KEYS]);
  const [slots, setSlots] = useState<number[]>([...KEYS]);
  const [phase, setPhase] = useState<Phase>("showing");
  const [shown, setShown] = useState<boolean[]>(KEYS.map(() => false));
  const [picked, setPicked] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const lineRef = useRef<HTMLParagraphElement>(null);

  const flipUp = useCallback(async (k: number) => {
    const m = motions.current![k];
    setShown((s) => s.map((v, i) => (i === k ? true : v)));
    if (reduce) await animate(m.back, 0, { duration: 0.3 });
    else await animate(m.rotateY, 0, { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const });
  }, [reduce]);

  const flipDown = useCallback(async (k: number) => {
    const m = motions.current![k];
    if (reduce) await animate(m.back, 1, { duration: 0.3 });
    else await animate(m.rotateY, 180, { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const });
    setShown((s) => s.map((v, i) => (i === k ? false : v)));
  }, [reduce]);

  const swap = useCallback(async (a: number, b: number) => {
    const m = motions.current!;
    const ka = slotOf.current.indexOf(a);
    const kb = slotOf.current.indexOf(b);
    const duration = 0.26;
    const ease = [0.45, 0, 0.25, 1] as const;
    m[ka].z.set(3);
    m[kb].z.set(2);
    await Promise.all([
      animate(m[ka].x, `${b * STEP}%`, { duration, ease }),
      animate(m[ka].y, ["0%", "-16%", "0%"], { duration, times: [0, 0.5, 1] }),
      animate(m[kb].x, `${a * STEP}%`, { duration, ease }),
      animate(m[kb].y, ["0%", "10%", "0%"], { duration, times: [0, 0.5, 1] }),
    ]);
    m[ka].z.set(1);
    m[kb].z.set(1);
    const next = [...slotOf.current];
    next[ka] = b;
    next[kb] = a;
    slotOf.current = next;
  }, []);

  // Show the Queen, turn her down, shuffle, then the guest picks.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await wait(350);
      if (cancelled) return;
      await flipUp(queenKey);
      await wait(SHOW_QUEEN_MS);
      if (cancelled) return;
      await flipDown(queenKey);
      if (cancelled) return;
      setPhase("shuffling");
      await wait(250);
      const swaps = planSwaps();
      if (reduce) {
        // Reduced motion: the cards fade, change places all at once, and return.
        const m = motions.current!;
        await Promise.all(m.map((c) => animate(c.fade, 0, { duration: 0.3 })));
        for (const [a, b] of swaps) {
          const ka = slotOf.current.indexOf(a);
          const kb = slotOf.current.indexOf(b);
          const next = [...slotOf.current];
          next[ka] = b;
          next[kb] = a;
          slotOf.current = next;
        }
        KEYS.forEach((k) => m[k].x.set(`${slotOf.current[k] * STEP}%`));
        await wait(200);
        await Promise.all(m.map((c) => animate(c.fade, 1, { duration: 0.3 })));
      } else {
        for (const [a, b] of swaps) {
          if (cancelled) return;
          await swap(a, b);
          await wait(30);
        }
      }
      if (!cancelled) {
        setSlots([...slotOf.current]);
        setPhase("pick");
      }
    })();
    return () => { cancelled = true; };
  }, [reduce, swap, flipUp, flipDown, queenKey]);

  const choose = useCallback(async (k: number) => {
    if (phase !== "pick") return;
    setPhase("revealing");
    setPicked(k);
    const isQueen = deal.current[k] === "queen";
    setFound(isQueen);
    onPick?.(isQueen);
    const m = motions.current![k];
    if (!reduce) animate(m.y, "-6%", { duration: 0.2 });
    animate(m.scale, 1.06, { duration: 0.2 });
    await wait(180);
    await flipUp(k);
    await wait(isQueen ? 250 : 450);
    if (!isQueen) {
      await flipUp(queenKey);
      await wait(250);
    }
    await Promise.all(KEYS.filter((key) => key !== k && key !== queenKey).map((key) => flipUp(key)));
    setPhase("revealed");
    setTimeout(() => lineRef.current?.focus({ preventScroll: true }), 30);
  }, [flipUp, onPick, phase, queenKey, reduce]);

  const m = motions.current;
  const status = phase === "showing" ? "Here is the Queen. Keep your eye on her."
    : phase === "shuffling" ? "Watch closely."
    : phase === "pick" ? "Tap the card you think is the Queen." : "";

  return (
    <div className="text-center">
      <p className="font-serif text-3xl md:text-4xl text-cream mb-2">Find the Queen.</p>
      <p className="font-sans text-sm text-cream/60 min-h-[20px]" aria-live="polite">{status}</p>

      <div className="relative mx-auto w-full max-w-[520px] pt-[9%] pb-[6%]">
        <div className="relative w-full aspect-[100/26]" style={{ perspective: "1200px" }}>
          {m && KEYS.map((k) => {
            const mv = m[k];
            const clickable = phase === "pick";
            const card = deal.current[k];
            const face = shown[k];
            const label = face && phase !== "showing"
              ? `${CARD_LABELS[card]}${picked === k ? ", your choice" : ""}`
              : clickable ? `Card in the ${SLOT_NAMES[slots[k]]} position` : "Face down card";
            return (
              <motion.button
                key={k}
                type="button"
                onClick={() => choose(k)}
                disabled={!clickable}
                aria-label={label}
                className={`absolute top-0 left-0 w-[18%] aspect-[5/7] p-0 bg-transparent border-0 outline-none rounded-[6%] touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-forest-dark ${clickable ? "cursor-pointer" : "cursor-default"}`}
                style={{ x: mv.x, y: mv.y, scale: mv.scale, zIndex: mv.z, opacity: mv.fade, willChange: "transform" }}
              >
                <div className={`w-full h-full transition-transform duration-200 ${clickable && !reduce ? "hover:-translate-y-[4%]" : ""}`} style={{ transformStyle: "preserve-3d" }}>
                  <motion.div className="relative w-full h-full" style={{ rotateY: reduce ? 0 : mv.rotateY, transformStyle: "preserve-3d" }}>
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                      {face && <CardFace id={card} className={`block w-full h-full [filter:drop-shadow(var(--shadow-card-dealt))] ${picked === k ? "rounded-[6%] ring-2 ring-accent" : ""}`} />}
                    </div>
                    <motion.div
                      className="absolute inset-0"
                      style={reduce
                        ? { opacity: mv.back }
                        : { transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    >
                      <CardBack className="block w-full h-full [filter:drop-shadow(var(--shadow-card-dealt))]" />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[150px]">
        {phase === "revealed" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p ref={lineRef} tabIndex={-1} role="status" className="outline-none font-serif text-xl md:text-2xl text-cream mb-5 leading-snug [text-wrap:balance]">
              {found
                ? "You found her. Nicely done. You're entered in this quarter's drawing for a complimentary White Rabbit show."
                : "The Queen is notoriously hard to catch, but no guest of White Rabbit leaves empty-handed."}
            </p>
            <button
              type="button"
              onClick={() => onDone(found)}
              className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 min-h-[48px] hover:bg-accent/85 transition-colors"
            >
              Continue <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FindTheQueenGame;
