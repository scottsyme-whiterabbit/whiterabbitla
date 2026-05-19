import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Calendar, Instagram, Linkedin } from "lucide-react";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import threeStars from "@/assets/three-stars-gold.png";
import wrScriptLogo from "@/assets/wr-wordmark-cream.png";
import heroMain from "@/assets/hero-magic-cinematic.jpg";
import photoScottBw from "@/assets/event-scott-bw-stage.jpg";
import proposalCardsBw from "@/assets/proposal-cards-bw.jpg";

export interface VenueTestimonial {
  quote: string;
  attribution: string;
}

export interface VenuePitchData {
  id?: string;
  slug?: string;
  venue_name: string;
  gm_name: string;
  gm_email?: string | null;
  submarket?: string | null;
  hero_image: string; // url or "signature"
  hero_subhead: string;
  intro_paragraphs: string[];
  pilot_weeks: number;
  nights_per_week: number;
  session_hours: number;
  fee_dollars?: number | null;
  testimonials: VenueTestimonial[];
  press_line?: string | null;
  scheduling_url?: string | null;
  closing_private_line?: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const DEFAULT_VENUE_PITCH: VenuePitchData = {
  venue_name: "Your Venue",
  gm_name: "Friend",
  submarket: "Los Angeles",
  hero_image: "signature",
  hero_subhead:
    "One night a week. Every booth. Two hours. No microphone. No spectacle.",
  intro_paragraphs: [
    "Your venue is one of the rooms in Los Angeles where I would actually want to perform. The bar, the room, the kind of guest who walks in on a Thursday at nine — those are the people I want my work in front of, and those are the people I think would remember an evening at your room differently if there was a magician quietly moving between tables.",
    "This is a proposal for a four-week residency. One night a week. Two hours of close-up magic, table to table, between the second course and dessert. You decide the night. I bring the room.",
    "If at the end of four weeks the dwell time, the check average, and the social engagement haven't moved, we shake hands. You've still given your guests four nights they'll talk about, at no risk to the room.",
  ],
  pilot_weeks: 4,
  nights_per_week: 1,
  session_hours: 2,
  fee_dollars: null,
  testimonials: [],
  press_line: null,
  scheduling_url: null,
  closing_private_line: "The Hand and Eye in your home. And, perhaps, in your room.",
};

const formatFee = (n?: number | null) =>
  typeof n === "number" && n > 0 ? `$${n.toLocaleString()}` : null;

export const ResidencyView = ({ data }: { data: VenuePitchData }) => {
  const heroSrc = data.hero_image && data.hero_image !== "signature" ? data.hero_image : heroMain;
  const fee = formatFee(data.fee_dollars);
  const schedHref = (data.scheduling_url || "").trim();
  const realTestimonials = (data.testimonials || []).filter(
    (t) => t && t.quote && t.quote.trim().length > 0
  );

  return (
    <div className="bg-cream text-forest-dark font-sans">
      {/* HERO */}
      <section className="relative bg-forest-dark text-cream overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroSrc}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/80 via-forest-dark/55 to-forest-dark/95" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center flex flex-col items-center">
          <img src={threeStars} alt="" className="w-12 md:w-14 mb-6 opacity-90" />
          <p className="text-[11px] md:text-xs tracking-[0.4em] uppercase text-gold mb-6">
            A Residency Proposal
          </p>
          <h1 className="font-serif font-light text-4xl md:text-6xl leading-tight tracking-tight">
            A magician in residence at{" "}
            <span className="text-gold">{data.venue_name}</span>
          </h1>
          <div className="flex items-center gap-3 mt-8">
            <span className="w-10 h-px bg-gold/60" />
            <span className="text-gold text-xs">✦</span>
            <span className="w-10 h-px bg-gold/60" />
          </div>
          <p className="font-sans text-lg md:text-xl text-cream/85 mt-8 max-w-2xl leading-relaxed">
            {data.hero_subhead}
          </p>
          {data.submarket && (
            <p className="mt-10 text-[11px] tracking-[0.4em] uppercase text-cream/50">
              {data.submarket}
            </p>
          )}
        </div>
      </section>

      {/* SECTION 1 — THE INVITATION */}
      <section className="relative bg-cream py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <OrnamentalDivider />
          <div className="font-sans text-base md:text-lg leading-relaxed text-forest-dark space-y-5 mt-8">
            <p className="font-serif text-xl md:text-2xl text-forest">
              {data.gm_name},
            </p>
            {data.intro_paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>

          {/* Key Line callout */}
          <div className="mt-12 border-l-2 border-gold pl-6 py-2">
            <p className="font-serif text-2xl md:text-3xl text-forest-dark leading-snug">
              "The kind of evening guests don't talk about the next morning, they talk about for years."
            </p>
          </div>

          <p className="font-serif text-2xl pl-2 mt-10 text-forest">— Scott</p>
        </div>
      </section>

      {/* PHOTO BREAK */}
      <section className="relative bg-forest-dark py-12 md:py-16 px-4">
        <div className="text-center mb-4">
          <span className="text-gold text-lg">✦</span>
        </div>
        <div className="max-w-5xl mx-auto mt-6 grid grid-cols-3 gap-3 md:gap-4">
          {[proposalCardsBw, proposalCardsBw, proposalCardsBw].map((src, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden bg-forest-dark/60 group">
              <img
                src={src}
                alt=""
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                  i === 1 ? "scale-x-[-1] group-hover:scale-x-[-1.1] group-hover:scale-y-110" : "group-hover:scale-110"
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2 — WHY A RESIDENCY WORKS */}
      <section className="relative bg-cream py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">
            Why a Residency Works
          </p>
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-4xl md:text-5xl text-forest-dark mt-6 mb-12">
            The math behind the moment.
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {[
              {
                stat: "140%",
                caption:
                  "More spent by guests with the best dining experiences vs. the worst.",
                source: "Harvard Business Review",
              },
              {
                stat: "+1.3%",
                caption:
                  "In sales for every 1% increase in dwell time. Longer stays mean another round, dessert, a nightcap.",
                source: "PathIntelligence dwell-time study",
              },
              {
                stat: "85%",
                caption:
                  "Of diners share positive experiences on social. A residency turns every night into organic content.",
                source: "Restaurant Marketing Statistics 2026",
              },
            ].map((s, i) => (
              <div key={i} className="relative px-4 py-8 border-t border-gold/30">
                <div className="font-serif font-light text-5xl md:text-6xl text-gold mb-4 leading-none">
                  {s.stat}
                </div>
                <p className="font-sans text-sm md:text-base text-forest-dark/85 leading-relaxed mb-3">
                  {s.caption}
                </p>
                <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-forest-dark/50">
                  — {s.source}
                </p>
              </div>
            ))}
          </div>

          {data.submarket && (
            <p className="font-sans text-sm text-forest-dark/65 mt-12 max-w-2xl mx-auto">
              Numbers like these matter most in a market like {data.submarket}, where guests already expect the room to deliver.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 3 — WHAT THE NIGHT LOOKS LIKE */}
      <section className="relative bg-cream pb-16 md:pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">
              What the Night Looks Like
            </p>
            <h2 className="font-serif font-light text-3xl md:text-4xl text-forest-dark">
              Quiet entrance. Full room. No interruption.
            </h2>
          </div>
          <div className="relative pl-8 border-l border-gold/40 space-y-8">
            {[
              {
                t: "Arrive 30 minutes before service",
                d: "Brief the floor manager. Check the room. Disappear until I'm needed.",
              },
              {
                t: "Two hours, table to table",
                d: `Between the second course and dessert. Every booth, every two-top. ${data.session_hours} hours.`,
              },
              {
                t: "No microphone. No stage.",
                d: "The work happens at the table, in the candle glow, in the guest's own hands.",
              },
              {
                t: "Out the back before the last check drops",
                d: "Your team keeps the room. The night belongs to your venue, not to me.",
              },
            ].map((row, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[34px] w-3 h-3 rounded-full bg-gold mt-2 ring-4 ring-cream" />
                <div className="font-serif text-xl md:text-2xl text-forest-dark mb-1">
                  {row.t}
                </div>
                <div className="text-base text-forest-dark/75 leading-relaxed">
                  {row.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE PILOT */}
      <section className="relative bg-forest-dark text-cream py-20 md:py-28 px-6 overflow-hidden">
        <div className="max-w-3xl mx-auto relative text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">
            The Pilot
          </p>
          <h2 className="font-serif font-light text-4xl md:text-5xl text-cream mb-3">
            {data.pilot_weeks} weeks. {data.nights_per_week} night a week.{" "}
            {data.session_hours} hours a night.
          </h2>
          <div className="flex items-center justify-center gap-3 mt-6 mb-10">
            <span className="w-10 h-px bg-gold/60" />
            <span className="text-gold text-xs">✦</span>
            <span className="w-10 h-px bg-gold/60" />
          </div>

          <div className="relative max-w-md mx-auto p-8 md:p-10 border border-gold/50 bg-cream/[0.04]">
            <span className="absolute top-0 left-0 w-4 h-px bg-gold/70" />
            <span className="absolute top-0 left-0 w-px h-4 bg-gold/70" />
            <span className="absolute top-0 right-0 w-4 h-px bg-gold/70" />
            <span className="absolute top-0 right-0 w-px h-4 bg-gold/70" />
            <span className="absolute bottom-0 left-0 w-4 h-px bg-gold/70" />
            <span className="absolute bottom-0 left-0 w-px h-4 bg-gold/70" />
            <span className="absolute bottom-0 right-0 w-4 h-px bg-gold/70" />
            <span className="absolute bottom-0 right-0 w-px h-4 bg-gold/70" />

            <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-gold mb-4">
              Per night
            </p>
            <div className="font-serif font-light text-5xl md:text-6xl mb-6">
              {fee || "Let's discuss"}
            </div>
            <ul className="text-left space-y-3 text-sm md:text-base text-cream/85 leading-relaxed">
              {[
                `${data.session_hours} hours of close-up magic, table to table`,
                "Every booth, every two-top covered",
                "Pre-residency walkthrough with your team",
                "Custom moment for any VIP guests on request",
                "Branded social content delivered after each night",
              ].map((it, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="text-gold mt-1 text-[10px]">✦</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="font-sans text-base text-cream/80 mt-10 max-w-xl mx-auto leading-relaxed">
            If at the end of {data.pilot_weeks} weeks the dwell time, the check
            average, and the social engagement haven't moved — we shake hands.
            No retainer. No extension obligation. Just four nights your guests
            won't forget.
          </p>
        </div>
      </section>

      {/* SECTION 5 — ABOUT THE WORK */}
      <section className="relative bg-cream py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">
            About the Work
          </p>
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-3xl md:text-4xl text-forest-dark mt-6 mb-8">
            Some of the most impossible magic in the world, brought into the
            room one table at a time.
          </h2>
          <p className="font-sans text-base md:text-lg text-forest-dark/85 leading-relaxed mb-4">
            The show isn't about me. It's about the people at the table.
            They're not watching a performance — they're inside one.
          </p>
          {data.press_line && (
            <p className="font-sans text-sm text-forest-dark/65 mt-6">
              {data.press_line}
            </p>
          )}
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-forest-dark/50 mt-8">
            A short film of past work is available on request.
          </p>
        </div>
      </section>

      {/* PHOTO BREAK 2 */}
      <section className="relative h-56 md:h-80 overflow-hidden bg-forest-dark">
        <img
          src={photoScottBw}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/40 via-transparent to-forest-dark" />
      </section>

      {/* SECTION 6 — TESTIMONIALS */}
      {realTestimonials.length > 0 && (
        <section className="relative bg-cream py-20 md:py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">
                A Few Words from Past Evenings
              </p>
              <OrnamentalDivider />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {realTestimonials.slice(0, 3).map((t, i) => (
                <div key={i} className="text-center md:text-left">
                  <span className="font-serif text-5xl text-gold/60 leading-none block mb-2">
                    "
                  </span>
                  <p className="font-serif text-lg md:text-xl text-forest-dark leading-relaxed mb-4">
                    {t.quote}
                  </p>
                  <p className="font-sans text-xs tracking-[0.15em] uppercase text-forest-dark/60">
                    — {t.attribution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 7 — LET'S WALK THE ROOM */}
      <section className="relative bg-forest-dark text-cream py-20 md:py-28 px-6 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto relative">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">
            Let's Walk the Room
          </p>
          <h2 className="font-serif font-light text-4xl md:text-5xl mb-4">
            The fastest way forward is a 20-minute walkthrough.
          </h2>
          <div className="flex items-center justify-center gap-3 mt-6 mb-10">
            <span className="w-10 h-px bg-gold/60" />
            <span className="text-gold text-xs">✦</span>
            <span className="w-10 h-px bg-gold/60" />
          </div>
          <p className="font-sans text-base md:text-lg leading-relaxed text-cream/85 max-w-2xl mx-auto mb-10">
            Before any of this becomes real, I'd love to come by {data.venue_name},
            see the room you imagine me working in, and meet the team. Twenty
            minutes is enough. If after that it doesn't feel right, no proposal
            goes forward.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            {schedHref ? (
              <a
                href={schedHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gold text-forest-dark py-4 px-6 text-xs tracking-[0.2em] uppercase font-medium hover:opacity-90 transition-opacity"
              >
                <Calendar className="w-4 h-4" />
                Book a 20-minute walkthrough
              </a>
            ) : (
              <a
                href={`mailto:scott.syme@whiterabbitla.com?subject=${encodeURIComponent(
                  `Walkthrough at ${data.venue_name}`
                )}`}
                className="inline-flex items-center justify-center gap-2 bg-gold text-forest-dark py-4 px-6 text-xs tracking-[0.2em] uppercase font-medium hover:opacity-90 transition-opacity"
              >
                <Calendar className="w-4 h-4" />
                Book a 20-minute walkthrough
              </a>
            )}
            <a
              href="tel:+14243941850"
              className="inline-flex items-center justify-center gap-2 border border-cream/40 text-cream py-4 px-6 text-xs tracking-[0.2em] uppercase font-medium hover:border-gold hover:text-gold transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Scott — (424) 394-1850
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section className="relative bg-cream text-center py-14 px-6">
        <img src={threeStars} alt="" className="w-10 mx-auto mb-6 opacity-70" />
        <p
          className="text-3xl md:text-4xl text-forest-dark/85 leading-tight -rotate-2 inline-block"
          style={{ fontFamily: "'Homemade Apple', cursive" }}
        >
          Scott Syme
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 mb-5">
          <span className="w-10 h-px bg-gold/60" />
          <span className="text-gold">✦</span>
          <span className="w-10 h-px bg-gold/60" />
        </div>
        <p className="font-serif text-2xl text-forest-dark">Scott Syme</p>
        <p className="font-sans text-xs text-forest-dark/60 mt-1 tracking-[0.25em] uppercase">
          Magician
        </p>
        <div className="mt-4 space-y-1 text-sm text-forest-dark">
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
        <div className="mt-4 flex items-center justify-center gap-4">
          <a
            href="https://www.instagram.com/scottsyme_?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-forest-dark/50 hover:text-gold transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/scottsymejr/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-forest-dark/50 hover:text-gold transition-colors"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>

        <div className="mt-8 flex justify-center">
          <img
            src={wrScriptLogo}
            alt="White Rabbit LA"
            width={1080}
            height={675}
            loading="lazy"
            decoding="async"
            className="w-48 md:w-60 h-auto"
          />
        </div>

        {/* Private positioning line — residency proposals only */}
        {data.closing_private_line && (
          <p className="font-sans text-sm text-forest-dark/45 mt-10 max-w-md mx-auto leading-relaxed">
            {data.closing_private_line}
          </p>
        )}
      </section>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-forest-dark/95 backdrop-blur-sm border-t border-gold/30 p-3 safe-area-pb">
        <a
          href={schedHref || `mailto:scott.syme@whiterabbitla.com?subject=${encodeURIComponent(`Walkthrough at ${data.venue_name}`)}`}
          target={schedHref ? "_blank" : undefined}
          rel={schedHref ? "noopener noreferrer" : undefined}
          className="flex items-center justify-center gap-2 bg-gold text-forest-dark py-3 px-4 text-xs tracking-[0.2em] uppercase font-medium"
        >
          <Calendar className="w-4 h-4" />
          Book the 20-min walkthrough
        </a>
      </div>
      {/* Spacer for sticky bar */}
      <div className="md:hidden h-16" aria-hidden />
    </div>
  );
};

interface Props {
  data?: VenuePitchData;
  preview?: boolean;
}

const ResidencyTemplate = ({ data: dataProp, preview }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<VenuePitchData | null>(
    dataProp || (preview ? DEFAULT_VENUE_PITCH : null)
  );
  const [loading, setLoading] = useState(!dataProp && !preview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataProp || preview) {
      if (dataProp) setData(dataProp);
      return;
    }
    if (!slug) {
      setData(DEFAULT_VENUE_PITCH);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/proposals-api?action=get_venue&slug=${encodeURIComponent(slug)}`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed to load");
        setData(j.pitch);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, dataProp, preview]);

  useEffect(() => {
    if (data) {
      document.title = `Residency Proposal — ${data.venue_name} · White Rabbit LA`;
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-forest-dark/60 font-sans text-sm tracking-[0.2em] uppercase">
        Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-forest-dark/60 px-6 text-center">
        {error || "Proposal not found."}
      </div>
    );
  }
  return <ResidencyView data={data} />;
};

export default ResidencyTemplate;
