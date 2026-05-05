import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Plus } from "lucide-react";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import threeStars from "@/assets/three-stars-gold.png";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import rivianLogo from "@/assets/logos/rivian.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import paramountLogo from "@/assets/logos/paramount.png";
import sohohouseLogo from "@/assets/logos/sohohouse-new.png";
import beverlyHiltonLogo from "@/assets/logos/beverlyhilton.png";

import heroWedding from "@/assets/service-wedding-hero.jpg";
import heroCorporate from "@/assets/experience-corporate.jpg";
import heroPrivate from "@/assets/experience-private.jpg";
import heroParlor from "@/assets/experience-parlor.jpg";
import heroCocktail from "@/assets/event-closeup-cocktail.jpg";
import heroEvening from "@/assets/hero-white-rabbit-evening.jpg";

import flourishCorner from "@/assets/proposal-flourish-corner.png";
import photoReaction from "@/assets/events/proposal-closeup-action.jpg";
import photoCardsDetail from "@/assets/event-cards-detail.jpg";
import photoParlorAudience from "@/assets/event-parlor-audience.jpg";
import photoScottBw from "@/assets/event-scott-bw-stage.jpg";

import luncheon1512 from "@/assets/events/ladies-luncheon-1512.jpg";
import luncheon1515 from "@/assets/events/ladies-luncheon-1515.jpg";
import luncheon1520 from "@/assets/events/ladies-luncheon-1520.jpg";
import luncheon1535 from "@/assets/events/ladies-luncheon-1535.jpg";
import luncheon1539 from "@/assets/events/ladies-luncheon-1539.jpg";
import luncheon1549 from "@/assets/events/ladies-luncheon-1549.jpg";
import luncheon1559 from "@/assets/events/ladies-luncheon-1559.jpg";

import proposalHeroLuncheon from "@/assets/events/proposal-hero-luncheon.jpg";
import heroMain from "@/assets/hero-magic-cinematic.jpg";

const galleryPhotos = [luncheon1549, photoParlorAudience, photoCardsDetail];

const HERO_MAP: Record<string, string> = {
  wedding: heroMain,
  corporate: heroMain,
  private: heroMain,
  parlor: heroMain,
  cocktail: heroMain,
  evening: heroMain,
};

export const HERO_OPTIONS = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "private", label: "Private Event" },
  { value: "parlor", label: "Parlor" },
  { value: "cocktail", label: "Cocktail" },
  { value: "evening", label: "Evening (dark)" },
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

export interface Tier {
  name: string;
  tagline: string;
  items: string[];
  price: string;
  href: string;
  cta: string;
  recommended?: boolean;
}
export interface TimelineItem { time: string; desc: string; }
export interface FaqItem { q: string; a: string; }

export interface ProposalData {
  first_name: string;
  last_name: string;
  recipient_email?: string | null;
  event_type: string;
  event_date: string;
  venue?: string | null;
  intro_paragraph: string;
  hero_image: string;
  timeline: TimelineItem[];
  tiers: Tier[];
  faqs: FaqItem[];
  closing_quote?: string | null;
  closing_attribution?: string | null;
}

interface Props {
  data?: ProposalData;
  preview?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const DEFAULT_PROPOSAL: ProposalData = {
  first_name: "Friend",
  last_name: "",
  event_type: "Wedding",
  event_date: "",
  venue: "",
  intro_paragraph:
    "What you described isn't a magic act dropped into your evening — it's an entire texture woven through the night. Quiet conversation that turns into wide-eyed silence, then laughter, then the kind of story your guests will still be telling on Monday.",
  hero_image: "wedding",
  timeline: [
    { time: "6:30 PM", desc: "I arrive, set quietly, full environment built before guests arrive." },
    { time: "7:30 PM", desc: "Greeting every guest as they walk in." },
    { time: "8:45 PM", desc: "40-minute parlor experience after dinner." },
    { time: "9:30 PM", desc: "I stay through dessert, walk out last." },
  ],
  tiers: [
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
      href: "",
      cta: "Reserve Cocktail Hour",
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
      ],
      price: "$3,500",
      href: "",
      cta: "Reserve Wedding Experience",
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
      ],
      price: "$5,500",
      href: "",
      cta: "Reserve Estate Experience",
    },
  ],
  faqs: [
    { q: "How much space do you need?", a: "For close-up walk-around, none — I move through the room. For the parlor experience, anywhere a host can comfortably gather their guests works. I'll walk you through setup a week ahead." },
    { q: "What if a guest doesn't want to participate?", a: "No one is ever pulled in who doesn't want to be. The night is built around making your guests feel hosted, not put on the spot." },
    { q: "Do you need a stage, microphone, or special lighting?", a: "For most rooms, no. I bring everything I need — including soft lighting and a discreet sound system if the space calls for it." },
    { q: "What's your weather contingency for outdoor events?", a: "We move indoors. I'll work with your planner on the indoor backup so it's ready before it's needed." },
    { q: "How early do you arrive?", a: "For close-up walk-around, an hour before guests. For the full parlor experience, two hours." },
    { q: "Do you travel?", a: "Yes. Standard pricing covers Los Angeles County. For destination events, travel and lodging are added." },
    { q: "What happens after I reserve the date?", a: "A 50% deposit holds your date. The remaining 50% is due the day before. Two weeks before, we hop on a final call to walk through the night together." },
  ],
  closing_quote: "An evening built with intention. A night your guests will remember.",
  closing_attribution: "",
};

export const ProposalView = ({ data }: { data: ProposalData }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroSrc = HERO_MAP[data.hero_image] || HERO_MAP.wedding;
  const fullName = `${data.first_name} ${data.last_name}`.trim();

  // Corner flourishes — currently disabled
  const Flourishes = (_: { tone?: "gold" | "cream"; size?: "sm" | "md" | "lg" }) => null;

  return (
    <div className="bg-cream text-forest-dark font-sans">
      {/* HERO */}
      <section className="relative bg-forest-dark text-cream overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroSrc} alt="" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/70 via-forest-dark/55 to-forest-dark/90" />
        </div>
        <Flourishes size="lg" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center flex flex-col items-center opacity-100">
          <img src={threeStars} alt="" className="w-12 md:w-14 mb-6 opacity-90" />
          <p className="text-[11px] md:text-xs tracking-[0.4em] uppercase text-gold mb-6">A Proposal Prepared For</p>
          <h1 className="font-serif font-light text-5xl md:text-7xl leading-tight tracking-tight">{fullName}</h1>
          <div className="flex items-center gap-3 mt-6">
            <span className="w-10 h-px bg-gold/60" />
            <span className="text-gold text-xs">✦</span>
            <span className="w-10 h-px bg-gold/60" />
          </div>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase text-cream/80 mt-6">
            {data.event_type}{data.event_date ? ` · ${data.event_date}` : ""}
          </p>
          {data.venue && (
            <p className="font-sans text-sm text-cream/60 mt-2">{data.venue}</p>
          )}
          <p className="mt-10 text-[11px] tracking-[0.4em] uppercase text-cream/50">White Rabbit LA</p>
        </div>
      </section>

      {/* LETTER */}
      <section className="relative bg-cream py-16 md:py-20 px-6">
        <Flourishes size="sm" />
        <div className="max-w-2xl mx-auto">
          <OrnamentalDivider />
          <div className="font-sans text-base md:text-lg leading-relaxed text-forest-dark space-y-5 mt-8">
            <p className="font-serif text-xl md:text-2xl text-forest">{data.first_name},</p>
            <p>Thank you for the time on the phone — I enjoyed it more than you know.</p>
            <p>
              What follows isn't a price sheet. It's a proposal for the night you described, written specifically for you.
              Three options, each one designed around what you told me you're building. The middle option is the one I'd
              recommend — it's the right shape for your evening — but the others are real, and the choice is yours.
            </p>
            <p>
              If anything here doesn't sit right, call me.{" "}
              <a href="tel:+14243941850" className="text-forest underline-offset-4 hover:underline">(424) 394-1850</a>.
              We'll work it out.
            </p>
            <p>Looking forward to it.</p>
            <p className="font-serif text-2xl pl-2 mb-0 text-forest">— Scott</p>
          </div>
        </div>
      </section>

      {/* PHOTO BREAK 1 */}
      <section className="relative bg-forest-dark py-12 md:py-16 px-4">
        <div className="text-center mb-8">
          <span className="text-gold text-lg">✦</span>
        </div>

        {/* Gallery grid */}
        <div className="max-w-5xl mx-auto mt-10 grid grid-cols-3 gap-3 md:gap-4">
          {galleryPhotos.map((src, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden bg-forest-dark/60">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </section>

      {/* YOUR NIGHT */}
      <section className="relative bg-cream py-16 md:py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">Your Night</p>
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-4xl md:text-5xl text-forest-dark mt-6 mb-8">An Evening, Composed</h2>
          <p className="font-sans text-base md:text-lg leading-relaxed text-forest-dark/85 whitespace-pre-wrap text-left">{data.intro_paragraph}</p>
        </div>
      </section>

      {/* TIMELINE */}
      {data.timeline.length > 0 && (
        <section className="relative bg-cream pb-16 md:pb-24 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">The Shape of It</p>
              <h2 className="font-serif font-light text-3xl md:text-4xl text-forest-dark">Your Evening, Hour by Hour</h2>
            </div>
            <div className="relative pl-8 border-l border-gold/40">
              {data.timeline.map((t, i) => (
                <div key={i} className={i === data.timeline.length - 1 ? "" : "mb-8"}>
                  <div className="absolute -left-[6px] w-3 h-3 rounded-full bg-gold mt-2 ring-4 ring-cream" />
                  <div className="font-serif text-2xl md:text-3xl text-forest-dark mb-1">{t.time}</div>
                  <div className="text-base text-forest-dark/75 leading-relaxed">{t.desc}</div>
                </div>
              ))}
            </div>
            <p className="font-sans text-center text-forest-dark/55 mt-8 text-xs tracking-[0.2em] uppercase">Times shift to fit your night</p>
          </div>
        </section>
      )}

      {/* PHOTO BREAK 2 — split */}
      <section className="grid grid-cols-2 bg-forest-dark">
        <div className="aspect-[4/5] md:aspect-[5/4] overflow-hidden">
          <img src={photoCardsDetail} alt="" className="w-full h-full object-cover object-center" />
        </div>
        <div className="aspect-[4/5] md:aspect-[5/4] overflow-hidden">
          <img src={photoParlorAudience} alt="" className="w-full h-full object-cover object-top" />
        </div>
      </section>

      {/* TIERS */}
      <section className="relative bg-forest-dark text-cream py-16 md:py-24 px-6 overflow-hidden">
        <Flourishes tone="cream" size="md" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">Three Options</p>
            <h2 className="font-serif font-light text-4xl md:text-5xl text-cream mb-3">Choose Your Evening</h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="w-8 h-px bg-gold/50" />
              <span className="text-gold text-xs">✦</span>
              <span className="w-8 h-px bg-gold/50" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
            {data.tiers.map((tier, i) => {
              const rec = tier.recommended;
              return (
                <div key={i} className={`relative flex flex-col p-7 md:p-8 transition-all ${rec ? "bg-cream/[0.05] border border-gold md:-translate-y-3 shadow-xl shadow-black/30" : "border border-cream/15"}`}>
                  <span className="absolute top-0 left-0 w-4 h-px bg-gold/70" />
                  <span className="absolute top-0 left-0 w-px h-4 bg-gold/70" />
                  <span className="absolute top-0 right-0 w-4 h-px bg-gold/70" />
                  <span className="absolute top-0 right-0 w-px h-4 bg-gold/70" />
                  <span className="absolute bottom-0 left-0 w-4 h-px bg-gold/70" />
                  <span className="absolute bottom-0 left-0 w-px h-4 bg-gold/70" />
                  <span className="absolute bottom-0 right-0 w-4 h-px bg-gold/70" />
                  <span className="absolute bottom-0 right-0 w-px h-4 bg-gold/70" />
                  {rec && <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-4">✦ Recommended ✦</div>}
                  <h3 className="font-serif font-light text-2xl md:text-3xl leading-tight mb-2">{tier.name}</h3>
                  <p className="font-sans text-cream/65 mb-5 text-sm">{tier.tagline}</p>
                  <div className="w-10 h-px bg-gold/60 mb-5" />
                  <ul className="space-y-2.5 flex-1 mb-6 text-sm text-cream/85 leading-relaxed">
                    {tier.items.map((it, j) => (
                      <li key={j} className="flex gap-2.5"><span className="text-gold mt-1 text-[10px]">✦</span><span>{it}</span></li>
                    ))}
                  </ul>
                  <div className="font-serif text-4xl md:text-5xl font-light mb-5">{tier.price}</div>
                  {tier.href ? (
                    <a href={tier.href} target="_blank" rel="noopener noreferrer" className={`block text-center py-3.5 px-6 text-xs tracking-[0.2em] uppercase font-medium transition-all hover:opacity-85 ${rec ? "bg-gold text-forest-dark" : "border border-cream/40 text-cream hover:border-gold hover:text-gold"}`}>Reserve</a>
                  ) : (
                    <div className={`block text-center py-3.5 px-6 text-xs tracking-[0.2em] uppercase font-medium opacity-50 ${rec ? "bg-gold text-forest-dark" : "border border-cream/40 text-cream"}`}>Reserve</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="relative bg-cream py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">In Good Company</p>
          <OrnamentalDivider />
          <p className="font-sans text-sm md:text-base text-forest-dark/65 mt-6 mb-10">A few of the rooms we've worked.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-8 items-center">
            {logos.map((logo) => (
              <div key={logo.name} className="flex items-center justify-center">
                <img src={logo.src} alt={logo.name} loading="lazy" className="max-h-9 md:max-h-11 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" style={{ filter: "grayscale(100%)" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO BREAK 3 */}
      <section className="relative h-56 md:h-80 overflow-hidden bg-forest-dark">
        <img src={photoScottBw} alt="" className="w-full h-full object-cover object-top opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/40 via-transparent to-forest-dark" />
      </section>

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section className="relative bg-cream py-16 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">Before You Decide</p>
              <h2 className="font-serif font-light text-3xl md:text-4xl text-forest-dark">A Few Questions</h2>
            </div>
            <div className="divide-y divide-gold/25 border-t border-b border-gold/25">
              {data.faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i}>
                    <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex justify-between items-center text-left py-5 gap-6 group">
                      <span className="font-serif text-lg md:text-xl text-forest-dark group-hover:text-forest transition-colors">{f.q}</span>
                      <Plus className={`w-5 h-5 text-gold flex-shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
                    </button>
                    {open && <div className="text-base text-forest-dark/75 leading-relaxed pb-5 pr-10">{f.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* RESERVE */}
      <section className="relative bg-forest-dark text-cream py-16 md:py-24 px-6 text-center overflow-hidden">
        <Flourishes tone="cream" size="md" />
        <div className="max-w-3xl mx-auto relative">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">Reserving the Date</p>
          <h2 className="font-serif font-light text-4xl md:text-5xl mb-3">When You're Ready</h2>
          <div className="flex items-center justify-center gap-3 mt-4 mb-8">
            <span className="w-10 h-px bg-gold/60" />
            <span className="text-gold text-xs">✦</span>
            <span className="w-10 h-px bg-gold/60" />
          </div>
          <div className="font-sans text-base leading-relaxed text-cream/80 max-w-2xl mx-auto space-y-4">
            <p>A 50% deposit holds your date and locks the booking. The remaining 50% is due the day before the event.</p>
            <p>This proposal — and the date — is held for 14 days from today.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-10 max-w-4xl mx-auto">
            {data.tiers.map((tier, i) => {
              const rec = tier.recommended;
              if (!tier.href) return null;
              return (
                <a key={i} href={tier.href} target="_blank" rel="noopener noreferrer" className={`block py-4 px-5 text-xs tracking-[0.15em] uppercase font-medium transition-opacity hover:opacity-85 ${rec ? "bg-gold text-forest-dark" : "border border-cream/40 text-cream hover:border-gold hover:text-gold"}`}>
                  {tier.cta} — {tier.price}
                </a>
              );
            })}
          </div>
          <div className="mt-12 flex items-center justify-center gap-2 text-cream/70">
            <Phone className="w-4 h-4 text-gold" />
            <span className="text-sm">Prefer to talk it through?</span>
            <a href="tel:+14243941850" className="text-cream hover:text-gold transition-colors text-sm font-medium">(424) 394-1850</a>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative bg-cream text-center py-20 px-6">
        <Flourishes size="sm" />
        <img src={threeStars} alt="" className="w-10 mx-auto mb-6 opacity-70" />
        {data.closing_quote && (
          <p className="font-serif text-2xl md:text-3xl text-forest-dark max-w-2xl mx-auto leading-relaxed">{data.closing_quote}</p>
        )}
        {data.closing_attribution && (
          <p className="text-xs tracking-[0.3em] uppercase text-forest-dark/50 mt-3">{data.closing_attribution}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-10 mb-6">
          <span className="w-10 h-px bg-gold/60" />
          <span className="text-gold">✦</span>
          <span className="w-10 h-px bg-gold/60" />
        </div>
        <p className="font-serif text-2xl text-forest-dark">Scott Syme</p>
        <p className="font-sans text-xs text-forest-dark/60 mt-1 tracking-[0.25em] uppercase">Magician</p>
        <div className="mt-5 space-y-1 text-sm text-forest-dark">
          <p><a href="tel:+14243941850" className="hover:text-forest transition-colors">(424) 394-1850</a></p>
          <p><a href="https://whiterabbitla.com" className="hover:text-forest transition-colors">whiterabbitla.com</a></p>
        </div>
      </section>
    </div>
  );
};

const ProposalTemplate = ({ data: dataProp, preview }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ProposalData | null>(dataProp || (preview ? DEFAULT_PROPOSAL : null));
  const [loading, setLoading] = useState(!dataProp && !preview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataProp || preview) {
      if (dataProp) setData(dataProp);
      return;
    }
    if (!slug) {
      // fallback to default for /proposals/template route
      setData(DEFAULT_PROPOSAL);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/proposals-api?action=get&slug=${encodeURIComponent(slug)}`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed to load");
        setData(j.proposal);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, dataProp, preview]);

  useEffect(() => {
    if (data) {
      document.title = `Proposal — ${data.first_name} ${data.last_name} — White Rabbit LA`;
    }
  }, [data]);

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center text-forest-dark/60">Loading proposal…</div>;
  if (error || !data) return <div className="min-h-screen bg-cream flex items-center justify-center text-forest-dark">Proposal not found.</div>;

  return <ProposalView data={data} />;
};

export default ProposalTemplate;
