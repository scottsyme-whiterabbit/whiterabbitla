import { useState, useEffect } from "react";

const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
import { Link } from "react-router-dom";
import { retiredCityPaths } from "@/data/retiredCityRoutes";
import { ArrowRight, Star } from "lucide-react";
import threeStars from "@/assets/three-stars-gold.png";
import { motion, useReducedMotion } from "framer-motion";
import HeroReviewMarquee from "@/components/HeroReviewMarquee";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import QuizNudge from "@/components/QuizNudge";
import FAQSection from "@/components/FAQSection";

import TestimonialCarousel from "@/components/TestimonialCarousel";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import heroClip1 from "@/assets/triptych/triptych-1.mp4.asset.json";
import heroClip2 from "@/assets/triptych/triptych-2.mp4.asset.json";
import heroClip3 from "@/assets/triptych/triptych-3.mp4.asset.json";
import heroClip1Mobile from "@/assets/triptych/triptych-1-480.mp4.asset.json";
import heroClip2Mobile from "@/assets/triptych/triptych-2-480.mp4.asset.json";
import heroClip3Mobile from "@/assets/triptych/triptych-3-480.mp4.asset.json";
import heroPoster1 from "@/assets/triptych/triptych-1-poster.jpg.asset.json";
import heroPoster2 from "@/assets/triptych/triptych-2-poster.jpg.asset.json";
import heroPoster3 from "@/assets/triptych/triptych-3-poster.jpg.asset.json";

import SEOHead from "@/components/SEOHead";
import { useJsonLd } from "@/hooks/useSchemaOrg";
import { track } from "@/lib/posthog";

import heroImage from "@/assets/hero-magic-cinematic.jpg";
import experienceImg from "@/assets/experience-closeup.jpg";
import serviceGalaImg from "@/assets/service-charity-gala-action.jpg";
import serviceWeddingImgAsset from "@/assets/wedding-white-coat.jpg.asset.json";
const serviceWeddingImg = serviceWeddingImgAsset.url;
import parlorStageImg from "@/assets/event-parlor-stage.jpg";
import eventCardsImg from "@/assets/cards-spring-bw.jpg";
import penthouseImg from "@/assets/event-penthouse-show.jpg";
import parlorShowImg from "@/assets/event-parlor-show.jpg";
import scottCardsImg from "@/assets/event-scott-cards.jpg";
import silhouetteImg from "@/assets/event-silhouette.jpg";
import restaurantMagicImg from "@/assets/event-restaurant-magic.jpg";
import cardsEmeraldImg from "@/assets/event-cards-emerald.jpg";
import crowdImg from "@/assets/event-crowd.jpg";
import intimateImg from "@/assets/event-closeup-intimate.jpg";
import cuMagicReactionImg from "@/assets/event-cu-magic-reaction.jpg";
import cardsBlueImg from "@/assets/event-cards-blue.jpg";
import crowdReactionImg from "@/assets/event-crowd-reaction.jpg";
import groupFinaleImg from "@/assets/event-group-finale.jpg";
import scottLivingroomCloseup from "@/assets/scott-livingroom-closeup.jpg.asset.json";
import ladiesLuncheonCurtains from "@/assets/ladies-luncheon-curtains.jpg.asset.json";
import rubikShowImg from "@/assets/event-rubiks-show.jpg";

import netflixLogo from "@/assets/logos/normalized/netflix.png";
import disneyLogo from "@/assets/logos/normalized/disney.png";
import rollsroyceLogo from "@/assets/logos/normalized/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/normalized/morganstanley.png";
import rivianLogo from "@/assets/logos/normalized/rivian.png";
import createAndCultivateLogo from "@/assets/logos/normalized/createandcultivate.png";
import oliviarodrigoLogo from "@/assets/logos/normalized/oliviarodrigo.png";
import beverlyHiltonLogo from "@/assets/logos/normalized/beverlyhilton.png";
import magicCastleLogo from "@/assets/logos/normalized/magiccastle.png";
import sohohouseLogo from "@/assets/logos/normalized/sohohouse.png";
import microsoftLogo from "@/assets/logos/normalized/microsoft.png";
import hyattLogo from "@/assets/logos/normalized/hyatt.png";
import taittingerLogo from "@/assets/logos/normalized/taittinger.png";

// Logos are pre-normalized (trimmed of baked padding, exported at 3x retina).
// `h` is the render height in px, tiered by aspect ratio for optical balance:
//   aspect > 2.5 → 20px, 1.5–2.5 → 26px, < 1.5 → 34px.
// Magic Castle is intentionally scaled up as a featured brand mark.
const clients: { name: string; logo: string; h: number }[] = [
  { name: "Disney", logo: disneyLogo, h: 20 },
  { name: "Rolls Royce", logo: rollsroyceLogo, h: 34 },
  { name: "Taittinger", logo: taittingerLogo, h: 20 },
  { name: "Create & Cultivate", logo: createAndCultivateLogo, h: 36 },
  { name: "Netflix", logo: netflixLogo, h: 20 },
  { name: "Microsoft", logo: microsoftLogo, h: 20 },
  { name: "The Magic Castle", logo: magicCastleLogo, h: 46 },
  { name: "Morgan Stanley", logo: morganstanleyLogo, h: 20 },
  { name: "The Beverly Hilton", logo: beverlyHiltonLogo, h: 26 },
  { name: "Hyatt", logo: hyattLogo, h: 20 },
  { name: "Rivian", logo: rivianLogo, h: 40 },
  { name: "Olivia Rodrigo", logo: oliviarodrigoLogo, h: 26 },
  { name: "Soho House", logo: sohohouseLogo, h: 40 },
];


const heroReviews = [
  { text: "That was well worth it.", name: "Don Cheadle", role: "Actor" },
  { text: "Love it.", name: "Dolph Lundgren", role: "Actor" },
  { text: "He was everyone's favorite part of the night.", name: "Zara M." },
  { text: "The guests absolutely LOVED him.", name: "Jamie I." },
  { text: "He was the highlight of the entire evening.", name: "Meridith F." },
  { text: "He had the whole room captivated.", name: "Grace G." },
  { text: "Jaws were hitting the floor all night.", name: "Mohammad R." },
];

const Index = () => {
  const { openQuiz } = useBookingQuiz();
  // Visitors who ask for reduced motion see the still posters instead of the videos.
  const reduceMotion = useReducedMotion();
  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay } };
  const [heroRotation, setHeroRotation] = useState(0);
  const [heroFading, setHeroFading] = useState(false);






  // Rotate triptych column positions every ~12s with a brief crossfade
  useEffect(() => {
    if (reduceMotion) return;
    const ROTATE_MS = 12000;
    const FADE_MS = 700;
    const interval = setInterval(() => {
      setHeroFading(true);
      setTimeout(() => {
        setHeroRotation((r) => (r + 1) % 3);
        setHeroFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const seoTitle = "White Rabbit LA, Los Angeles Magician by Appointment";
  const seoDescription = "Close-up magic and mentalism for private events in Los Angeles and select destinations. Magic Castle member trusted by Netflix, Disney, and Morgan Stanley.";

  useJsonLd("homepage-breadcrumb-schema", {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://whiterabbitla.com/" },
    ],
  });

  return (
    <main id="main-content">
      <SEOHead title={seoTitle} description={seoDescription} canonical="/" ogImage="/og-image.jpg" />
      {/* Hero */}
      <section className="relative overflow-hidden h-[100svh] min-h-[560px] md:h-screen bg-forest-dark">
        {/* Triptych video container */}
        <div className="absolute inset-x-0 top-20 bottom-0 md:top-[120px] xl:top-20 bg-forest-dark">
          <div className="grid grid-cols-3 w-full h-full">
            {[
              { src: heroClip2.url, mobileSrc: heroClip2Mobile.url, poster: heroPoster2.url, offset: 0 },
              { src: heroClip1.url, mobileSrc: heroClip1Mobile.url, poster: heroPoster1.url, offset: 3.5 },
              { src: heroClip3.url, mobileSrc: heroClip3Mobile.url, poster: heroPoster3.url, offset: 7 },
            ].map((clip, i) => {
              // Rotate column position every cycle so clips swap places
              const position = (i + heroRotation) % 3;
              return (
                <div
                  key={clip.src}
                  style={{ order: position }}
                  className={`relative h-full overflow-hidden bg-black transition-[border-color] duration-700 ${
                    position > 0 ? "border-l border-accent/20" : "border-l border-transparent"
                  }`}
                >
                  {reduceMotion ? (
                    <img
                      src={clip.poster}
                      alt=""
                      width={1080}
                      height={1920}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={isMobileViewport() ? clip.mobileSrc : clip.src}
                      poster={clip.poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      width={1080}
                      height={1920}
                      className="w-full h-full object-cover transition-opacity duration-700"
                      style={{ opacity: heroFading ? 0.35 : 1 }}
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        v.playbackRate = 0.85;
                        if (v.duration && isFinite(v.duration)) {
                          v.currentTime = clip.offset % v.duration;
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Readability overlay: about 65% black behind the words, fading to about 35% at the edges.
              The ellipse is centred on the text block (50% / 28%) so the whole stack sits in the dark zone. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_28%,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.60)_55%,rgba(0,0,0,0.35)_100%)] pointer-events-none"
          />
          {/* Soft vignette directly behind the headline stack: lifts the words to WCAG AA on bright frames */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_28%,rgba(0,0,0,0.60)_0%,rgba(0,0,0,0.40)_62%,rgba(0,0,0,0)_100%)] pointer-events-none"
          />
          {/* Soft fade along the bottom edge into the next section */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          {/* Ambient warm glow behind hero text */}
          <div className="absolute bottom-0 left-[10vw] w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.08)_0%,_transparent_70%)] pointer-events-none hidden md:block" />
        </div>

        {/* Atmospheric wisps */}
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden hero-wisps">
          <div className="hero-wisp hero-wisp-1" />
          <div className="hero-wisp hero-wisp-2" />
          <div className="hero-wisp hero-wisp-3 hidden md:block" />
          <div className="hero-wisp hero-wisp-4 hidden md:block" />
        </div>

        {/* Centered text stack over the three videos. Its box ends above the space the cookie
            banner takes (about 300px on phones, 264px on desktop) so the button and proof line stay clear.
            The top edge is pushed below the 80px menu by a reserved breathing gap: 32px on phones,
            48px on desktop. Those reserves only apply on viewports tall enough to hold them, since on
            shorter windows the stack is already full and pushing it down would drop the proof line
            behind the cookie banner. From 1280px up the videos start right under the menu and the
            stack starts 48px below the top of the videos instead of being centred. */}
        <div className="absolute inset-x-0 top-20 bottom-[18.75rem] max-md:[@media(min-height:640px)]:top-[112px] md:top-[120px] md:bottom-[16.5rem] md:[@media(min-height:800px)]:top-[128px] xl:!top-32 z-10 flex flex-col items-center [justify-content:safe_center] xl:![justify-content:flex-start] px-6 text-center">
          <motion.p
            {...enter(0.2)}
            className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-accent mb-4 max-md:[@media(max-height:700px)]:mb-2.5 md:mb-5 [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]"
          >
            By reservation only
          </motion.p>
          <motion.h1
            {...enter(0.35)}
            className="relative font-serif font-medium text-6xl max-md:[@media(max-height:700px)]:text-[2.5rem] md:text-[clamp(4.5rem,10.5vh,6rem)] lg:text-[clamp(5rem,11vh,8rem)] leading-[0.92] tracking-tight"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 0 60px hsl(var(--accent) / 0.25)" }}
          >
            <span className="block text-cream">Magic.</span>{" "}
            <span className="block text-accent">Of course.</span>
          </motion.h1>
          <motion.p
            {...enter(0.6)}
            className="relative mx-auto mt-5 max-md:[@media(max-height:700px)]:mt-3 md:mt-6 max-w-xl font-sans text-[15px] max-md:[@media(max-height:700px)]:text-[13px] max-md:[@media(max-height:700px)]:leading-snug md:text-lg leading-relaxed tracking-[0.04em] md:tracking-[0.06em] text-cream/85 [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]"
          >
            For the finest weddings, private parties and corporate events in Los Angeles and beyond.
          </motion.p>
          <motion.div {...enter(0.85)} className="relative mt-6 max-md:[@media(max-height:700px)]:mt-4 md:mt-8">
            <button
              type="button"
              onClick={() => { track("hero_cta_clicked", { label: "Check your date" }); openQuiz(); }}
              className="inline-block font-sans text-sm md:text-[15px] tracking-[0.22em] uppercase border border-accent text-cream px-12 py-[1.125rem] max-md:[@media(max-height:700px)]:py-3 md:px-14 md:py-5 hover:bg-accent/15 hover:border-accent focus-visible:bg-accent/15 transition-colors duration-500"
            >
              Check your date
            </button>
          </motion.div>
          <motion.p
            {...enter(1)}
            className="relative mt-4 max-md:[@media(max-height:700px)]:mt-3 md:mt-5 font-sans text-[11px] md:text-xs tracking-[0.06em] leading-relaxed text-cream/70 [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]"
          >
            <span className="block md:inline">
              <a href="https://g.page/r/CXLCQWnGrGWrEAE" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-cream hover:underline transition-colors">5.0 on Google</a>
              <span aria-hidden="true" className="mx-2 text-accent">·</span>
              <Link to="/reviews" className="underline-offset-4 hover:text-cream hover:underline transition-colors">45+ five-star reviews</Link>
            </span>
            <span aria-hidden="true" className="hidden md:inline mx-2 text-accent">·</span>{" "}
            <span className="block md:inline">
              Magic Castle® member
              <span aria-hidden="true" className="mx-2 text-accent">·</span>
              <Link to="/contact#wr-promise-heading" className="underline-offset-4 hover:text-cream hover:underline transition-colors">The White Rabbit Promise</Link>
            </span>
          </motion.p>
        </div>

        {/* Rolling reviews, pinned to bottom of hero (desktop only) */}
        <motion.div
          className="hidden md:block absolute bottom-0 left-0 right-0 z-20 bg-forest-dark/80 backdrop-blur-sm py-4 border-t border-accent/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}>
          <HeroReviewMarquee reviews={heroReviews} variant="desktop" />
        </motion.div>
      </section>

      {/* Rolling reviews, mobile placement just below the hero */}
      <motion.div
        className="md:hidden bg-forest-dark/80 backdrop-blur-sm py-4 border-t border-accent/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}>
        <HeroReviewMarquee reviews={heroReviews} variant="mobile" />
      </motion.div>

      {/* Client Logos · static stacked block */}
      <AnimatedSection>
        <section className="bg-gradient-to-b from-[#F8F5F0] to-[#F0E8D8] py-14 md:py-16">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center font-sans text-[11px] tracking-[0.4em] uppercase text-gold mb-10">
              IN GOOD COMPANY
            </p>
            <div className="gap-x-5 gap-y-6 sm:gap-x-8 sm:gap-y-10 md:gap-x-12 md:gap-y-12 items-center" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2rem 1.5rem" }}>
              {clients.map((client) => (
                <div key={client.name} className="flex items-center justify-center h-12 md:h-14 basis-[150px] shrink-0 grow-0">
                  <img
                    src={client.logo}
                    alt={`${client.name} logo, White Rabbit client`}
                    loading="lazy"
                    decoding="async"
                    style={{
                      maxHeight: `${client.h}px`,
                      maxWidth: "100%",
                      width: "auto",
                      height: "auto",
                      filter: "brightness(0) saturate(100%) invert(24%) sepia(9%) saturate(1200%) hue-rotate(70deg) brightness(95%) contrast(85%)",
                    }}
                    className="object-contain opacity-55 hover:opacity-80 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>



      {/* Quiz Nudge */}
      <QuizNudge />

      <div className="flex justify-center py-10">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} loading="lazy" decoding="async" className="h-16 w-auto opacity-50" />
      </div>

      {/* Cities */}
      <p className="max-w-4xl mx-auto px-6 py-10 text-center font-sans text-xs uppercase leading-loose tracking-[0.3em] text-muted-foreground">
        <span className="whitespace-nowrap">
          <Link to="/areas/los-angeles" className="no-underline hover:font-bold">Los Angeles</Link>
        </span>{" "}
        {!retiredCityPaths.has("/areas/new-york") && <span className="whitespace-nowrap">
          <span aria-hidden="true" className="mx-3 text-muted-foreground/40 hidden md:inline">·</span>
          <Link to="/areas/new-york" className="no-underline hover:font-bold">New York</Link>
        </span>}{" "}
        {!retiredCityPaths.has("/areas/miami") && <span className="whitespace-nowrap">
          <span aria-hidden="true" className="mx-3 text-muted-foreground/40 hidden md:inline">·</span>
          <Link to="/areas/miami" className="no-underline hover:font-bold">Miami</Link>
        </span>}{" "}
        {!retiredCityPaths.has("/areas/san-francisco") && <span className="whitespace-nowrap">
          <span aria-hidden="true" className="mx-3 text-muted-foreground/40 hidden md:inline">·</span>
          <Link to="/areas/san-francisco" className="no-underline hover:font-bold">San Francisco</Link>
        </span>}{" "}
        <span className="whitespace-nowrap">
          <span aria-hidden="true" className="mx-3 text-muted-foreground/40 hidden md:inline">·</span>
          <Link to="/areas" className="no-underline hover:font-bold">By invitation elsewhere</Link>
        </span>
      </p>
      <p className="max-w-4xl mx-auto px-6 -mt-4 pb-10 text-center font-sans text-sm text-muted-foreground leading-relaxed">
        Planning an evening in the city? See how to{" "}
        <Link to="/areas/los-angeles" className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">
          hire a magician in Los Angeles
        </Link>
        .
      </p>

      {/* The Experience Teaser */}
      <section className="py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Experience</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
                More Than Magic.<br />A Feeling.
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">Scott Syme is the magician behind White Rabbit. A member of the Magic Castle® and consultant to performers on America's Got Talent and Disney Channel, Scott has spent years going deeper into a single question than most people think to ask. What makes someone feel genuinely alive in a room full of people?</p>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">Everything about White Rabbit is built around the answer. Nothing is accidental. Scott blends interactive magic, mentalism, and impossible coincidences with the warmth of a seasoned host, transforming any room into something cinematic, intimate, and utterly alive. Curated lighting, a signature soundtrack, and moments so close you can feel them. Your guests don't watch. They're in it, fully present. That is White Rabbit.







              </p>
              <Link
                to="/experience"
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                Explore
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="relative aspect-[4/5] overflow-hidden border border-accent/15">
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30 z-10" />
              <img
                src={eventCardsImg}
                alt="Scott Syme performing close-up card magic at a luxury corporate event in Los Angeles"
                width={600}
                height={750}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="flex justify-center pb-6">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} loading="lazy" decoding="async" className="h-14 w-auto opacity-50" />
      </div>

      {/* What Clients Are Saying, Testimonial Carousel */}
      <AnimatedSection>
        <div className="relative">
          {/* Ambient warm glow behind testimonials */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.06)_0%,_transparent_70%)] pointer-events-none hidden md:block" />
          <TestimonialCarousel />
        </div>
      </AnimatedSection>

      {/* Discovery Quiz CTA */}
      <QuizCTA title="Wondering If Magic Is Right for Your Event?" />

      <div className="flex justify-center">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} loading="lazy" decoding="async" className="h-14 w-auto opacity-50" />
      </div>

      {/* Photo Gallery */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatedSection>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={cuMagicReactionImg} alt="Guest reacting with amazement to close-up card magic at White Rabbit event" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={penthouseImg} alt="Scott Syme performing private magic show in a luxury Los Angeles penthouse" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={cardsBlueImg} alt="Close-up interactive magic with dramatic blue lighting" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={rubikShowImg} alt="Scott Syme performing Rubik's cube magic at a live White Rabbit show" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={crowdReactionImg} alt="Audience reacting with excitement during a White Rabbit private magic show" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={ladiesLuncheonCurtains.url} alt="Scott Syme greeting guests at a luxury ladies' luncheon private event" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={scottCardsImg} alt="Scott Syme performing card magic at a private luxury event" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={scottLivingroomCloseup.url} alt="Scott Syme performing close-up magic for guests in a luxury Los Angeles living room" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.25}>
            <div className="relative aspect-[4/3] overflow-hidden border border-accent/15">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/30 z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-accent/30 z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-accent/30 z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/30 z-10" />
              <img src={restaurantMagicImg} alt="Scott Syme performing close-up magic at a luxury restaurant event" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="flex justify-center">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} loading="lazy" decoding="async" className="h-14 w-auto opacity-50" />
      </div>

      {/* The Experiences */}
      <section className="py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">The Experiences</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-16 text-center">Choose Your Evening</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection>
              <Link to="/services/corporate-magician" className="group block relative aspect-[3/4] overflow-hidden border border-accent/15 shadow-[0_0_20px_-5px_hsl(var(--accent)/0.1)]">
                <img src={serviceGalaImg} alt="Guests reacting to close-up magic at a corporate gala in Los Angeles" width={400} height={533} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                {/* Corner filigree */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Corporate</p>
                  <h3 className="font-serif text-2xl text-cream mb-3">Galas & Corporate Evenings</h3>
                  <p className="font-sans text-sm text-cream/60 mb-4">Shared moments your guests talk about long after the evening ends.</p>
                  <span className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase text-cream/80 group-hover:text-accent transition-colors">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <Link to="/services/wedding-magician" className="group block relative aspect-[3/4] overflow-hidden border border-accent/15 shadow-[0_0_20px_-5px_hsl(var(--accent)/0.1)]">
                <img src={serviceWeddingImg} alt="White Rabbit LA magician in a white dinner jacket performing for wedding weekend guests in a luxury living room" width={400} height={533} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Weddings</p>
                  <h3 className="font-serif text-2xl text-cream mb-3">The Wedding Weekend</h3>
                  <p className="font-sans text-sm text-cream/60 mb-4">Cocktail hour and reception magic that feels like being let in on something.</p>
                  <span className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase text-cream/80 group-hover:text-accent transition-colors">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link to="/services/private-magic-show" className="group block relative aspect-[3/4] overflow-hidden border border-accent/15 shadow-[0_0_20px_-5px_hsl(var(--accent)/0.1)]">
                <img src={parlorStageImg} alt="Scott Syme performing a private parlor show beneath emerald drapes" width={400} height={533} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Private</p>
                  <h3 className="font-serif text-2xl text-cream mb-3">Private Evenings</h3>
                  <p className="font-sans text-sm text-cream/60 mb-4">Milestones, dinners and parlor shows at home, for twenty to 120 guests.</p>
                  <span className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase text-cream/80 group-hover:text-accent transition-colors">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.3}>
            <div className="mt-12 flex justify-center">
              <Link to="/services" className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.3em] uppercase text-accent hover:text-accent/80 transition-colors">
                All experiences <ArrowRight size={14} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Voice Search FAQ */}
      <FAQSection
        schemaId="homepage-faq-schema"
        subtitle="Questions We're Often Asked"
        faqs={[
          {
            question: "What is the difference between close-up magic and a parlor show?",
            answer: "Two formats. Close-up is roaming: Scott moves between small groups during a cocktail hour, performing at arm's length with no stage and no setup. The parlor show is seated, roughly 45 minutes, with curated lighting, a signature soundtrack, and a room built on site. Cocktail hours take close-up. Programs that need a centerpiece take the parlor show. Many evenings use both.",
          },
          {
            question: "How many guests can a close-up magician entertain?",
            answer: "Close-up works for 50 to 500 guests. Above 250 we recommend a second magician and can refer one. Most bookings run two to three hours of continuous roaming, with a one-hour minimum. Scott works in groups of four to eight, moving through the room as the energy allows.",
          },
          {
            question: "What does the venue need to provide?",
            answer: "For a standard parlor show, nothing technical. All lighting and sound is self-contained and battery powered, so there are no outlets required and no cables across your floor. We need two things: parking close to the entrance, and a private room to change. The performance area is roughly 10 feet wide by 8 feet deep with a minimum 8 foot ceiling. Close-up needs no dedicated space at all.\n\nFor galas or stage programs above roughly 120 guests, house AV is required: handheld microphone, stand, headset microphone, a 3.5mm or Lightning input for playback, and a technician on site.",
          },
          {
            question: "Are you insured, and can you provide a certificate?",
            answer: "Yes. $1,000,000 per occurrence and $2,000,000 aggregate in commercial general liability through Specialty Insurance Agency. Your venue can be named as additional insured, and the certificate is issued within two business days. Most venues require it. We send it before they ask.",
          },
          {
            question: "Does White Rabbit travel outside of Los Angeles?",
            answer: "Yes. Los Angeles is home, and a good part of the year happens elsewhere: New York, Miami, Aspen, Jackson Hole, the Hamptons, Las Vegas, and internationally for destination weddings and corporate programs. Both formats travel.",
          },
        ]}
      />



      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-16 lg:py-20 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} loading="lazy" decoding="async" className="h-12 w-auto opacity-50 mx-auto mb-6" />
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-5">For Hosts Who Intend to Be Talked About</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6 leading-tight">
              An evening like this begins with a conversation.
            </h2>
            <p className="font-sans text-base text-muted-foreground italic mb-10 max-w-lg mx-auto">
              Your guests don't watch the show. They become the show.
            </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-10 py-4 hover:bg-primary hover:text-primary-foreground transition-colors">
              Inquire
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>);

};

export default Index;