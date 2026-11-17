import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useReducedMotion, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CardBack, CardFace, CARD_LABELS, type CardId } from "@/components/findTheLady/PlayingCard";
import { dealFaces } from "@/lib/findTheLadyPopup";
import { trackEvent } from "@/lib/analytics";

type Key = 0 | 1 | 2;
type Phase = "shuffling" | "pick" | "revealing" | "revealed";

/** One slot to the next, as a share of a card's own width (card 30%, gap 5% of the table). */
const STEP = 116.667;
const SLOT_NAMES = ["left", "middle", "right"];
const KEYS: Key[] = [0, 1, 2];
const SWAPS = 4;
const AUTO_ADVANCE_MS = 2200;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CardMotion {
  x: MotionValue<string>;
  y: MotionValue<string>;
  rotateY: MotionValue<number>;
  back: MotionValue<number>;
  scale: MotionValue<number>;
  z: MotionValue<number>;
}

interface Props {
  /** Moves on to the reveal step. */
  onSurprise: () => void;
}

/** Step 2 of Find the Queen: three face down cards, a brief shuffle, one pick. */
const FindTheQueenGame = ({ onSurprise }: Props) => {
  const reduce = useReducedMotion() ?? false;
  const motions = useRef<CardMotion[] | null>(null);
  if (!motions.current) {
    motions.current = KEYS.map((slot) => ({
      x: motionValue(`${slot * STEP}%`), y: motionValue("0%"), rotateY: motionValue(180), back: motionValue(1),
      scale: motionValue(1), z: motionValue(1),
    }));
  }
  const slotOf = useRef<number[]>([0, 1, 2]);
  const [slots, setSlots] = useState<number[]>([0, 1, 2]);
  const [phase, setPhase] = useState<Phase>("shuffling");
  const [faces, setFaces] = useState<(CardId | null)[]>([null, null, null]);
  const [picked, setPicked] = useState<Key | null>(null);
  const advanced = useRef(false);
  const lineRef = useRef<HTMLParagraphElement>(null);

  const advance = useCallback(() => {
    if (advanced.current) return;
    advanced.current = true;
    onSurprise();
  }, [onSurprise]);

  const swap = useCallback(async (a: number, b: number) => {
    const m = motions.current!;
    const ka = slotOf.current.indexOf(a);
    const kb = slotOf.current.indexOf(b);
    const duration = 0.46;
    const ease = [0.45, 0, 0.25, 1] as const;
    m[ka].z.set(3);
    m[kb].z.set(2);
    await Promise.all([
      animate(m[ka].x, `${b * STEP}%`, { duration, ease }),
      animate(m[ka].y, ["0%", "-14%", "0%"], { duration, times: [0, 0.5, 1] }),
      animate(m[kb].x, `${a * STEP}%`, { duration, ease }),
      animate(m[kb].y, ["0%", "8%", "0%"], { duration, times: [0, 0.5, 1] }),
    ]);
    m[ka].z.set(1);
    m[kb].z.set(1);
    const next = [...slotOf.current];
    next[ka] = b;
    next[kb] = a;
    slotOf.current = next;
  }, []);

  // Brief shuffle on arrival, then the visitor picks.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      trackEvent("find_the_queen_play");
      window.__lovableEvents?.track?.("project.find_the_queen_play", {});
      await wait(reduce ? 500 : 450);
      if (!reduce) {
        let last = "";
        for (let i = 0; i < SWAPS && !cancelled; i++) {
          let a = 0, b = 0, key = "";
          do {
            a = Math.floor(Math.random() * 3);
            b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
            key = [a, b].sort().join("");
          } while (key === last);
          last = key;
          await swap(a, b);
          await wait(70);
        }
      }
      if (!cancelled) {
        setSlots([...slotOf.current]);
        setPhase("pick");
      }
    })();
    return () => { cancelled = true; };
  }, [reduce, swap]);

  const flip = useCallback(async (k: Key) => {
    const m = motions.current![k];
    if (reduce) await animate(m.back, 0, { duration: 0.35 });
    else await animate(m.rotateY, 0, { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const });
  }, [reduce]);

  const choose = useCallback(async (k: Key) => {
    if (phase !== "pick") return;
    setPhase("revealing");
    setPicked(k);
    const bySlot = dealFaces(slotOf.current[k]);
    const byKey = KEYS.map((key) => bySlot[slotOf.current[key]]);
    setFaces(byKey);
    const m = motions.current![k];
    if (!reduce) animate(m.y, "-6%", { duration: 0.25 });
    animate(m.scale, 1.04, { duration: 0.25 });
    await wait(220);
    await flip(k);
    await wait(450);
    const queen = KEYS.find((key) => byKey[key] === "queen")!;
    await flip(queen);
    await wait(250);
    const other = KEYS.find((key) => key !== k && key !== queen)!;
    await flip(other);
    setPhase("revealed");
    setTimeout(() => lineRef.current?.focus({ preventScroll: true }), 30);
  }, [flip, phase, reduce]);

  // Auto-advance about two seconds after the reveal, unless they press the button first.
  useEffect(() => {
    if (phase !== "revealed") return;
    const t = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [phase, advance]);

  const m = motions.current;
  const status = phase === "pick" ? "Tap the card you choose." : phase === "shuffling" ? "Watch closely." : "";

  return (
    <div className="text-center">
      <p className="font-serif text-3xl md:text-4xl text-cream mb-2">Pick a card.</p>
      <p className="font-sans text-sm text-cream/60 min-h-[20px]" aria-live="polite">{status}</p>

      <div className="relative mx-auto w-full max-w-[460px] pt-[7%] pb-[5%]">
        <div className="relative w-full aspect-[100/42]" style={{ perspective: "1200px" }}>
          {m && KEYS.map((k) => {
            const mv = m[k];
            const clickable = phase === "pick";
            const face = faces[k];
            const label = face ? `${CARD_LABELS[face]}${picked === k ? ", your choice" : ""}` : clickable ? `Card in the ${SLOT_NAMES[slots[k]]} position` : "Face down card";
            return (
              <motion.button
                key={k}
                type="button"
                onClick={() => choose(k)}
                disabled={!clickable}
                aria-label={label}
                className={`absolute top-0 left-0 w-[30%] aspect-[5/7] p-0 bg-transparent border-0 outline-none rounded-[6%] touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-forest-dark ${clickable ? "cursor-pointer" : "cursor-default"}`}
                style={{ x: mv.x, y: mv.y, scale: mv.scale, zIndex: mv.z, willChange: "transform" }}
              >
                <div className={`w-full h-full transition-transform duration-200 ${clickable && !reduce ? "hover:-translate-y-[4%]" : ""}`} style={{ transformStyle: "preserve-3d" }}>
                  <motion.div className="relative w-full h-full" style={{ rotateY: reduce ? 0 : mv.rotateY, transformStyle: "preserve-3d" }}>
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                      {face && <CardFace id={face} className={`block w-full h-full drop-shadow-[0_14px_22px_hsl(0_0%_0%/0.35)] ${picked === k ? "rounded-[6%] ring-2 ring-accent" : ""}`} />}
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

      <div className="min-h-[124px]">
        {phase === "revealed" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p ref={lineRef} tabIndex={-1} role="status" className="outline-none font-serif text-xl md:text-2xl text-cream mb-5 leading-snug">
              You didn't find her, but the house has a surprise for you.
            </p>
            <button
              type="button"
              onClick={advance}
              className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 min-h-[48px] hover:bg-accent/85 transition-colors"
            >
              See my surprise <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FindTheQueenGame;
