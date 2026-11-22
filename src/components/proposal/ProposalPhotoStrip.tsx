import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * First photo strip on the client proposal page. The two outer photos turn
 * over to a card face (Ace of Spades left, Queen of Hearts right) when the
 * strip comes into view while scrolling down, and turn back to the photos
 * once the strip leaves out the bottom (scrolling back up). It replays every
 * time. The middle photo never moves. Decorative only; reduced motion keeps
 * the photos with no animation.
 */

export type StripPhoto = { src: string; mirror?: boolean };
type CardId = "spades" | "queen";

const FLIP_MS = 800;
const STAGGER_MS = 300;
const EASE = "cubic-bezier(0.45, 0, 0.55, 1)";
/** Share of the strip that must be visible (while scrolling down) before it flips to the cards. */
const SHOW_RATIO = 0.55;

/** Which tiles flip, which card each reveals, and its delay (left first in both directions). */
const FLIPS: { index: number; card: CardId; delay: number }[] = [
  { index: 0, card: "spades", delay: 0 },
  { index: 2, card: "queen", delay: STAGGER_MS },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HIDDEN_BACKFACE: CSSProperties = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

export default function ProposalPhotoStrip({ photos }: { photos: StripPhoto[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  // Same reduced-motion pattern as CityPage.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setFlipped({});
    const el = gridRef.current;
    if (reduced || !el || typeof IntersectionObserver === "undefined") return;

    let target = false;
    let ratio = 0;
    let lastY = window.scrollY;
    let scrollingDown = false;
    let timers: number[] = [];

    const setTarget = (next: boolean) => {
      if (next === target) return;
      target = next;
      timers.forEach((t) => window.clearTimeout(t));
      timers = FLIPS.map((f) =>
        window.setTimeout(() => setFlipped((p) => ({ ...p, [f.index]: next })), f.delay),
      );
    };

    // Cards come up only on the way down, once the strip is solidly on screen.
    const maybeShowCards = () => {
      if (scrollingDown && ratio >= SHOW_RATIO) setTarget(true);
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) scrollingDown = y > lastY;
      lastY = y;
      maybeShowCards();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
          // Back to the photos only once the strip has fully left out the bottom.
          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) setTarget(false);
          maybeShowCards();
        }
      },
      { threshold: [0, SHOW_RATIO] },
    );
    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [reduced]);

  return (
    <div ref={gridRef} className="max-w-5xl mx-auto mt-10 grid grid-cols-3 gap-3 md:gap-4 overflow-x-clip">
      {photos.map((photo, i) => {
        const flip = FLIPS.find((f) => f.index === i);
        if (!flip || reduced) {
          return (
            <div key={i} className="aspect-[3/4] overflow-hidden bg-forest-dark/60 group">
              <img
                src={photo.src}
                alt=""
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${photo.mirror ? "scale-x-[-1] group-hover:scale-x-[-1.1] group-hover:scale-y-110" : "group-hover:scale-110"}`}
              />
            </div>
          );
        }
        return <FlipTile key={i} photo={photo} card={flip.card} flipped={Boolean(flipped[i])} />;
      })}
    </div>
  );
}

/** Photo on the front at 0deg, card face on the back at 180deg; one turn each way. */
function FlipTile({ photo, card, flipped }: { photo: StripPhoto; card: CardId; flipped: boolean }) {
  // Hover zoom only while the photo is showing, so it never fights the turn.
  const zoom = flipped
    ? photo.mirror ? "scale-x-[-1]" : ""
    : photo.mirror ? "scale-x-[-1] group-hover:scale-x-[-1.1] group-hover:scale-y-110" : "group-hover:scale-110";
  return (
    <div className="aspect-[3/4] group" style={{ perspective: "1000px" }}>
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${flipped ? 180 : 0}deg)`,
          transition: `transform ${FLIP_MS}ms ${EASE}`,
        }}
      >
        <div className="absolute inset-0 overflow-hidden bg-forest-dark/60" style={HIDDEN_BACKFACE}>
          <img src={photo.src} alt="" loading="lazy" className={`w-full h-full object-cover transition-transform duration-700 ease-out ${zoom}`} />
        </div>
        <div className="absolute inset-0" style={{ ...HIDDEN_BACKFACE, transform: "rotateY(180deg)" }}>
          <CardFace card={card} />
        </div>
      </div>
    </div>
  );
}

const INK = "hsl(var(--forest-dark))";
const RED = "hsl(var(--suit-red))";
const GOLD = "hsl(var(--gold))";
const CREAM = "hsl(var(--cream))";
const SERIF = "Ogg, Georgia, serif";

const HEART = "M50 90 C22 68 6 50 6 32 C6 17 17 7 30 7 C39 7 46 12 50 21 C54 12 61 7 70 7 C83 7 94 17 94 32 C94 50 78 68 50 90 Z";
const SPADE = "M50 4 C60 22 94 38 94 60 C94 74 84 82 72 82 C63 82 56 77 53 71 C54 81 58 89 65 95 L35 95 C42 89 46 81 47 71 C44 77 37 82 28 82 C16 82 6 74 6 60 C6 38 40 22 50 4 Z";

function Pip({ card, x, y, size }: { card: CardId; x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 100})`}>
      <path d={card === "queen" ? HEART : SPADE} fill={card === "queen" ? RED : INK} />
    </g>
  );
}

function CornerIndex({ card }: { card: CardId }) {
  return (
    <g>
      <text x="34" y="60" textAnchor="middle" fontFamily={SERIF} fontSize="40" fill={card === "queen" ? RED : INK}>
        {card === "queen" ? "Q" : "A"}
      </text>
      <Pip card={card} x={34} y={84} size={22} />
    </g>
  );
}

/** Card face drawn on a 300 x 400 box so it fills the 3:4 tile exactly. */
function CardFace({ card }: { card: CardId }) {
  return (
    <svg viewBox="0 0 300 400" className="block w-full h-full" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="298" height="398" rx="20" fill={CREAM} stroke={GOLD} strokeOpacity="0.7" strokeWidth="2" />
      <rect x="15" y="15" width="270" height="370" rx="12" fill="none" stroke={GOLD} strokeOpacity="0.45" strokeWidth="1" />
      <CornerIndex card={card} />
      <g transform="rotate(180 150 200)">
        <CornerIndex card={card} />
      </g>
      {card === "spades" ? (
        <g>
          <circle cx="150" cy="200" r="78" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" />
          <circle cx="150" cy="200" r="85" fill="none" stroke={GOLD} strokeOpacity="0.35" strokeWidth="1" />
          <Pip card="spades" x={150} y={198} size={98} />
        </g>
      ) : (
        <g>
          <path d="M114 146 L123 114 L138 135 L150 105 L162 135 L177 114 L186 146 Z" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="114" y1="154" x2="186" y2="154" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="123" cy="109" r="4" fill={GOLD} />
          <circle cx="150" cy="100" r="4" fill={GOLD} />
          <circle cx="177" cy="109" r="4" fill={GOLD} />
          <Pip card="queen" x={150} y={222} size={104} />
        </g>
      )}
    </svg>
  );
}
