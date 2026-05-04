import { useEffect, useState } from "react";

/* ============================================================
   PROPOSAL — PERSONALIZATION VARIABLES
   Edit these 9 fields per lead. That's it.
   ============================================================ */
const FIRST_NAME = "{{FIRST_NAME}}";
const LAST_NAME = "{{LAST_NAME}}";
const EVENT_TYPE = "{{EVENT_TYPE}}"; // "Wedding" | "Corporate Event" | "Private Event"
const EVENT_DATE = "{{EVENT_DATE}}"; // e.g. "June 14, 2026"
const VENUE = "{{VENUE}}";
const WHAT_WERE_BUILDING_PARAGRAPH =
  "{{WHAT_WERE_BUILDING_PARAGRAPH}}";

const SQUARE_LINK_TIER_1 = "{{SQUARE_LINK_TIER_1}}";
const SQUARE_LINK_TIER_2 = "{{SQUARE_LINK_TIER_2}}";
const SQUARE_LINK_TIER_3 = "{{SQUARE_LINK_TIER_3}}";
/* ============================================================ */

// Color tokens (hardcoded per spec — this page is intentionally outside the site design system)
const C = {
  dark: "#0A0A0A",
  light: "#FAFAF7",
  accent: "#0F4D3A",
  textDark: "#1A1A1A",
  textLight: "#FAFAF7",
  muted: "#6B6B6B",
  mutedWhite: "#A0A0A0",
};

const serif = `'Cormorant Garamond', 'Playfair Display', Georgia, serif`;
const sans = `'Inter', -apple-system, BlinkMacSystemFont, 'Söhne', sans-serif`;

const timeline = [
  { time: "6:30 PM", desc: "I arrive, set quietly, full environment built before guests arrive" },
  { time: "7:30 PM", desc: "Greeting every guest as they walk in" },
  { time: "8:45 PM", desc: "40-minute parlor experience after dinner" },
  { time: "9:30 PM", desc: "I stay through dessert, walk out last" },
];

const tiers = [
  {
    name: "Cocktail Hour",
    tagline: "Intimate close-up during cocktail hour",
    items: [
      "90 minutes of close-up magic during cocktail hour",
      "Up to 100 guests",
      "Pre-event call with couple and/or planner",
      "Standard LA County",
    ],
    price: "$1,800",
    href: SQUARE_LINK_TIER_1,
    cta: "Reserve Cocktail Hour — $1,800",
  },
  {
    name: "The White Rabbit Wedding Experience",
    tagline: "Parlor experience at rehearsal dinner + cocktail hour the next day",
    items: [
      "40–45 minute parlor experience at rehearsal dinner the night before",
      "90 minutes of close-up at cocktail hour the next day",
      "Up to 150 guests across both events",
      "Full pre-event consultation with couple and planner",
      "White Rabbit branded materials, custom moment for the couple",
      "Standard LA County",
    ],
    price: "$3,500",
    href: SQUARE_LINK_TIER_2,
    cta: "Reserve Wedding Experience — $3,500",
    recommended: true,
  },
  {
    name: "The Estate Wedding Experience",
    tagline: "Parlor + cocktail hour + post-reception speakeasy",
    items: [
      "40–45 minute parlor at rehearsal dinner",
      "2 hours of close-up at cocktail hour",
      "30-minute Speakeasy lounge moment after reception",
      "Up to 250 guests across all three events",
      "Full environment build for parlor moment",
      "Custom narrative woven through the night",
      "Standard LA County",
    ],
    price: "$5,500",
    href: SQUARE_LINK_TIER_3,
    cta: "Reserve Estate Experience — $5,500",
  },
];

const faqs = [
  {
    q: "How much space do you need?",
    a: "For close-up walk-around, none — I move through the room. For the parlor experience, anywhere a host can comfortably gather their guests works: a living room, a private dining room, a lounge area, a tented space outdoors. I'll walk you through the setup a week ahead so the room is ready and you don't have to think about it.",
  },
  {
    q: "What if a guest doesn't want to participate?",
    a: "No one is ever pulled in who doesn't want to be. The night is built around making your guests feel hosted, not put on the spot. The shy guest at the back of the room is part of the show too — they just experience it differently.",
  },
  {
    q: "Do you need a stage, microphone, or special lighting?",
    a: "For most rooms, no. I bring everything I need — including soft lighting and a discreet sound system if the space calls for it. For the Estate tier, full environment build is included (drapes, scent, side table, branded materials).",
  },
  {
    q: "What's your weather contingency for outdoor events?",
    a: "We move indoors. Magic doesn't survive wind, rain, or direct sun — and your guests deserve better than to fight the elements. I'll work with your planner ahead of time on the indoor backup so it's ready before it's needed.",
  },
  {
    q: "How early do you arrive?",
    a: "For close-up walk-around, an hour before guests. For the full parlor experience, two hours — the environment is part of the night, and it has to be set quietly before the first guest walks in.",
  },
  {
    q: "Do you travel?",
    a: "Yes. Standard pricing covers Los Angeles County. For destination events, travel and lodging are added to the proposal. I've performed everywhere from Jackson Hole to New York to Fort Lauderdale — distance isn't a barrier.",
  },
  {
    q: "What happens after I reserve the date?",
    a: "A 50% deposit holds your date and locks the booking. The remaining 50% is due the day before your event. Two weeks before, we hop on a final call to walk through the night together. The day of, I show up early, handle everything, and your only job is to enjoy the evening.",
  },
];

const logos = ["Netflix", "Disney", "Morgan Stanley", "Rivian", "Rolls-Royce", "CBS"];

const ProposalTemplate = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = `Proposal — ${FIRST_NAME} ${LAST_NAME} — White Rabbit LA`;
    // Inject Cormorant + Inter
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

  return (
    <div style={{ fontFamily: sans, color: C.textDark, background: C.light, lineHeight: 1.7 }}>
      <style>{`
        .prop-section { padding: 96px 24px; }
        @media (max-width: 768px) { .prop-section { padding: 64px 24px; } }
        .prop-rule { display:block; width:40px; height:1px; background:${C.accent}; margin:0 0 24px 0; border:0; }
        .prop-rule-center { margin-left:auto; margin-right:auto; }
        .faq-plus { transition: transform 0.25s ease; display:inline-block; }
        .faq-plus.open { transform: rotate(45deg); }
        .tier-btn:hover { opacity: 0.88; }
        a { color: inherit; }
      `}</style>

      {/* SECTION 1 — HERO */}
      <section
        style={{
          background: C.dark,
          color: C.textLight,
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "96px 24px",
          position: "relative",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            For {FIRST_NAME} {LAST_NAME}
          </h1>
          <p
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: "clamp(18px, 2.5vw, 24px)",
              color: C.mutedWhite,
              marginTop: 24,
              fontWeight: 400,
            }}
          >
            {EVENT_TYPE} — {EVENT_DATE}
          </p>
          {VENUE && VENUE !== "{{VENUE}}" && (
            <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 18, color: C.mutedWhite, marginTop: 8 }}>
              {VENUE}
            </p>
          )}
        </div>
        <div
          style={{
            marginTop: 80,
            fontFamily: sans,
            fontSize: 12,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: C.accent,
            fontVariant: "small-caps",
          }}
        >
          White Rabbit LA
        </div>
      </section>

      {/* SECTION 2 — THE LETTER */}
      <section className="prop-section" style={{ background: C.light }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontFamily: serif, fontSize: 20, lineHeight: 1.8, color: C.textDark }}>
            <p style={{ marginTop: 0 }}>{FIRST_NAME},</p>
            <p>Thank you for the time on the phone — I enjoyed it more than you know.</p>
            <p>
              What follows isn't a price sheet. It's a proposal for the night you described, written specifically for
              you. Three options, each one designed around what you told me you're building. The middle option is the
              one I'd recommend — it's the right shape for your evening — but the others are real, and the choice is
              yours.
            </p>
            <p>
              If anything here doesn't sit right, call me. <a href="tel:+14243941850">(424) 394-1850</a>. We'll work it
              out.
            </p>
            <p>Looking forward to it.</p>
            <p style={{ fontStyle: "italic", paddingLeft: 24, marginBottom: 0 }}>Scott</p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHAT WE'RE BUILDING */}
      <section className="prop-section" style={{ background: C.light, paddingTop: 0 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <hr className="prop-rule" />
          <h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 36, margin: "0 0 32px 0" }}>Your Night</h2>
          <p style={{ fontFamily: serif, fontSize: 20, lineHeight: 1.8, color: C.textDark, margin: 0 }}>
            {WHAT_WERE_BUILDING_PARAGRAPH}
          </p>
        </div>
      </section>

      {/* SECTION 4 — TIMELINE */}
      <section className="prop-section" style={{ background: C.light, paddingTop: 0 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <hr className="prop-rule" />
          <h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 36, margin: "0 0 48px 0" }}>Your Evening</h2>
          <div style={{ position: "relative", paddingLeft: 32, borderLeft: `1px solid ${C.accent}` }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ marginBottom: i === timeline.length - 1 ? 0 : 40 }}>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.textDark, marginBottom: 6 }}>{t.time}</div>
                <div style={{ fontFamily: sans, fontSize: 16, color: C.textDark, lineHeight: 1.7 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: serif, fontStyle: "italic", color: C.muted, marginTop: 48, fontSize: 17 }}>
            Times shift to fit your night — this is the shape of it.
          </p>
        </div>
      </section>

      {/* SECTION 5 — THREE TIERS */}
      <section className="prop-section" style={{ background: C.dark, color: C.textLight }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
              alignItems: "stretch",
            }}
          >
            {tiers.map((tier, i) => {
              const rec = tier.recommended;
              return (
                <div
                  key={i}
                  style={{
                    border: rec ? `1px solid ${C.accent}` : `1px solid rgba(250,250,247,0.12)`,
                    padding: rec ? 48 : 36,
                    background: C.dark,
                    display: "flex",
                    flexDirection: "column",
                    transform: rec ? "translateY(-8px)" : "none",
                    borderRadius: 2,
                  }}
                >
                  {rec && (
                    <div
                      style={{
                        fontFamily: sans,
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: C.accent,
                        marginBottom: 24,
                      }}
                    >
                      Recommended for your night
                    </div>
                  )}
                  <h3 style={{ fontFamily: serif, fontWeight: 500, fontSize: 32, margin: "0 0 12px 0", lineHeight: 1.2 }}>
                    {tier.name}
                  </h3>
                  <p style={{ fontFamily: serif, fontStyle: "italic", color: C.mutedWhite, fontSize: 17, marginBottom: 28 }}>
                    {tier.tagline}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", flex: 1 }}>
                    {tier.items.map((it, j) => (
                      <li
                        key={j}
                        style={{
                          fontFamily: sans,
                          fontSize: 15,
                          color: C.textLight,
                          marginBottom: 12,
                          lineHeight: 1.6,
                        }}
                      >
                        — {it}
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontFamily: serif, fontSize: 40, fontWeight: 400, marginBottom: 24 }}>{tier.price}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 — FAQ */}
      <section className="prop-section" style={{ background: C.light }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <hr className="prop-rule" />
          <h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 36, margin: "0 0 48px 0" }}>
            A Few Questions Before You Decide
          </h2>
          <div>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} style={{ borderBottom: `1px solid ${C.accent}` }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: 0,
                      padding: "24px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left",
                      color: C.textDark,
                      gap: 24,
                    }}
                  >
                    <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, lineHeight: 1.3 }}>{f.q}</span>
                    <span
                      className={`faq-plus ${open ? "open" : ""}`}
                      style={{ fontFamily: serif, fontSize: 24, color: C.accent, flexShrink: 0 }}
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <div
                      style={{
                        fontFamily: sans,
                        fontSize: 17,
                        lineHeight: 1.7,
                        color: C.muted,
                        padding: "0 0 28px 0",
                        maxWidth: 640,
                      }}
                    >
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7 — RESERVE */}
      <section className="prop-section" style={{ background: C.dark, color: C.textLight, textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: "clamp(36px, 5vw, 48px)", margin: "0 0 32px 0" }}>
            Reserving the Date
          </h2>
          <div style={{ maxWidth: 600, margin: "0 auto", fontFamily: sans, fontSize: 18, lineHeight: 1.8 }}>
            <p>
              Once you've chosen a tier, the next step is simple. A 50% deposit holds your date and locks the booking.
              The remaining 50% is due the day before the event.
            </p>
            <p>
              This proposal — and the date — is held for 14 days from today. After that, the date returns to the
              calendar.
            </p>
            <p>Click below to reserve via secure invoice.</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginTop: 56,
              maxWidth: 900,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {tiers.map((tier, i) => {
              const rec = tier.recommended;
              return (
                <a
                  key={i}
                  href={tier.href}
                  className="tier-btn"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    background: rec ? C.accent : "transparent",
                    color: C.textLight,
                    border: rec ? `1px solid ${C.accent}` : `1px solid ${C.textLight}`,
                    padding: rec ? "28px 24px" : "24px",
                    fontFamily: sans,
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    borderRadius: 2,
                    transition: "opacity 0.2s",
                  }}
                >
                  {tier.cta}
                </a>
              );
            })}
          </div>

          <p style={{ marginTop: 48, fontFamily: sans, fontSize: 15, color: C.mutedWhite }}>
            Prefer to talk it through? Call or text me directly:{" "}
            <a href="tel:+14243941850" style={{ color: C.mutedWhite }}>
              (424) 394-1850
            </a>
          </p>
        </div>
      </section>

      {/* SECTION 8 — PROOF */}
      <section className="prop-section" style={{ background: C.light, textAlign: "center" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20, color: C.muted, marginBottom: 48 }}>
            A few of the rooms we've worked.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 40,
              opacity: 0.6,
            }}
          >
            {logos.map((logo) => (
              <div
                key={logo}
                style={{
                  fontFamily: serif,
                  fontSize: 22,
                  color: C.textDark,
                  filter: "grayscale(1)",
                  letterSpacing: "0.02em",
                }}
              >
                {logo}
              </div>
            ))}
          </div>

          <div style={{ height: 64 }} />

          <blockquote
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: 22,
              lineHeight: 1.6,
              color: C.textDark,
              maxWidth: 540,
              margin: "0 auto",
            }}
          >
            "The conversations our guests had on the way out were the conversations they were still having on Monday.
            Scott didn't perform for us — he became part of the night."
          </blockquote>
          <p style={{ fontFamily: sans, fontSize: 15, color: C.muted, marginTop: 24 }}>
            — Sarah M., Director of Brand Events
          </p>
        </div>
      </section>

      {/* SECTION 9 — CLOSING */}
      <section
        style={{
          background: C.light,
          textAlign: "center",
          padding: "128px 24px",
        }}
      >
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 24, fontWeight: 400, color: C.textDark, margin: 0 }}>
          In your presence is fullness of joy.
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: 14,
            color: C.muted,
            letterSpacing: "0.15em",
            marginTop: 12,
          }}
        >
          — Psalm 16:11
        </p>
        <div style={{ height: 80 }} />
        <p style={{ fontFamily: serif, fontSize: 22, color: C.textDark, margin: 0 }}>Scott Syme</p>
        <p style={{ fontFamily: sans, fontStyle: "italic", fontSize: 16, color: C.muted, marginTop: 4 }}>Magician</p>
        <p style={{ fontFamily: sans, fontSize: 16, color: C.textDark, marginTop: 16 }}>
          <a href="tel:+14243941850" style={{ textDecoration: "none" }}>
            (424) 394-1850
          </a>
        </p>
        <p style={{ fontFamily: sans, fontSize: 16, color: C.textDark, marginTop: 4 }}>
          <a href="https://whiterabbitla.com" style={{ textDecoration: "none" }}>
            whiterabbitla.com
          </a>
        </p>
      </section>
    </div>
  );
};

export default ProposalTemplate;
