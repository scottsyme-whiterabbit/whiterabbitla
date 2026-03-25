import { useState, useEffect } from "react";
import { Star, CalendarCheck } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { trackCTAClick } from "@/lib/analytics";
import AnimatedSection from "@/components/AnimatedSection";
import FAQSection from "@/components/FAQSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import BookingQuiz from "@/components/BookingQuiz";

import wrLogo from "@/assets/wr-logo-stars-white.png";
import heroImg from "@/assets/event-parlor-stage.jpg";
import scottBwImg from "@/assets/scott-couch.jpg";
import cardsImg from "@/assets/cards-spring-bw.jpg";
import threeStars from "@/assets/three-stars-gold.png";

// Guest reaction & event photos from gallery
import cuMagicReactionImg from "@/assets/event-cu-magic-reaction.jpg";
import penthouseImg from "@/assets/event-penthouse-show.jpg";
import crowdReactionImg from "@/assets/event-crowd-reaction.jpg";
import parlorShowImg from "@/assets/event-parlor-show.jpg";
import groupFinaleImg from "@/assets/event-group-finale.jpg";
import rubikShowImg from "@/assets/event-rubiks-show.jpg";
import cocktailImg from "@/assets/event-closeup-cocktail.jpg";
import intimateImg from "@/assets/event-closeup-intimate.jpg";
import restaurantMagicImg from "@/assets/event-restaurant-magic.jpg";

// Client logos
import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import hyattLogo from "@/assets/logos/hyatt.png";
import sohohouseLogo from "@/assets/logos/sohohouse-new.png";
import beverlyHiltonLogo from "@/assets/logos/beverlyhilton.png";
import paramountLogo from "@/assets/logos/paramount.png";


const eventTypeCards = [
  { title: "Corporate Events & Team Building", desc: "Roaming close-up magic and parlor shows for holiday parties, client appreciation events, product launches, and team off-sites." },
  { title: "Weddings & Rehearsal Dinners", desc: "Ice-breaking cocktail hour magic, reception entertainment, and intimate rehearsal dinner shows that set the tone for the weekend." },
  { title: "Private Parties & Milestone Celebrations", desc: "Birthday parties, anniversary dinners, graduation celebrations, and intimate gatherings of 10 to 200 guests." },
  { title: "Fundraisers & Charity Galas", desc: "High-impact entertainment that energizes donors and creates memorable moments that drive generosity." },
  { title: "Holiday Parties", desc: "Thanksgiving, Christmas, New Year's Eve, and seasonal celebrations with magic that brings people together." },
  { title: "Restaurant & Venue Entertainment", desc: "Weekly or special-event entertainment for restaurants, hotels, and private clubs seeking a signature experience." },
];

const clients = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "Hyatt", logo: hyattLogo },
  { name: "The Beverly Hilton", logo: beverlyHiltonLogo },
  { name: "Soho House", logo: sohohouseLogo },
  { name: "Paramount", logo: paramountLogo },
];

const testimonials = [
  { quote: "Scott performed at a 200-person event for us and the guests absolutely LOVED him. I could not recommend him more!", source: "Morgan Stanley" },
  { quote: "The best entertainment decision we ever made. Our guests are STILL talking about it.", source: "Corporate Event Planner" },
  { quote: "He elevated our party in ways I didn't expect. He was everyone's favorite part.", source: "Zara M." },
];

const galleryPhotos = [
  { src: cuMagicReactionImg, alt: "Guest reacting with amazement to close-up card magic" },
  { src: penthouseImg, alt: "Private magic show in a luxury penthouse setting" },
  { src: crowdReactionImg, alt: "Audience reacting with excitement during a private magic show" },
  { src: cocktailImg, alt: "Close-up magic during a cocktail hour event" },
  { src: rubikShowImg, alt: "Scott Syme performing Rubik's cube magic at a live show" },
  { src: parlorShowImg, alt: "Private magic show with emerald curtains and uplighting" },
  { src: intimateImg, alt: "Intimate close-up magic with amazed guests" },
  { src: groupFinaleImg, alt: "Group photo after a White Rabbit magic experience" },
  { src: restaurantMagicImg, alt: "Close-up magic at a luxury restaurant event" },
];

const faqs = [
  {
    question: "How do I book a magician for my event?",
    answer: "Fill out the consultation form on this page or call (424) 394-1850. We'll discuss your event details, recommend the right format (close-up, parlor, or stage), and put together a custom package.",
  },
  {
    question: "What types of events can Scott perform at?",
    answer: "White Rabbit performs at corporate events, weddings, private parties, fundraisers, holiday parties, and restaurant/venue entertainment. We serve clients nationwide and internationally.",
  },
  {
    question: "How far in advance should I book?",
    answer: "We recommend booking 4-8 weeks in advance, though last-minute availability is sometimes possible. Popular dates (holidays, wedding season) book 2-3 months out.",
  },
  {
    question: "Does Scott travel outside of Los Angeles?",
    answer: "Yes. While based in Los Angeles, Scott regularly performs at events nationwide — from New York and Miami to Las Vegas, Aspen, and beyond. Travel is available for corporate events, destination weddings, and private celebrations anywhere in the world.",
  },
  {
    question: "What is close-up magic and is it right for my event?",
    answer: "Close-up magic is performed inches from your guests using cards, coins, and everyday objects. It's perfect for cocktail hours, receptions, and networking events. Guests interact directly with the magician, making it the most memorable form of live entertainment.",
  },
  {
    question: "What makes White Rabbit different from other magicians?",
    answer: "White Rabbit is not just a magic show — it's a hospitality-driven experience. Scott combines world-class mentalism and interactive magic with the warmth of a five-star host, curated lighting, a signature soundtrack, and an atmosphere that makes guests feel truly cared for. That's why brands like Netflix, Disney, and Morgan Stanley keep coming back.",
  },
];

const Consultation = () => {
  const seoTitle = "Free Consultation | White Rabbit LA — Luxury Event Magician";
  const seoDescription = "Book a free consultation with America's premier close-up magician. Corporate events, weddings, private parties and galas — nationwide.";

  const { openQuiz } = useBookingQuiz();
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setStickyVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => openQuiz("Facebook / Meta Ad");



  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title={seoTitle} description={seoDescription} canonical="/consultation" />
      <BookingQuiz />

      {/* Sticky CTA — mobile bottom bar + desktop floating pill */}
      {stickyVisible && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forest-dark/95 backdrop-blur-md border-t border-accent/20 p-3">
            <button
              onClick={() => { trackCTAClick("Book a Consultation", "consultation_sticky_mobile"); openQuiz("Facebook / Meta Ad"); }}
              className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground py-3.5 hover:bg-accent/80 transition-colors"
            >
              Book a Consultation
            </button>
          </div>
          <button
            onClick={() => { trackCTAClick("Book a Consultation", "consultation_sticky_desktop"); openQuiz("Facebook / Meta Ad"); }}
            className="hidden md:flex fixed bottom-8 right-8 z-50 items-center gap-2.5 bg-accent text-accent-foreground font-sans text-xs tracking-[0.2em] uppercase px-6 py-3.5 shadow-lg hover:bg-accent/90 hover:shadow-xl hover:scale-105 transition-all duration-300"
            aria-label="Book a Consultation"
          >
            <CalendarCheck size={16} strokeWidth={1.5} />
            Book a Consultation
          </button>
        </>
      )}
      {/* HERO — full-bleed photo */}
      <section className="relative h-[50vh] min-h-[400px]">
        <img
          src={heroImg}
          alt="White Rabbit private magic show with emerald curtains and cinematic lighting"
          className="absolute inset-0 w-full h-full object-cover object-[center_40%] md:object-[center_30%]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-12 w-full">
            <AnimatedSection>
              <img
                src={wrLogo}
                alt="White Rabbit LA"
                className="h-14 md:h-16 w-auto mb-6 opacity-90"
              />
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-3">
                Make Your Next Event <span className="text-accent">Unforgettable</span>
              </h1>
              <p className="font-sans text-base text-cream/70 max-w-lg">
                Luxury magic entertainment by Scott Syme — available nationwide for corporate events, weddings, private parties, and galas.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* INTRO — Opening paragraph */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
              Scott Syme is the creative force behind White Rabbit — a luxury magic experience built on a simple belief: the best entertainment makes people feel truly alive. A proud member of the world-famous Magic Castle® in Hollywood and consultant to performers on America's Got Talent and Disney Channel, Scott brings both elite craft and warm showmanship to every performance. Fortune 500 companies, charitable organizations, and the most discerning private clients trust White Rabbit with their most important events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToForm}
                className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
              >
                Book Your Free Consultation
              </button>
              <a
                href="tel:+14243941850"
                className="font-sans text-sm tracking-[0.2em] uppercase border border-border text-foreground px-10 py-4 hover:border-accent/40 transition-colors text-center"
              >
                Call (424) 394-1850
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CLIENT LOGOS */}
      <section className="bg-forest-dark py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-10">
            Trusted by World-Class Brands
          </p>
        </div>
        <div className="relative">
          <div className="flex animate-scroll-logos" style={{ width: 'max-content' }}>
            {[...clients, ...clients, ...clients].map((client, i) => (
              <div key={`${client.name}-${i}`} className="flex-shrink-0 flex items-center justify-center px-8 md:px-10" style={{ width: '180px', height: '60px' }}>
                <img
                  src={client.logo}
                  alt={`${client.name} logo`}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full w-auto h-auto object-contain opacity-50 hover:opacity-80 transition-opacity brightness-0 invert"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SCOTT — B&W Photo + Bio */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={scottBwImg}
                alt="Scott Syme, luxury event magician"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Magician</p>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground mb-6 leading-tight">
              Scott Syme
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-6">
              Based in Los Angeles, Scott is the creative force behind White Rabbit — a luxury magic experience
              built on a simple belief: the best entertainment makes people feel truly alive. A proud member
              of the world-famous Magic Castle® in Hollywood and consultant to performers on America's Got
              Talent and Disney Channel, Scott brings both elite craft and warm showmanship to every performance.
            </p>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
              Fortune 500 companies, charitable organizations, and the most discerning private clients
              — Netflix, Disney, Rolls Royce, Morgan Stanley — trust Scott with their most important events.
              When you hire White Rabbit, you're not just booking a magician. You're hiring someone who has
              dedicated his life to making people feel extraordinary.
            </p>
            <button
              onClick={() => { trackCTAClick("Book a Consultation", "consultation_bio"); openQuiz("Facebook / Meta Ad"); }}
              className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book a Consultation
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Branded divider */}
      <div className="flex justify-center py-4">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-12 w-auto opacity-50" />
      </div>

      {/* MORE THAN MAGIC */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="order-2 lg:order-1">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Experience</p>
              <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
                More Than Magic.<br />A Feeling.
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Scott blends interactive magic, mentalism, and impossible coincidences with the warmth
                of a seasoned host — transforming any room into something cinematic, intimate, and utterly
                alive. Curated lighting, a signature soundtrack, and moments so close you can feel them.
                This isn't a magic show. It's a White Rabbit experience.
              </p>
              <button
                onClick={scrollToForm}
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Book a Consultation
              </button>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="order-1 lg:order-2 aspect-[4/5] overflow-hidden">
              <img
                src={cardsImg}
                alt="Scott Syme performing close-up card magic at a luxury event"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* EVENT TYPES — CityPage style grid */}
      <section className="py-16 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Event Types</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10">Types of Events We Serve</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypeCards.map((evt, i) => (
              <AnimatedSection key={evt.title} delay={Math.min(i * 0.05, 0.25)}>
                <div className="border border-border p-6 h-full bg-background">
                  <h3 className="font-serif text-lg text-foreground mb-2">{evt.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">{evt.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TESTIMONIAL */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 leading-relaxed mb-8">
              "{testimonials[0].quote}"
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              — {testimonials[0].source}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* PHOTO GALLERY — Guest reactions */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">From Our Events</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10">Moments That Speak for Themselves</h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPhotos.map((photo, i) => (
              <AnimatedSection key={i} delay={Math.min(i * 0.05, 0.25)}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* MORE TESTIMONIALS */}
      <section className="py-16 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="text-center flex flex-col items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="font-serif text-base md:text-lg text-foreground leading-relaxed">"{t.quote}"</p>
                  <p className="font-sans text-xs tracking-[0.2em] uppercase text-accent/80">
                    — {t.source}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection
        schemaId="consultation-faq-schema"
        subtitle="Common Questions"
        title="Frequently Asked Questions"
        faqs={faqs}
      />

      {/* CONSULTATION CTA */}
      <section className="py-16 md:py-24 px-6 bg-forest-dark">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-12 w-auto opacity-50" />
          </div>
          <h2 className="font-serif text-2xl md:text-4xl text-cream mb-4">
            Book Your <span className="text-accent">Free Consultation</span>
          </h2>
          <p className="font-sans text-sm text-cream/60 mb-10 max-w-md mx-auto">
            Tell us about your event and we'll be in touch within 24 hours with a custom recommendation.
          </p>
          <button
            onClick={() => { trackCTAClick("Book a Consultation", "consultation_form_section"); openQuiz("Facebook / Meta Ad"); }}
            className="w-full sm:w-auto bg-accent text-accent-foreground font-sans text-sm tracking-[0.2em] uppercase px-10 py-4 hover:bg-accent/85 transition-colors"
          >
            Book a Consultation
          </button>
        </div>
      </section>

      {/* FINAL CTA */}
      <AnimatedSection>
        <section className="py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Your Guests Deserve This</h2>
            <p className="font-sans text-base text-muted-foreground mb-8">
              The venue is booked. The caterer is confirmed. But what happens when your guests are standing in a circle, drink in hand, waiting for something to happen? Scott fills that moment with joy, laughter, and genuine connection.
            </p>
            <button
              onClick={scrollToForm}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book Your Free Consultation
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* MINI FOOTER */}
      <footer className="py-10 text-center border-t border-border">
        <p className="font-serif text-sm text-muted-foreground">
          White Rabbit LA · Luxury Magic Entertainment
        </p>
        <a
          href="https://whiterabbitla.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs text-accent/60 hover:text-accent transition-colors mt-2 inline-block"
        >
          whiterabbitla.com
        </a>
      </footer>
    </div>
  );
};

export default Consultation;
