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
import NewsletterSignup from "@/components/NewsletterSignup";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import Guestbook from "@/components/Guestbook";
import heroVideo720 from "@/assets/triptych/hero-720.mp4.asset.json";
import heroVideo480 from "@/assets/triptych/hero-480.mp4.asset.json";
import heroVideoPoster from "@/assets/triptych/hero-triptych-poster.jpg.asset.json";

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
import rubikShowImg from "@/assets/event-rubiks-show.jpg";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import youtubeLogo from "@/assets/logos/youtube.png";
import hyattLogo from "@/assets/logos/hyatt.png";
import rivianLogo from "@/assets/logos/rivian.png";
import paramountLogo from "@/assets/logos/paramount.png";
import oliviarodrigoLogo from "@/assets/logos/oliviarodrigo.png";
import taittingerLogo from "@/assets/logos/taittinger.png";
import pistolaLogo from "@/assets/logos/pistola-new.png";
import lionsgateLogo from "@/assets/logos/lionsgate.png";
import agtLogo from "@/assets/logos/agt.png";
import beverlyHiltonLogo from "@/assets/logos/beverlyhilton.png";
import sohohouseLogo from "@/assets/logos/sohohouse-new.png";
import gravitasLogo from "@/assets/logos/gravitas.webp";
import magicCastleLogo from "@/assets/logos/magiccastle.png";

const clients = [
{ name: "Netflix", logo: netflixLogo },
{ name: "Disney", logo: disneyLogo },
{ name: "Rolls Royce", logo: rollsroyceLogo },
{ name: "Morgan Stanley", logo: morganstanleyLogo },
{ name: "YouTube", logo: youtubeLogo },
{ name: "Hyatt", logo: hyattLogo },
{ name: "The Beverly Hilton", logo: beverlyHiltonLogo },
{ name: "Soho House", logo: sohohouseLogo },
{ name: "Rivian", logo: rivianLogo },
{ name: "Paramount", logo: paramountLogo },
{ name: "Olivia Rodrigo", logo: oliviarodrigoLogo },
{ name: "Taittinger", logo: taittingerLogo },
{ name: "Lionsgate", logo: lionsgateLogo },
{ name: "Pistola", logo: pistolaLogo },
{ name: "Gravitas Beverly Hills", logo: gravitasLogo },
{ name: "The Magic Castle", logo: magicCastleLogo }];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroReviewIndex((prev) => (prev + 1) % heroReviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const seoTitle = "White Rabbit LA — Private Magic, by Appointment";
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
        {/* Image container */}
        <div className="relative w-full aspect-video md:aspect-auto md:h-screen md:absolute md:inset-0 bg-forest-dark">
          <video
            poster={heroVideoPoster.url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            width={1920}
            height={1080}
            className="w-full h-full object-cover md:object-[center_60%]"
          >
            <source src={heroVideo720.url} type="video/mp4" media="(min-width: 768px)" />
            <source src={heroVideo480.url} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/30 to-forest-dark/10 hidden md:block" />
          {/* Bottom 40% gradient for text contrast */}
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/15 to-transparent hidden md:block" />
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

        {/* Text overlaid — bottom-left aligned (desktop only) */}
        <div className="hidden md:flex absolute inset-0 z-10 flex-col items-start justify-end pb-28 md:pb-24 pl-6 md:pl-[10vw] pr-6 text-left">
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
            On call for private events across America's most considered destinations.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="relative mt-6 md:mt-8">
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-cream px-10 py-4 hover:bg-accent hover:text-accent-foreground transition-colors">
              Book an Experience
            </button>
          </motion.div>
        </div>

        {/* Rolling reviews — pinned to bottom of hero (desktop only) */}
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
                  — {heroReviews[heroReviewIndex].name}{heroReviews[heroReviewIndex].role ? `, ${heroReviews[heroReviewIndex].role}` : ""}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Mobile text section */}
      <section className="md:hidden bg-cream py-8 px-6">
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
          On call for private events across America's most considered destinations.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex justify-center mt-6">
          <button
            onClick={openQuiz}
            className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors max-w-[280px] w-full text-center">
            Book an Experience
          </button>
        </motion.div>
      </section>

      {/* Rolling reviews — mobile placement after text section */}
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
                — {heroReviews[heroReviewIndex].name}{heroReviews[heroReviewIndex].role ? `, ${heroReviews[heroReviewIndex].role}` : ""}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Client Logos — static grid */}
      <AnimatedSection>
        <section className="bg-gradient-to-b from-[#F8F5F0] to-[#F0E8D8] py-10">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-accent mb-6">
              Trusted by World-Class Brands
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:gap-x-8 md:gap-y-5">
              {clients.map((client) => (
                <div key={client.name} className="flex items-center justify-center" style={{ width: (client.name === 'The Magic Castle') ? '150px' : (client.name === 'Soho House' || client.name === 'Rivian' || client.name === 'Gravitas Beverly Hills') ? '120px' : '90px', height: (client.name === 'The Magic Castle') ? '52px' : (client.name === 'Soho House' || client.name === 'Rivian' || client.name === 'Gravitas Beverly Hills') ? '42px' : '32px' }}>
                  <img
                    src={client.logo}
                    alt={`${client.name} logo, White Rabbit client`}
                    width={90}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full w-auto h-auto object-contain opacity-60 hover:opacity-90 transition-opacity brightness-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>


      {/* From the Guestbook */}
      <AnimatedSection>
        <Guestbook />
      </AnimatedSection>

      {/* Quiz Nudge */}
      <QuizNudge />

      {/* The Experience Teaser */}
      <section className="py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Experience</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
                More Than Magic.<br />A Feeling.
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">Scott Syme is the magician behind White Rabbit. A member of the Magic Castle® and consultant to performers on America's Got Talent and Disney Channel, Scott has spent years going deeper into a single question than most people think to ask — what makes someone feel genuinely alive in a room full of people?</p>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">Everything about White Rabbit is built around the answer. Nothing is accidental. Scott blends interactive magic, mentalism, and impossible coincidences with the warmth of a seasoned host, transforming any room into something cinematic, intimate, and utterly alive. Curated lighting, a signature soundtrack, and moments so close you can feel them. Your guests don't watch — they're in it, fully present. That is White Rabbit.







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

      {/* What Clients Are Saying — Testimonial Carousel */}
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
              <img src={parlorShowImg} alt="Scott Syme private magic show with emerald curtains and uplighting" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
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
              <img src={groupFinaleImg} alt="Group photo after a White Rabbit magic experience in Los Angeles" width={400} height={300} loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 33vw" className="w-full h-full object-cover" />
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
        subtitle="Common Questions"
        title="What People Ask"
        faqs={[
          {
            question: "Who is the best magician for a birthday party in Los Angeles?",
            answer: "Scott Syme of White Rabbit is one of the most sought-after magicians in Los Angeles for birthday parties and private celebrations. A member of the Magic Castle® in Hollywood, Scott brings world-class close-up magic, mentalism, and a curated atmosphere to milestone birthdays, dinner parties, and exclusive gatherings of all sizes.",
          },
          {
            question: "What is the best entertainment for a wedding cocktail hour?",
            answer: "Close-up magic is widely considered the best cocktail hour entertainment because it breaks the ice between guests who've never met. Scott Syme performs intimate mentalism and interactive magic for small groups, creating shared moments of laughter and amazement that set the tone for the entire evening.",
          },
          {
            question: "What type of magic is best for a corporate event?",
            answer: "For corporate events, close-up roaming magic is the gold standard. Scott moves through cocktail hours, galas, and receptions performing mentalism and interactive magic for small groups, turning strangers into collaborators within minutes. For events that call for a centerpiece moment, the Private Magic Show is a curated 45-minute theatrical experience designed for groups of 20 to 120.",
          },
          {
            question: "How far in advance should I book a magician?",
            answer: "We recommend reaching out 4 to 8 weeks before your event, though peak seasons like the holidays and summer weekends can fill months in advance. Contact us with your date and we'll confirm availability within 24 hours.",
          },
          {
            question: "What makes White Rabbit different from other magicians?",
            answer: "White Rabbit is not just a magic show. It's a hospitality-driven experience. Scott Syme combines world-class mentalism and interactive magic with the warmth of a five-star host, curated lighting, a signature soundtrack, and an atmosphere that makes guests feel truly cared for. That's why brands like Netflix, Disney, and Morgan Stanley keep coming back.",
          },
          {
            question: "Does White Rabbit travel outside of Los Angeles?",
            answer: "Yes. While based in Los Angeles, Scott regularly performs at events nationwide, from New York and Miami to Las Vegas, Aspen, and beyond. Travel is available for corporate events, destination weddings, and private celebrations anywhere in the world.",
          },
        ]}
      />

      {/* Newsletter Signup */}
      <AnimatedSection>
        <section className="py-16 lg:py-20 border-t border-border/30">
          <div className="max-w-2xl mx-auto px-6">
            <NewsletterSignup variant="section" />
          </div>
        </section>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-12 lg:py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-12 w-auto opacity-50 mx-auto mb-4" />
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Your Guests Deserve This</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
              Don't Leave the Best Part of Your Event to Chance
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-4">
              The venue is booked. The caterer is confirmed. The playlist is set.
              But what happens when your guests are standing in a circle, drink in hand, waiting for something to happen?
            </p>
            <p className="font-sans text-base text-muted-foreground mb-10">
              Scott fills that moment with joy, laughter, and genuine connection. No awkward silences. No forgettable entertainment.
              Just an atmosphere your guests will be talking about long after the night is over.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors">
              Book Now
            </button>
            <p className="font-sans text-xs text-muted-foreground mt-4">Limited dates each month. No associates. Just Scott.</p>
          </div>
        </section>
      </AnimatedSection>
    </main>);

};

export default Index;