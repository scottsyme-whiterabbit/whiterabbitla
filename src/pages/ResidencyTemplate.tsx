import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Calendar, Instagram, Linkedin, Award, Star, ArrowRight, Copy, Check } from "lucide-react";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import threeStars from "@/assets/three-stars-gold.png";
import wrScriptLogo from "@/assets/wr-wordmark-cream.png";
import heroMain from "@/assets/hero-magic-cinematic.jpg";
import photoScottBw from "@/assets/event-scott-bw-stage.jpg";
import proposalCardsBw from "@/assets/proposal-cards-bw.jpg";
import proposalCenterCards from "@/assets/proposal-center-cards.jpg";
import { DEFAULT_GALLERY_KEYS, photoKeyToSrc } from "@/data/proposalAssets";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import rivianLogo from "@/assets/logos/rivian.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import paramountLogo from "@/assets/logos/paramount.png";
import sohohouseLogo from "@/assets/logos/sohohouse-new.png";
import beverlyHiltonLogo from "@/assets/logos/beverlyhilton.png";

const galleryPhotos: { src: string; mirror?: boolean }[] = [
  { src: proposalCardsBw },
  { src: proposalCenterCards },
  { src: proposalCardsBw, mirror: true },
];

const logos = [
  { name: "Netflix", src: netflixLogo },
  { name: "Disney", src: disneyLogo },
  { name: "Morgan Stanley", src: morganstanleyLogo },
  { name: "Rivian", src: rivianLogo },
  { name: "Rolls-Royce", src: rollsroyceLogo },
  { name: "Paramount", src: paramountLogo },
  { name: "Soho House", src: sohohouseLogo, sizeClass: "max-h-14 md:max-h-[68px]" },
  { name: "The Beverly Hilton", src: beverlyHiltonLogo },
];


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
  night_of_week?: string | null;
  testimonials: VenueTestimonial[];
  press_line?: string | null;
  scheduling_url?: string | null;
  closing_private_line?: string | null;
  video_url?: string | null;
  case_study_result?: string | null;
  case_study_quote?: string | null;
  case_study_attribution?: string | null;
  first_name?: string | null;
  room_detail?: string | null;
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
    "There are a handful of rooms in Los Angeles where the evening already feels like an occasion before anything happens. Your Venue is one of them. The booths along the back wall, the bar at nine on a Thursday — that's a room where a magician moving quietly between tables doesn't add noise. It adds a story your guests tell on the way home.",
    "This is a proposal for a four-week residency. One night a week, two hours, table to table. You pick the night. Your guests don't watch a show — they become the show.",
  ],
  pilot_weeks: 4,
  nights_per_week: 1,
  session_hours: 2,
  fee_dollars: null,
  night_of_week: "Thursday",
  testimonials: [],
  press_line: null,
  scheduling_url: null,
  closing_private_line: "In those moments, nothing feels impossible. And maybe, for the guests who were there, nothing quite does afterward either.",
  video_url: null,
  case_study_result: "On residency nights, tables stayed through dessert and asked for him by name.",
  case_study_quote: "Scott was our resident Magician at Rideau. His performances, combined, elegance, technical mastery and humor, creating memorable experiences that our guests truly loved.",
  case_study_attribution: "General Manager, Rideau at Arden",
  first_name: null,
  room_detail: "The booths along the back wall, the bar at nine on a Thursday",
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
  const [copied, setCopied] = useState(false);

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

      {/* GUARANTEE STRIP */}
      <section className="relative bg-cream py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-5">
            The White Rabbit Guarantee
          </p>
          <p className="font-serif text-xl md:text-2xl text-forest-dark leading-relaxed">
            "If after four weeks you haven't seen it — in the tables that linger, the checks, the tags — we shake hands and part as friends. No retainer. No lock-in. The first night is on me."
          </p>
        </div>
      </section>

      {/* SECTION 1 — THE INVITATION */}
      <section className="relative bg-cream py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <OrnamentalDivider />
          <div className="font-sans text-base md:text-lg leading-relaxed text-forest-dark space-y-5 mt-8">
            <p className="font-serif text-xl md:text-2xl text-forest">
              {data.first_name || data.gm_name},
            </p>
            <p className="whitespace-pre-wrap">
              There are a handful of rooms in Los Angeles where the evening already feels like an occasion before anything happens. {data.venue_name} is one of them. {data.room_detail || "The booths along the back wall, the bar at nine on a Thursday"} — that's a room where a magician moving quietly between tables doesn't add noise. It adds a story your guests tell on the way home.
            </p>
            <p className="whitespace-pre-wrap">
              This is a proposal for a four-week residency. One night a week, two hours, table to table. You pick the night. Your guests don't watch a show — they become the show.
            </p>
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
          {galleryPhotos.map((photo, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden bg-forest-dark/60 group">
              <img
                src={photo.src}
                alt=""
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                  photo.mirror
                    ? "scale-x-[-1] group-hover:scale-x-[-1.1] group-hover:scale-y-110"
                    : "group-hover:scale-110"
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

      {/* SECTION 3.25 — THIS ALREADY WORKS IN A ROOM LIKE YOURS */}
      <section className="relative bg-cream py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">
            This Already Works in a Room Like Yours
          </p>
          <OrnamentalDivider />
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mt-8 mb-6">
            Rideau at Arden, West Hollywood
          </p>
          <p className="font-sans text-base md:text-lg text-forest-dark/85 leading-relaxed mb-10">
            {data.case_study_result || "On residency nights, tables stayed through dessert and asked for him by name."}
          </p>

          <div className="text-center max-w-2xl mx-auto">
            <span className="font-serif text-5xl text-gold/60 leading-none block mb-2">
              &ldquo;
            </span>
            <p className="font-serif text-lg md:text-xl text-forest-dark leading-relaxed mb-4">
              {data.case_study_quote || "Scott was our resident Magician at Rideau. His performances, combined, elegance, technical mastery and humor, creating memorable experiences that our guests truly loved."}
            </p>
            <p className="font-sans text-xs tracking-[0.15em] uppercase text-forest-dark/60">
              &mdash; {data.case_study_attribution || "General Manager, Rideau at Arden"}
            </p>
          </div>

          {data.video_url && (
            <div className="mt-10">
              <a
                href={data.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-forest-dark border-b border-gold/60 pb-1 hover:text-gold transition-colors"
              >
                A sixty-second film of the work, shot at the table, is available here <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3.5 — ONE PATH. THREE STEPS. */}
      <section className="relative bg-cream pb-20 md:pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">
              One Path. Three Steps.
            </p>
            <OrnamentalDivider />
          </div>

          <div className="space-y-6">
            {/* STEP ONE */}
            <div className="border border-forest-dark/15 bg-white p-8 md:p-10">
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">
                Step One — The Audition
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-forest-dark mb-4 leading-snug">
                Tuesday, 5:30, before service.
              </h3>
              <p className="font-sans text-base text-forest-dark/80 leading-relaxed mb-6">
                You watch me work two tables in your own room. Twenty minutes later you tell me if I fit. No charge, no decision, no proposal goes forward unless you want it to.
              </p>
              <a
                href={`mailto:scott.syme@whiterabbitla.com?subject=${encodeURIComponent(
                  `Audition at ${data.venue_name}`
                )}`}
                className="inline-flex items-center justify-center gap-2 border border-forest-dark/30 text-forest-dark py-3 px-5 text-[11px] tracking-[0.25em] uppercase hover:bg-forest-dark hover:text-cream transition-colors"
              >
                Book the audition
              </a>
            </div>

            {/* STEP TWO — emphasized */}
            <div className="relative border border-gold/60 bg-forest-dark text-cream p-8 md:p-10">
              <span className="absolute top-0 left-0 w-4 h-px bg-gold/70" />
              <span className="absolute top-0 left-0 w-px h-4 bg-gold/70" />
              <span className="absolute top-0 right-0 w-4 h-px bg-gold/70" />
              <span className="absolute top-0 right-0 w-px h-4 bg-gold/70" />
              <span className="absolute bottom-0 left-0 w-4 h-px bg-gold/70" />
              <span className="absolute bottom-0 left-0 w-px h-4 bg-gold/70" />
              <span className="absolute bottom-0 right-0 w-4 h-px bg-gold/70" />
              <span className="absolute bottom-0 right-0 w-px h-4 bg-gold/70" />

              <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">
                Step Two — The Four-Week Pilot
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-cream mb-4 leading-snug">
                $300 per night — founding-venue rate.
              </h3>
              <p className="font-sans text-base text-cream/85 leading-relaxed mb-6">
                One night a week for four weeks. Every booth, every two-top. A walkthrough with your team before night one. A custom moment for any VIP table. Content from each night, delivered to your marketing inbox. If after four weeks you haven't seen it, we shake hands. No retainer.
              </p>
              <a
                href={`mailto:scott.syme@whiterabbitla.com?subject=${encodeURIComponent(
                  `Pilot at ${data.venue_name}`
                )}`}
                className="inline-flex items-center justify-center gap-2 bg-gold text-forest-dark py-3 px-5 text-[11px] tracking-[0.25em] uppercase hover:opacity-90 transition-opacity"
              >
                Start the pilot
              </a>
            </div>

            {/* STEP THREE */}
            <div className="border border-forest-dark/15 bg-white p-8 md:p-10">
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">
                Step Three — The Residency
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-forest-dark mb-4 leading-snug">
                The night becomes yours.
              </h3>
              <p className="font-sans text-base text-forest-dark/80 leading-relaxed mb-6">
                A magician in residence, part of how {data.venue_name} does {data.night_of_week || "Thursday"}s. $300 per night, month to month, never locked in. One residency per neighborhood — when the night is taken, it's taken.
              </p>
              <a
                href={`mailto:scott.syme@whiterabbitla.com?subject=${encodeURIComponent(
                  `Residency at ${data.venue_name}`
                )}`}
                className="inline-flex items-center justify-center gap-2 border border-forest-dark/30 text-forest-dark py-3 px-5 text-[11px] tracking-[0.25em] uppercase hover:bg-forest-dark hover:text-cream transition-colors"
              >
                Reserve the night
              </a>
            </div>
          </div>
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

      {/* CREDENTIALS / ACCREDITATIONS */}
      <section className="relative bg-forest-dark text-cream py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">
            Credentials
          </p>
          <OrnamentalDivider />
          <h2 className="font-serif font-light text-3xl md:text-4xl text-cream mt-6 mb-12">
            Vetted by the rooms that don't let just anyone in.
          </h2>
      {/* A FEW QUESTIONS */}
      <section className="relative bg-cream py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">
              Before You Decide
            </p>
            <OrnamentalDivider />
            <h2 className="font-serif font-light text-3xl md:text-4xl text-forest-dark mt-6">
              A few questions.
            </h2>
          </div>

          <div className="divide-y divide-forest-dark/10 border-t border-b border-forest-dark/10">
            {[
              {
                q: "Will this interrupt service?",
                a: "No. I move with your team and never approach a table mid-course or one that wants to be left alone. If the kitchen is in the weeds, I read that and ease off.",
              },
              {
                q: "What if a table isn't interested?",
                a: "I see it before they have to say a word, and I move on warmly. No guest is ever put on the spot.",
              },
              {
                q: "What do you need from us?",
                a: "Almost nothing. No stage, no microphone, no special lighting. A quiet word with your floor lead before service, and a sense of which tables you'd like me to reach.",
              },
              {
                q: "A slow night versus a packed room?",
                a: "I work both. On a quiet night I give each table more time. On a full room I keep it light and quick so service never feels the weight of it.",
              },
              {
                q: "What does it cost if it doesn't work?",
                a: "Nothing. The first night is on me, and the residency is month to month. You are never locked into anything.",
              },
              {
                q: "Do you bring props that clutter the room?",
                a: "No. Everything I use fits in my jacket. Cards, a borrowed ring, a guest's own phone. Nothing that doesn't already belong in your room.",
              },
            ].map((item, i) => (
              <div key={i} className="py-6">
                <div className="font-serif text-lg md:text-xl text-forest-dark mb-2">
                  {item.q}
                </div>
                <p className="font-sans text-base text-forest-dark/75 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


          <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-left">
            {[
              {
                title: "The Magic Castle",
                detail: "Performing member and consultant at the Academy of Magical Arts in Hollywood — the most selective magic society in the world.",
              },
              {
                title: "Hyatt Hotels",
                detail: "Strolling close-up magic across Hyatt properties — lobby bars and private events, never disrupting the room.",
              },
              {
                title: "Rideu at Arden, West Hollywood",
                detail: "Close-up performer inside one of West Hollywood's most discreet supper-club rooms.",
              },
            ].map((c, i) => (
              <div key={i} className="border border-gold/30 bg-cream/[0.03] p-6">
                <Award className="w-6 h-6 text-gold mb-3" />
                <div className="font-serif text-xl text-cream mb-2 leading-snug">
                  {c.title}
                </div>
                <p className="font-sans text-sm text-cream/75 leading-relaxed">
                  {c.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTED REVIEWS */}
      <section className="relative bg-cream py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold text-gold" />
              ))}
            </div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-3">
              5.0 on Google · What Rooms Are Saying
            </p>
            <OrnamentalDivider />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Scott was the highlight of our evening. Guests are still talking about it weeks later.",
                attribution: "Private Event, Beverly Hills",
              },
              {
                quote: "He read the room perfectly — quiet, elegant, never in the way. Exactly what we wanted.",
                attribution: "Hotel General Manager",
              },
              {
                quote: "The most impossible thing I've ever seen happen six inches from my face.",
                attribution: "Guest, Magic Castle",
              },
            ].map((t, i) => (
              <div key={i} className="text-center md:text-left">
                <span className="font-serif text-5xl text-gold/60 leading-none block mb-2">
                  "
                </span>
                <p className="font-serif text-lg text-forest-dark leading-relaxed mb-4">
                  {t.quote}
                </p>
                <p className="font-sans text-xs tracking-[0.15em] uppercase text-forest-dark/60">
                  — {t.attribution}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="https://whiterabbitla.com/reviews"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-forest-dark border-b border-gold/60 pb-1 hover:text-gold transition-colors"
            >
              Read More Reviews <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>



      {/* GALLERY STRIP */}
      {(() => {
        const items = DEFAULT_GALLERY_KEYS
          .map((k) => photoKeyToSrc(k))
          .filter((s): s is string => !!s);
        if (items.length === 0) return null;
        return (
          <section className="bg-forest-dark py-6 md:py-10 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-3 md:grid-cols-5 gap-1">
              {items.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden group">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* IN GOOD COMPANY — logos */}
      <section className="relative bg-cream py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">In Good Company</p>
          <OrnamentalDivider />
          <p className="font-sans text-sm md:text-base text-forest-dark/65 mt-6 mb-10">
            A few of the rooms we've worked.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-8 items-center">
            {logos.map((logo) => (
              <div key={logo.name} className="flex items-center justify-center">
                <img
                  src={logo.src}
                  alt={logo.name}
                  loading="lazy"
                  className={`${(logo as any).sizeClass ?? "max-h-9 md:max-h-11"} w-auto object-contain opacity-60 hover:opacity-100 transition-opacity`}
                  style={{ filter: "grayscale(100%)" }}
                />
              </div>
            ))}
          </div>
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

      {/* FOR YOUR OWNERSHIP GROUP */}
      <section className="relative bg-cream py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-4">
            For Your Ownership Group
          </p>
          <p className="font-sans text-base text-forest-dark/80 leading-relaxed mb-6">
            If this needs a yes from above you, here is the whole thing in four sentences — forward it as is.
          </p>
          <div className="relative border border-forest-dark/15 bg-white p-8 md:p-10">
            <p className="font-sans text-base text-forest-dark/85 leading-relaxed">
              "A close-up magician in residence, one night a week, moving table to table — no stage, no microphone, nothing that touches service. $300 a night, month to month, and the first night is a free audition we watch ourselves. He's a Magic Castle performing member who already works a West Hollywood supper-club room. Worst case: one interesting Tuesday."
            </p>
            <button
              onClick={() => {
                const text = 'A close-up magician in residence, one night a week, moving table to table — no stage, no microphone, nothing that touches service. $300 a night, month to month, and the first night is a free audition we watch ourselves. He\'s a Magic Castle performing member who already works a West Hollywood supper-club room. Worst case: one interesting Tuesday.';
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-6 inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-forest-dark border border-forest-dark/20 px-4 py-2 hover:bg-forest-dark hover:text-cream transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </section>

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
            Before any of this becomes real, I'd like to stand in the room with you. Twenty minutes at {data.venue_name} — see the space, meet the team, watch me work two tables if you like. If it doesn't feel right after that, no proposal goes forward and we part as friends.
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
                Book the audition — 20 minutes
              </a>
            ) : (
              <a
                href={`mailto:scott.syme@whiterabbitla.com?subject=${encodeURIComponent(
                  `Walkthrough at ${data.venue_name}`
                )}`}
                className="inline-flex items-center justify-center gap-2 bg-gold text-forest-dark py-4 px-6 text-xs tracking-[0.2em] uppercase font-medium hover:opacity-90 transition-opacity"
              >
                <Calendar className="w-4 h-4" />
                Book the audition — 20 minutes
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
