import { useRef, useState } from "react";
import { Download, Check } from "lucide-react";
import { toPng } from "html-to-image";
import wrSymbol from "@/assets/wr-symbol.png";

export interface Persona {
  name: string;
  tagline: string;
  description: string;
  trait1: string;
  trait2: string;
  trait3: string;
  emoji: string;
}

export const personas: Record<string, Persona> = {
  curator: {
    name: "The Curator",
    tagline: "You don't host events. You craft experiences.",
    description:
      "You have an instinct for atmosphere. Every detail matters, from the lighting to the playlist to the way a guest feels the moment they walk in. You're drawn to elegance, and your events have a quiet confidence that makes people feel they've stepped into something extraordinary.",
    trait1: "Eye for detail",
    trait2: "Effortlessly elegant",
    trait3: "Sets the tone for a room",
    emoji: "✦",
  },
  showstopper: {
    name: "The Showstopper",
    tagline: "Go big or go home? You invented that phrase.",
    description:
      "You live for the gasp. The standing ovation. The moment when an entire room falls silent and then erupts. Your events aren't gatherings, they're productions. You want every guest to leave saying that was the best night of their life.",
    trait1: "Born entertainer",
    trait2: "Thinks in spectacle",
    trait3: "Leaves a lasting impression",
    emoji: "◆",
  },
  connector: {
    name: "The Connector",
    tagline: "Your superpower is making strangers feel like old friends.",
    description:
      "You understand that the best events aren't about the venue or the menu. They're about the energy between people. You create spaces where conversations spark, laughter flows, and everyone leaves with a new story to tell.",
    trait1: "Master of chemistry",
    trait2: "Reads a room instantly",
    trait3: "Creates shared moments",
    emoji: "○",
  },
  believer: {
    name: "The Skeptic-Turned-Believer",
    tagline: "You walked in with doubts. You'll leave speechless.",
    description:
      "You've seen a lot. You're not easily impressed. But that's exactly what makes you the perfect audience. When something genuinely surprises you, it lands harder. And once you believe, you become the biggest advocate in the room.",
    trait1: "High standards",
    trait2: "Hard to fool, easy to delight",
    trait3: "Becomes the best word-of-mouth",
    emoji: "◇",
  },
  tastemaker: {
    name: "The Tastemaker",
    tagline: "If you chose it, it must be good.",
    description:
      "People look to you when they want to know what's worth their time. Your recommendations carry weight. You gravitate toward things that are original, refined, and impossible to replicate. Cookie-cutter is your nemesis.",
    trait1: "Trendsetter instinct",
    trait2: "Values originality",
    trait3: "Curates with intention",
    emoji: "⬡",
  },
};

export function getPersona(answers: {
  eventType?: string;
  vibe?: string;
  concern?: string;
  guestCount?: string;
  priority?: string;
}): string {
  const { vibe, concern, guestCount, priority } = answers;

  // Skeptic-Turned-Believer: concern-driven
  if (concern === "cheesy" || concern === "audience") return "believer";

  // Showstopper: wow + memorable + large
  if (vibe === "wow" || (priority === "memorable" && (guestCount === "large" || guestCount === "grand")))
    return "showstopper";

  // Connector: fun + engagement
  if (vibe === "fun" || priority === "engagement") return "connector";

  // Curator: elegant/intimate + seamless
  if ((vibe === "elegant" || vibe === "intimate") && (priority === "seamless" || priority === "unique"))
    return "curator";

  // Tastemaker: unique priority
  if (priority === "unique") return "tastemaker";

  // Default based on vibe
  if (vibe === "elegant" || vibe === "intimate") return "curator";

  return "connector";
}

interface PersonaCardProps {
  persona: Persona;
}

const PersonaCard = ({ persona }: PersonaCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#1e352c",
      });
      const link = document.createElement("a");
      link.download = `white-rabbit-${persona.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Download failed:", err);
    }
    setDownloading(false);
  };

  return (
    <div className="space-y-4">
      {/* Downloadable card */}
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(160deg, #2D4A3E 0%, #1e352c 50%, #1a2f26 100%)",
          padding: "48px 40px",
          fontFamily: "'Ogg', Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            inset: "12px",
            border: "1px solid rgba(200, 160, 160, 0.2)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src={wrSymbol}
            alt="White Rabbit"
            width={40}
            height={40}
            style={{ width: "40px", height: "auto", margin: "0 auto", opacity: 0.7 }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Label */}
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(200, 160, 160, 0.9)",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          Your Magic Guest Persona
        </p>

        {/* Persona name */}
        <h2
          style={{
            fontSize: "36px",
            fontWeight: 400,
            color: "#f5f0e8",
            textAlign: "center",
            marginBottom: "8px",
            lineHeight: 1.2,
          }}
        >
          {persona.name}
        </h2>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Ogg', Georgia, serif",
            fontSize: "15px",
            fontStyle: "italic",
            color: "rgba(245, 240, 232, 0.6)",
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          {persona.tagline}
        </p>

        {/* Traits */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          {[persona.trait1, persona.trait2, persona.trait3].map((trait) => (
            <div
              key={trait}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(200, 160, 160, 0.7)",
                textAlign: "center",
              }}
            >
              {trait}
            </div>
          ))}
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "12px",
            lineHeight: 1.8,
            color: "rgba(245, 240, 232, 0.65)",
            textAlign: "center",
            maxWidth: "380px",
            margin: "0 auto 24px",
          }}
        >
          {persona.description}
        </p>

        {/* Footer */}
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "9px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(245, 240, 232, 0.3)",
            textAlign: "center",
          }}
        >
          White Rabbit · Los Angeles
        </p>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center justify-center gap-2 w-full font-sans text-xs tracking-[0.2em] uppercase border border-accent/30 text-cream/70 py-3 hover:bg-accent/10 hover:text-cream transition-colors disabled:opacity-50"
      >
        {downloaded ? (
          <>
            <Check size={14} /> Saved
          </>
        ) : (
          <>
            <Download size={14} /> {downloading ? "Creating…" : "Save Your Persona Card"}
          </>
        )}
      </button>
    </div>
  );
};

export default PersonaCard;
