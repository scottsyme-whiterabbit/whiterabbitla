import { useEffect, useState } from "react";
import { Phone, Plus } from "lucide-react";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import threeStars from "@/assets/three-stars-gold.png";

// Client logos
import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import rivianLogo from "@/assets/logos/rivian.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import paramountLogo from "@/assets/logos/paramount.png";
import sohohouseLogo from "@/assets/logos/sohohouse-new.png";
import beverlyHiltonLogo from "@/assets/logos/beverlyhilton.png";

/* ============================================================
   PROPOSAL — PERSONALIZATION VARIABLES
   Edit these per lead. That's it.
   ============================================================ */
const FIRST_NAME = "{{FIRST_NAME}}";
const LAST_NAME = "{{LAST_NAME}}";
const EVENT_TYPE = "{{EVENT_TYPE}}"; // "Wedding" | "Corporate Event" | "Private Event"
const EVENT_DATE = "{{EVENT_DATE}}"; // e.g. "June 14, 2026"
const VENUE = "{{VENUE}}";
const WHAT_WERE_BUILDING_PARAGRAPH = "{{WHAT_WERE_BUILDING_PARAGRAPH}}";

const SQUARE_LINK_TIER_1 = "{{SQUARE_LINK_TIER_1}}";
const SQUARE_LINK_TIER_2 = "{{SQUARE_LINK_TIER_2}}";
const SQUARE_LINK_TIER_3 = "{{SQUARE_LINK_TIER_3}}";
/* ============================================================ */

const timeline = [
  { time: "6:30 PM", desc: "I arrive, set quietly, full environment built before guests arrive." },
  { time: "7:30 PM", desc: "Greeting every guest as they walk in." },
  { time: "8:45 PM", desc: "40-minute parlor experience after dinner." },
  { time: "9:30 PM", desc: "I stay through dessert, walk out last." },
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
    tagline: "Parlor at rehearsal dinner + cocktail hour the next day",
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
    a: "For close-up walk-around, none — I move through the room. For the parlor experience, anywhere a host can comfortably gather their guests works: a living room, a private dining room, a lounge, or a tented space outdoors. I'll walk you through the setup a week ahead so the room is ready and you don't have to think about it.",
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

const logos = [
  { name: "Netflix", src: netflixLogo },
  { name: "Disney", src: disneyLogo },
  { name: "Morgan Stanley", src: morganstanleyLogo },
  { name: "Rivian", src: rivianLogo },
  { name: "Rolls-Royce", src: rollsroyceLogo },
  { name: "Paramount", src: paramountLogo },
  { name: "Soho House", src: sohohouseLogo },
  { name: "The Beverly Hilton", src: beverlyHiltonLogo },
];

const ProposalTemplate = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = `Proposal — ${FIRST_NAME} ${LAST_NAME} — White Rabbit LA`;
  }, []);

  return (
    <div className="bg-cream text-forest-dark font-sans">
      {/* HERO */}
      <section className="relative bg-forest-dark text-cream overflow-hidden">
        <div className="hero-wisp hero-wisp-1" />
        <div className="hero-wisp hero-wisp-2" />
        <div className="hero-wisp hero-wisp-3" />

        <div className="relative max-w-4xl mx-auto px-6 py-32 md:py-40 text-center flex flex-col items-center">
          <img src={threeStars} alt="" className="w-12 md:w-14 mb-10 opacity-90" />
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-gold mb-8">A Proposal Prepared For</p>
          <h1 className="font-serif font-light text-5xl md:text-7xl leading-tight tracking-tight">
            {FIRST_NAME} {LAST_NAME}
          </h1>
          <div className="mt-10 w-20 h-px bg-gold/60" />
          <p className="font-serif italic text-xl md:text-2xl text-cream/80 mt-10">
            {EVENT_TYPE} · {EVENT_DATE}
          </p>
          {VENUE && VENUE !== "{{VENUE}}" && (
            <p className="font-serif italic text-base md:text-lg text-cream/60 mt-2">{VENUE}</p>
          )}
          <p className="absolute bottom-8 left-0 right-0 text-[11px] tracking-[0.4em] uppercase text-cream/50">
            White Rabbit LA
          </p>
        </div>
      </section>

      {/* THE LETTER */}
      <section className="bg-cream py-24 md:py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <OrnamentalDivider />
          <div className="font-serif text-lg md:text-xl leading-loose text-forest-dark space-y-6 mt-10">
            <p>{FIRST_NAME},</p>
            <p>Thank you for the time on the phone — I enjoyed it more than you know.</p>
            <p>
              What follows isn't a price sheet. It's a proposal for the night you described, written specifically for
              you. Three options, each one designed around what you told me you're building. The middle option is the
              one I'd recommend — it's the right shape for your evening — but the others are real, and the choice is
              yours.
            </p>
            <p>
              If anything here doesn't sit right, call me.{" "}
              <a href="tel:+14243941850" className="text-forest underline-offset-4 hover:underline">
                (424) 394-1850
              </a>
              . We'll work it out.
            </p>
            <p>Looking forward to it.</p>
            <p className="italic pl-6 mb-0">Scott</p>
          </div>
        </div>
      </section>

      {/* YOUR NIGHT */}
      <section className="bg-cream pb-24 md:pb-32 px-6">
        <div className="max-w-2xl mx-auto">
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-4xl md:text-5xl text-forest-dark mt-10 mb-10 text-center">
            Your Night
          </h2>
          <p className="font-serif text-lg md:text-xl leading-loose text-forest-dark/90">
            {WHAT_WERE_BUILDING_PARAGRAPH}
          </p>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-cream pb-24 md:pb-32 px-6">
        <div className="max-w-2xl mx-auto">
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-4xl md:text-5xl text-forest-dark mt-10 mb-12 text-center">
            Your Evening
          </h2>
          <div className="relative pl-8 border-l border-gold/40">
            {timeline.map((t, i) => (
              <div key={i} className={i === timeline.length - 1 ? "" : "mb-12"}>
                <div className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-gold mt-2" />
                <div className="font-serif text-2xl md:text-3xl text-forest-dark mb-2">{t.time}</div>
                <div className="text-base md:text-lg text-forest-dark/75 leading-relaxed">{t.desc}</div>
              </div>
            ))}
          </div>
          <p className="font-serif italic text-center text-forest-dark/60 mt-12 text-base">
            Times shift to fit your night — this is the shape of it.
          </p>
        </div>
      </section>

      {/* TIERS */}
      <section className="bg-forest-dark text-cream py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-gold text-center mb-4">Three Options</p>
          <h2 className="font-serif font-light text-4xl md:text-5xl text-cream text-center mb-16">
            Choose Your Evening
          </h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {tiers.map((tier, i) => {
              const rec = tier.recommended;
              return (
                <div
                  key={i}
                  className={`flex flex-col p-8 md:p-10 transition-all ${
                    rec
                      ? "bg-cream/[0.04] border border-gold md:-translate-y-4"
                      : "border border-cream/10"
                  }`}
                >
                  {rec && (
                    <div className="text-[10px] tracking-[0.25em] uppercase text-gold mb-6">
                      Recommended for your night
                    </div>
                  )}
                  <h3 className="font-serif font-light text-2xl md:text-3xl leading-tight mb-3">{tier.name}</h3>
                  <p className="font-serif italic text-cream/70 mb-8 text-base md:text-lg">{tier.tagline}</p>
                  <div className="w-10 h-px bg-gold/60 mb-8" />
                  <ul className="space-y-3 flex-1 mb-8 text-sm md:text-base text-cream/85 leading-relaxed">
                    {tier.items.map((it, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="text-gold mt-1.5 text-xs">✦</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="font-serif text-4xl md:text-5xl font-light mb-6">{tier.price}</div>
                  <a
                    href={tier.href}
                    className={`block text-center py-4 px-6 text-sm tracking-[0.15em] uppercase font-medium transition-opacity hover:opacity-85 ${
                      rec
                        ? "bg-gold text-forest-dark"
                        : "border border-cream/40 text-cream"
                    }`}
                  >
                    Reserve
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROOF — LOGOS */}
      <section className="bg-cream py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <OrnamentalDivider />
          <p className="font-serif italic text-xl text-forest-dark/70 mt-10 mb-12">
            A few of the rooms we've worked.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-10 gap-y-12 items-center">
            {logos.map((logo) => (
              <div key={logo.name} className="flex items-center justify-center">
                <img
                  src={logo.src}
                  alt={logo.name}
                  loading="lazy"
                  className="max-h-10 md:max-h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                  style={{ filter: "grayscale(100%)" }}
                />
              </div>
            ))}
          </div>

          <div className="mt-20 max-w-2xl mx-auto">
            <blockquote className="font-serif italic text-xl md:text-2xl leading-relaxed text-forest-dark">
              "The conversations our guests had on the way out were the conversations they were still having on Monday.
              Scott didn't perform for us — he became part of the night."
            </blockquote>
            <p className="text-sm tracking-[0.15em] uppercase text-forest-dark/60 mt-6">
              Sarah M. · Director of Brand Events
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream pb-24 md:pb-32 px-6">
        <div className="max-w-3xl mx-auto">
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-4xl md:text-5xl text-forest-dark text-center mt-10 mb-14">
            A Few Questions Before You Decide
          </h2>
          <div className="divide-y divide-gold/25 border-t border-b border-gold/25">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex justify-between items-center text-left py-6 gap-6 group"
                  >
                    <span className="font-serif text-lg md:text-xl text-forest-dark group-hover:text-forest transition-colors">
                      {f.q}
                    </span>
                    <Plus
                      className={`w-5 h-5 text-gold flex-shrink-0 transition-transform duration-300 ${
                        open ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="text-base md:text-lg text-forest-dark/75 leading-relaxed pb-6 pr-10">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RESERVE */}
      <section className="bg-forest-dark text-cream py-24 md:py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-gold mb-6">Reserving the Date</p>
          <h2 className="font-serif font-light text-4xl md:text-5xl mb-10">When You're Ready</h2>
          <div className="font-serif text-lg md:text-xl leading-loose text-cream/80 max-w-2xl mx-auto space-y-5">
            <p>
              A 50% deposit holds your date and locks the booking. The remaining 50% is due the day before the event.
            </p>
            <p>
              This proposal — and the date — is held for 14 days from today. After that, the date returns to the
              calendar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-14 max-w-4xl mx-auto">
            {tiers.map((tier, i) => {
              const rec = tier.recommended;
              return (
                <a
                  key={i}
                  href={tier.href}
                  className={`block py-5 px-6 text-sm tracking-[0.1em] uppercase font-medium transition-opacity hover:opacity-85 ${
                    rec ? "bg-gold text-forest-dark" : "border border-cream/40 text-cream"
                  }`}
                >
                  {tier.cta}
                </a>
              );
            })}
          </div>

          <div className="mt-16 flex items-center justify-center gap-2 text-cream/70">
            <Phone className="w-4 h-4 text-gold" />
            <span className="text-sm">Prefer to talk it through?</span>
            <a href="tel:+14243941850" className="text-cream hover:text-gold transition-colors text-sm font-medium">
              (424) 394-1850
            </a>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="bg-cream text-center py-32 px-6">
        <img src={threeStars} alt="" className="w-10 mx-auto mb-10 opacity-70" />
        <p className="font-serif italic text-2xl md:text-3xl text-forest-dark">
          In your presence is fullness of joy.
        </p>
        <p className="text-xs tracking-[0.3em] uppercase text-forest-dark/50 mt-4">Psalm 16:11</p>
        <div className="h-20" />
        <p className="font-serif text-2xl text-forest-dark">Scott Syme</p>
        <p className="font-serif italic text-base text-forest-dark/60 mt-1">Magician</p>
        <div className="mt-6 space-y-1 text-sm text-forest-dark">
          <p>
            <a href="tel:+14243941850" className="hover:text-forest transition-colors">
              (424) 394-1850
            </a>
          </p>
          <p>
            <a href="https://whiterabbitla.com" className="hover:text-forest transition-colors">
              whiterabbitla.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProposalTemplate;
