// Card art for Find the Lady, drawn in brand colors so it stays crisp at any size.
export type CardId = "queen" | "spades" | "clubs";

export const CARD_LABELS: Record<CardId, string> = {
  queen: "Queen of Hearts",
  spades: "Ace of Spades",
  clubs: "Ace of Clubs",
};

const INK = "hsl(var(--forest-dark))";
const RED = "hsl(var(--suit-red))";
const GOLD = "hsl(var(--gold))";
const CREAM = "hsl(var(--cream))";

const HEART = "M50 90 C22 68 6 50 6 32 C6 17 17 7 30 7 C39 7 46 12 50 21 C54 12 61 7 70 7 C83 7 94 17 94 32 C94 50 78 68 50 90 Z";
const SPADE = "M50 4 C60 22 94 38 94 60 C94 74 84 82 72 82 C63 82 56 77 53 71 C54 81 58 89 65 95 L35 95 C42 89 46 81 47 71 C44 77 37 82 28 82 C16 82 6 74 6 60 C6 38 40 22 50 4 Z";

function Club({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <circle cx="50" cy="27" r="19" />
      <circle cx="27" cy="57" r="19" />
      <circle cx="73" cy="57" r="19" />
      <path d="M42 40 L58 40 L62 62 L38 62 Z" />
      <path d="M47 60 C46 77 42 87 34 95 L66 95 C58 87 54 77 53 60 Z" />
    </g>
  );
}

function Pip({ id, x, y, size }: { id: CardId; x: number; y: number; size: number }) {
  const s = size / 100;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}>
      {id === "queen" ? <path d={HEART} fill={RED} /> : id === "spades" ? <path d={SPADE} fill={INK} /> : <Club fill={INK} />}
    </g>
  );
}

function Index({ id }: { id: CardId }) {
  const color = id === "queen" ? RED : INK;
  return (
    <g>
      <text x="26" y="50" textAnchor="middle" fontFamily="Ogg, Georgia, serif" fontSize="34" fill={color}>
        {id === "queen" ? "Q" : "A"}
      </text>
      <Pip id={id} x={26} y={70} size={20} />
    </g>
  );
}

/** Face of a card. viewBox 250 x 350 (standard poker proportion). */
export function CardFace({ id, className }: { id: CardId; className?: string }) {
  return (
    <svg viewBox="0 0 250 350" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="248" height="348" rx="16" fill={CREAM} stroke={GOLD} strokeOpacity="0.55" strokeWidth="2" />
      <rect x="12" y="12" width="226" height="326" rx="10" fill="none" stroke={GOLD} strokeOpacity="0.45" strokeWidth="1" />
      <Index id={id} />
      <g transform="rotate(180 125 175)"><Index id={id} /></g>

      {id === "queen" && (
        <g>
          {/* A fine gold crown over the heart */}
          <path d="M92 120 L100 92 L113 110 L125 84 L137 110 L150 92 L158 120 Z" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="92" y1="127" x2="158" y2="127" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="88" r="3.5" fill={GOLD} />
          <circle cx="125" cy="80" r="3.5" fill={GOLD} />
          <circle cx="150" cy="88" r="3.5" fill={GOLD} />
          <Pip id="queen" x={125} y={188} size={92} />
          <text x="125" y="268" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="10" letterSpacing="4" fill={INK} fillOpacity="0.7">THE LADY</text>
        </g>
      )}
      {id === "spades" && (
        <g>
          <circle cx="125" cy="172" r="66" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" />
          <circle cx="125" cy="172" r="72" fill="none" stroke={GOLD} strokeOpacity="0.35" strokeWidth="1" />
          <Pip id="spades" x={125} y={170} size={84} />
          <text x="125" y="272" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="9" letterSpacing="3.5" fill={INK} fillOpacity="0.6">WHITE RABBIT</text>
        </g>
      )}
      {id === "clubs" && <Pip id="clubs" x={125} y={175} size={88} />}
    </svg>
  );
}

const STAR = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} C${cx + r * 0.14} ${cy - r * 0.14} ${cx + r * 0.14} ${cy - r * 0.14} ${cx + r} ${cy} C${cx + r * 0.14} ${cy + r * 0.14} ${cx + r * 0.14} ${cy + r * 0.14} ${cx} ${cy + r} C${cx - r * 0.14} ${cy + r * 0.14} ${cx - r * 0.14} ${cy + r * 0.14} ${cx - r} ${cy} C${cx - r * 0.14} ${cy - r * 0.14} ${cx - r * 0.14} ${cy - r * 0.14} ${cx} ${cy - r} Z`;

/** Back of a card: forest green with the three gold stars. */
export function CardBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 250 350" className={className} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="wr-lattice" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 L0 18 M0 0 L18 0" stroke={GOLD} strokeOpacity="0.14" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="248" height="348" rx="16" fill={INK} stroke={GOLD} strokeOpacity="0.6" strokeWidth="2" />
      <rect x="14" y="14" width="222" height="322" rx="9" fill="url(#wr-lattice)" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" />
      <rect x="20" y="20" width="210" height="310" rx="6" fill="none" stroke={GOLD} strokeOpacity="0.25" strokeWidth="1" />
      <rect x="62" y="128" width="126" height="94" fill={INK} />
      <path d={STAR(125, 160, 22)} fill={GOLD} />
      <path d={STAR(96, 180, 13)} fill={GOLD} />
      <path d={STAR(154, 180, 13)} fill={GOLD} />
    </svg>
  );
}

/** Small fanned trio for the homepage invitation. */
export function FannedCards({ className }: { className?: string }) {
  const order: CardId[] = ["spades", "queen", "clubs"];
  return (
    <div className={`relative ${className ?? ""}`} aria-hidden="true">
      {order.map((id, i) => (
        <div
          key={id}
          className="absolute bottom-0 left-1/2 w-[46%] origin-bottom drop-shadow-[0_10px_18px_hsl(var(--forest-dark)/0.25)]"
          style={{ transform: `translateX(-50%) translateX(${(i - 1) * 28}%) rotate(${(i - 1) * 13}deg)`, zIndex: i === 1 ? 2 : 1 }}
        >
          <CardFace id={id} className="block w-full h-auto" />
        </div>
      ))}
    </div>
  );
}
