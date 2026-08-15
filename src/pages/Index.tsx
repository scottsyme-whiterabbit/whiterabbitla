import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import threeStars from "@/assets/three-stars-gold.png";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import QuizNudge from "@/components/QuizNudge";
import FAQSection from "@/components/FAQSection";

import TestimonialCarousel from "@/components/TestimonialCarousel";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import Guestbook from "@/components/Guestbook";
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

import heroImage from "@/assets/hero-magic-cinematic.jpg";
import experienceImg from "@/assets/experience-closeup.jpg";
import scottDesertImg from "@/assets/scott-desert-sitting.jpg";
import experienceHeroImg from "@/assets/experience-hero-desert.jpg";
import eventCardsImg from "@/assets/cards-spring-bw.jpg";
import penthouseImg from "@/assets/event-penthouse-show.jpg";
import cocktailImg from "@/assets/event-closeup-cocktail.jpg";
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
import paramountLogo from "@/assets/logos/normalized/paramount.png";
import oliviarodrigoLogo from "@/assets/logos/normalized/oliviarodrigo.png";
import lionsgateLogo from "@/assets/logos/normalized/lionsgate.png";
import beverlyHiltonLogo from "@/assets/logos/normalized/beverlyhilton.png";
import magicCastleLogo from "@/assets/logos/normalized/magiccastle.png";
import sohohouseLogo from "@/assets/logos/normalized/sohohouse.png";
import agtLogo from "@/assets/logos/normalized/agt.png";

// Logos are pre-normalized (trimmed of baked padding, exported at 3x retina).
// `h` is the render height in px, tiered by aspect ratio for optical balance:
//   aspect > 2.5 → 20px, 1.5–2.5 → 26px, < 1.5 → 34px.
// Magic Castle is intentionally scaled up as a featured brand mark.
const clients: { name: string; logo: string; h: number }[] = [
  { name: "Disney", logo: disneyLogo, h: 20 },
  { name: "Rolls Royce", logo: rollsroyceLogo, h: 34 },
  { name: "Lionsgate", logo: lionsgateLogo, h: 20 },
  { name: "Paramount", logo: paramountLogo, h: 34 },
  { name: "Netflix", logo: netflixLogo, h: 20 },
  { name: "The Magic Castle", logo: magicCastleLogo, h: 40 },
  { name: "Morgan Stanley", logo: morganstanleyLogo, h: 20 },
  { name: "The Beverly Hilton", logo: beverlyHiltonLogo, h: 26 },
  { name: "Rivian", logo: rivianLogo, h: 34 },
  { name: "Olivia Rodrigo", logo: oliviarodrigoLogo, h: 26 },
  { name: "Soho House", logo: sohohouseLogo, h: 34 },
  { name: "America's Got Talent", logo: agtLogo, h: 26 },
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
  const [heroReviewIndex, setHeroReviewIndex] = useState(0);
  const [heroRotation, setHeroRotation] = useState(0);
  const [heroFading, setHeroFading] = useState(false);





  useEffect(() => {
    const interval = setInterval(() => {
      setHeroReviewIndex((prev) => (prev + 1) % heroReviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate triptych column positions every ~12s with a brief crossfade
  useEffect(() => {
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
  }, []);

  const seoTitle = "White Rabbit LA, Private Magic, by Appointment";
  const seoDescription = "Close-up magic and mentalism for private events in Los Angeles and select destinations. Magic Castle member trusted by Netflix, Disney, and Morgan Stanley.";

  // Homepage Person schema
  useJsonLd("homepage-person-schema", {
    "@type": "Person",
    name: "Scott Syme",
    jobTitle: "Magician & Mentalist",
    worksFor: { "@type": "Organization", name: "White Rabbit LA" },
    description: "World-class magician, Magic Castle member, and consultant to America's Got Talent and Disney Channel performers",
    url: "https://whiterabbitla.com/about",
    sameAs: ["https://www.instagram.com/scottsyme_/"],
  });

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
      <section className="relative overflow-hidden md:h-screen pt-32 md:pt-0 bg-forest-dark">
        {/* Triptych video container */}
        <div className="relative w-full h-full md:h-[calc(100vh-120px)] md:absolute md:top-[120px] md:left-0 md:right-0 md:bottom-0 bg-forest-dark">
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
                  className={`relative aspect-[9/16] md:aspect-auto md:h-full overflow-hidden bg-black transition-[border-color] duration-700 ${
                    position > 0 ? "border-l border-accent/20" : "border-l border-transparent"
                  }`}
                >
                  <video
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
                      if (v.duration && isFinite(v.duration)) {
                        v.currentTime = clip.offset % v.duration;
                      }
                    }}
                  >
                    <source src={clip.mobileSrc} media="(max-width: 768px)" type="video/mp4" />
                    <source src={clip.src} type="video/mp4" />
                  </video>
                </div>
              );
            })}
          </div>
          {/* Diagonal emerald overlay for headline contrast: deep at bottom-left, light at top-right */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1B3A2DA6] via-[#1B3A2D4D] to-[#1B3A2D33] pointer-events-none hidden md:block" />
          {/* Bottom reinforcement for CTA and quote bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-[#1B3A2D80] via-[#1B3A2D1A] to-transparent pointer-events-none hidden md:block" />
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

        {/* Text overlaid, bottom-left aligned (desktop only) */}
        <div className="hidden md:flex absolute inset-0 z-10 flex-col items-start justify-end pb-28 md:pb-24 pl-6 md:pl-[10vw] pr-6 text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="relative mb-4 md:mb-5 font-sans text-xs tracking-[0.3em] uppercase text-accent drop-shadow-lg"
            style={{ textShadow: "0 0 40px hsl(var(--accent) / 0.35), 0 0 80px hsl(var(--accent) / 0.15)" }}
          >
            Private Magic · Los Angeles & Beyond
          </motion.p>
          <motion.h1
            className="relative text-2xl md:text-[1.875rem] lg:text-[2.5rem] text-cream/90 tracking-wide font-bold font-serif drop-shadow-lg max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ textShadow: "0 0 60px hsl(var(--accent) / 0.35), 0 0 120px hsl(var(--accent) / 0.15)" }}>
            Experience Magic<br />
            <span className="block mt-2 md:mt-3">That Makes You Feel Truly Alive</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="relative mt-5 md:mt-7 max-w-xl font-sans text-sm md:text-base text-cream/75 italic"
          >
            Some evenings are catered. Some are staged. The best are conjured.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.95 }}
            className="relative mt-4 md:mt-5 font-sans text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-cream/60 drop-shadow-md"
          >
            Los Angeles · Aspen · Jackson Hole · The Hamptons · Miami
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="relative mt-6 md:mt-8">
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-cream px-10 py-4 hover:bg-accent hover:text-accent-foreground transition-colors">
              Inquire
            </button>
          </motion.div>
        </div>

        {/* Rolling reviews, pinned to bottom of hero (desktop only) */}
        <motion.div
          className="hidden md:block absolute bottom-0 left-0 right-0 z-20 bg-forest-dark/80 backdrop-blur-sm py-4 border-t border-accent/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}>
          <div className="max-w-3xl mx-auto px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroReviewIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) =>
                    <Star key={i} size={14} className="fill-accent text-accent" />
                  )}
                </div>
                <p className="font-serif text-sm md:text-base text-cream/90 text-center">
                  "{heroReviews[heroReviewIndex].text}"
                </p>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/60 whitespace-nowrap">
{heroReviews[heroReviewIndex].name}{heroReviews[heroReviewIndex].role ? `, ${heroReviews[heroReviewIndex].role}` : ""}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Mobile text section */}
      <section className="md:hidden bg-cream py-8 px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="text-center font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4"
        >
          Private Magic · Los Angeles & Beyond
        </motion.p>
        <motion.h2
          className="text-center text-2xl text-foreground tracking-wide font-bold font-serif max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Experience Magic<br />
          <span className="block mt-2">That Makes You Feel Truly Alive</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-center mt-5 max-w-md mx-auto font-sans text-sm text-muted-foreground italic"
        >
          Some evenings are catered. Some are staged. The best are conjured.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.75 }}
          className="text-center mt-4 font-sans text-[10px] tracking-[0.35em] uppercase text-muted-foreground/80"
        >
          Los Angeles · Aspen · Jackson Hole · The Hamptons · Miami
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex justify-center mt-6">
          <button
            onClick={openQuiz}
            className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-6 py-2 hover:bg-accent hover:text-accent-foreground transition-colors max-w-[280px] w-full text-center">
            Inquire
          </button>
        </motion.div>
      </section>

      {/* Rolling reviews, mobile placement after text section */}
      <motion.div
        className="md:hidden bg-forest-dark/80 backdrop-blur-sm py-4 border-t border-accent/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}>
        <div className="max-w-3xl mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroReviewIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center gap-3"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) =>
                  <Star key={i} size={14} className="fill-accent text-accent" />
                )}
              </div>
              <p className="font-serif text-sm text-cream/90 text-center">
                "{heroReviews[heroReviewIndex].text}"
              </p>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/60 whitespace-nowrap">
{heroReviews[heroReviewIndex].name}{heroReviews[heroReviewIndex].role ? `, ${heroReviews[heroReviewIndex].role}` : ""}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Client Logos · static stacked block */}
      <AnimatedSection>
        <section className="bg-gradient-to-b from-[#F8F5F0] to-[#F0E8D8] py-14 md:py-16">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center font-sans text-[11px] tracking-[0.4em] uppercase text-gold mb-10">
              IN GOOD COMPANY
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-5 gap-y-6 sm:gap-x-8 sm:gap-y-10 md:gap-x-12 md:gap-y-12 items-center justify-items-center">
              {clients.map((client) => (
                <div key={client.name} className="flex items-center justify-center h-10 md:h-12 w-full">
                  <img
                    src={client.logo}
                    alt={`${client.name} logo, White Rabbit client`}
                    loading="lazy"
                    decoding="async"
                    style={{
                      height: `${client.h}px`,
                      width: "auto",
                      maxWidth: "100%",
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
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-16 w-auto opacity-50" />
      </div>

      {/* From the Guestbook */}
      <AnimatedSection>
        <Guestbook />
      </AnimatedSection>

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
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-14 w-auto opacity-50" />
      </div>

      {/* What Clients Are Saying, Testimonial Carousel */}
      <AnimatedSection>
        <div className="relative">
          {/* Ambient warm glow behind testimonials */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.06)_0%,_transparent_70%)] pointer-events-none" />
          <TestimonialCarousel />
        </div>
      </AnimatedSection>

      {/* Discovery Quiz CTA */}
      <QuizCTA title="Wondering If Magic Is Right for Your Event?" />

      <div className="flex justify-center">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-14 w-auto opacity-50" />
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
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-14 w-auto opacity-50" />
      </div>

      {/* Discover More */}
      <section className="py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Discover More</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-16 text-center">Go Deeper</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection>
              <Link to="/experience" className="group block relative aspect-[3/4] overflow-hidden border border-accent/15 shadow-[0_0_20px_-5px_hsl(var(--accent)/0.1)]">
                <img src={experienceHeroImg} alt="The White Rabbit experience" width={400} height={533} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                {/* Corner filigree */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Experience</p>
                  <h3 className="font-serif text-2xl text-cream mb-3">See What Awaits</h3>
                  <p className="font-sans text-sm text-cream/60 mb-4">Close-up magic, parlor shows, and fully produced private events.</p>
                  <span className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase text-cream/80 group-hover:text-accent transition-colors">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <Link to="/about" className="group block relative aspect-[3/4] overflow-hidden border border-accent/15 shadow-[0_0_20px_-5px_hsl(var(--accent)/0.1)]">
                <img src={scottDesertImg} alt="Scott Syme, magician and founder of White Rabbit" width={400} height={533} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">About</p>
                  <h3 className="font-serif text-2xl text-cream mb-3">Meet Scott Syme</h3>
                  <p className="font-sans text-sm text-cream/60 mb-4">The story behind the magician who built a luxury experience from scratch.</p>
                  <span className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase text-cream/80 group-hover:text-accent transition-colors">
                    Read More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link to="/blog" className="group block relative aspect-[3/4] overflow-hidden border border-accent/15 shadow-[0_0_20px_-5px_hsl(var(--accent)/0.1)]">
                <img src={cocktailImg} alt="Luxury event entertainment and magic" width={400} height={533} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent/30" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Blog</p>
                  <h3 className="font-serif text-2xl text-cream mb-3">Planning Your Event</h3>
                  <p className="font-sans text-sm text-cream/60 mb-4">Tips, guides, and inspiration for unforgettable private events.</p>
                  <span className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase text-cream/80 group-hover:text-accent transition-colors">
                    Browse <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          </div>
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
            <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-12 w-auto opacity-50 mx-auto mb-6" />
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