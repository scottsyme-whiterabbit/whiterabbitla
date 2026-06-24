import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Users, Award, Sparkles, Globe, Copy, Check, ArrowRight, Shield, Clock, Shirt, MapPin, Monitor, MessageSquare } from "lucide-react";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import QuizNudge from "@/components/QuizNudge";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import threeStars from "@/assets/three-stars-gold.png";

import heroImg from "@/assets/event-parlor-stage.jpg";
import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-show.jpg";
import scottImg from "@/assets/scott-couch.jpg";
import crowdImg from "@/assets/event-crowd-reaction.jpg";
import cardsImg from "@/assets/event-cards-emerald.jpg";
import reactionImg from "@/assets/event-guest-laughing.jpg";
import penthouseImg from "@/assets/event-penthouse-show.jpg";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import youtubeLogo from "@/assets/logos/youtube.png";
import hyattLogo from "@/assets/logos/hyatt.png";
import rivianLogo from "@/assets/logos/rivian.png";
import paramountLogo from "@/assets/logos/paramount.png";
import lionsgateLogo from "@/assets/logos/lionsgate.png";
import agtLogo from "@/assets/logos/agt.png";

const clientLogos = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "YouTube", logo: youtubeLogo },
  { name: "Hyatt", logo: hyattLogo },
  { name: "Rivian", logo: rivianLogo },
  { name: "Paramount", logo: paramountLogo },
  { name: "Lionsgate", logo: lionsgateLogo },
  { name: "America's Got Talent", logo: agtLogo },
];

const stats = [
  { icon: Users, label: "Guests Entertained", value: "10,000+" },
  { icon: Star, label: "Google Rating", value: "5.0 ★" },
  { icon: Award, label: "Magic Castle® Member", value: "Hollywood" },
  { icon: Globe, label: "Available", value: "Nationwide" },
];

const logistics = [
  { icon: Shield, title: "Insurance", detail: "Fully insured with general liability coverage. COI available on request." },
  { icon: Monitor, title: "Setup", detail: "Zero. No stage, no power, no AV, no backdrop. Scott integrates into your existing event flow." },
  { icon: Clock, title: "Timing", detail: "2–3 hours for cocktail/roaming magic. 45–60 minutes for a private parlor show. Flexible to your run-of-show." },
  { icon: MessageSquare, title: "Coordination", detail: "Scott communicates directly with your team — venue contact, timeline, room layout, guest count, VIP notes." },
  { icon: MapPin, title: "Travel", detail: "Based in Los Angeles. Available worldwide. Travel fees quoted per event — no surprises." },
  { icon: Shirt, title: "Attire", detail: "Black tie, business formal, themed — coordinated with your event's dress code." },
  { icon: Users, title: "Capacity", detail: "Roaming close-up magic for 20–300+ guests. Private parlor shows for 20–100." },
];

const testimonials = [
  {
    quote: "Scott performed at a 200-person event for us and the guests absolutely LOVED him. I could not recommend him more. We can't wait to have him back.",
    name: "Jamie I.",
    context: "Morgan Stanley, 200-Person Corporate Event",
  },
  {
    quote: "He was fantastic to work with from the moment I reached out through to the night of the show when he stuck around and spoke with several members of our group well after his performance was over.",
    name: "Josh T.",
    context: "Men's Group Host",
  },
  {
    quote: "We had Scott perform magic for a black tie event recently. Scott absolutely did an amazing job engaging with everyone.",
    name: "Andres O.",
    context: "Black Tie Event",
  },
];

const SEND_TO_CLIENT_EMAIL = `Subject: Entertainment Idea for [EVENT NAME] — You'll Want to See This

Hi [NAME],

I came across a luxury entertainment option I think would be perfect for [EVENT NAME]. His name is Scott Syme — he's the magician behind White Rabbit, and his client list includes Netflix, Morgan Stanley, Disney, Rolls Royce, and Hyatt.

He does close-up magic during cocktail hours and full private shows with cinematic production — emerald curtains, uplighting, curated soundtrack. It's more of an experience than a magic show. Every review is 5 stars.

Here's his lookbook so you can see for yourself:
https://whiterabbitla.com/deck

And if you want to check availability:
https://whiterabbitla.com/quiz

I think this would make [EVENT NAME] truly unforgettable.

Best,
[YOUR NAME]`;

const Planners = () => {
  const { openQuiz } = useBookingQuiz();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  useScrollDepth("planners");

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SEND_TO_CLIENT_EMAIL);
      setCopied(true);
      toast({ title: "Email template copied", description: "Paste it into your email client and customize the bracketed fields." });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Couldn't copy", description: "Please select and copy manually.", variant: "destructive" });
    }
  };

  return (
    <main id="main-content" className="pt-20">
      <SEOHead
        title="For Event Planners & DMCs | White Rabbit Magic — Los Angeles"
        description="The magician event planners and DMCs trust for corporate events, galas, and weddings. Zero setup, full insurance, available nationwide. Check availability."
        canonical="/planners"
        ogImage={heroImg}
      />

      {/* Hero — Full-bleed photo */}
      <section className="relative min-h-[75vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="White Rabbit private magic show — emerald curtains and cinematic uplighting at a luxury corporate event"
            width={1200}
            height={800}
            className="w-full h-full object-cover object-[center_30%]"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/50 to-forest-dark/10" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 w-full text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">For Event Professionals</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6">
              A Magician Your Clients Will Thank You For
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-2xl mx-auto leading-relaxed mb-10">
              Scott Syme is the entertainment recommendation that makes planners look brilliant. Magic Castle member. 5.0 on Google. Trusted by Netflix, Disney, Morgan Stanley, and the planners behind their biggest events.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors"
              >
                Check Availability <ArrowRight size={14} />
              </Link>
              <button
                onClick={openQuiz}
                className="font-sans text-sm tracking-[0.2em] uppercase border border-cream/30 text-cream px-8 py-4 hover:border-cream/60 transition-colors"
              >
                Take the Quiz
              </button>
            </div>
            <p className="font-sans text-sm text-cream/40 italic mt-6">35-second quiz — no commitment required</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-forest-dark py-12 border-t border-border/10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.1}>
              <div className="text-center">
                <stat.icon className="w-5 h-5 text-accent mx-auto mb-3" />
                <p className="font-serif text-2xl md:text-3xl text-cream mb-1">{stat.value}</p>
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/40">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Quiz Nudge */}
      <QuizNudge />

      {/* Client Logos */}
      <AnimatedSection>
        <section className="py-16 border-b border-border/10">
          <div className="max-w-5xl mx-auto px-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-10 text-center">
              Trusted by World-Class Brands
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-8 items-center justify-items-center">
              {clientLogos.map((client) => (
                <div key={client.name} className="flex items-center justify-center" style={{ width: "120px", height: "50px" }}>
                  <img
                    src={client.logo}
                    alt={`${client.name} logo`}
                    width={120}
                    height={50}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full w-auto h-auto object-contain opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Why Planners Keep Rebooking — with photo */}
      <section className="py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={scottImg}
                alt="Scott Syme, luxury magician and founder of White Rabbit"
                width={600}
                height={750}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div>
              <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-10 w-auto opacity-60 mb-6" />
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">
                Why Planners Keep Rebooking
              </h2>
              <div className="font-sans text-base text-muted-foreground leading-relaxed space-y-5">
                <p>
                  You already know how hard it is to find entertainment that works across every client, every venue, and every guest list. Acts that kill at a 30-person dinner fall flat at a 200-person gala. Performers who are great on stage can't work a cocktail hour.
                </p>
                <p>
                  Close-up magic and mentalism are the only entertainment format that works in any room, at any event size, with zero production requirements. No stage. No AV. No disruption to your timeline.
                </p>
                <p>
                  Your clients get a performer who makes every guest in the room feel like the most important person there. You get an entertainer who shows up early, coordinates with your team, reads the room, and never needs to be managed.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What Your Clients Experience — Photo-backed cards */}
      <section className="bg-card py-24 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Experiences</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-16">
              What Your Clients Experience
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Close-Up Card */}
            <AnimatedSection>
              <div className="group border border-border overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={closeupImg}
                    alt="Scott Syme performing close-up magic at a cocktail reception"
                    width={600}
                    height={375}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">Most Booked by Planners</p>
                  <h3 className="font-serif text-2xl text-foreground mb-4">Close-Up Magic & Mentalism</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6">
                    Scott moves through the event approaching groups organically. Cards, borrowed objects, mind reading — performed inches from your guests' hands. The magic is the icebreaker that gets strangers talking and turns a well-planned event into one people actually remember.
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      to="/contact"
                      className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-6 py-3 hover:bg-accent/80 transition-colors"
                    >
                      Inquire
                    </Link>
                    <span className="font-sans text-xs text-muted-foreground">20–300+ guests</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            {/* Private Show Card */}
            <AnimatedSection delay={0.15}>
              <div className="group border border-border overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={parlorImg}
                    alt="White Rabbit private parlor magic show with emerald curtains"
                    width={600}
                    height={375}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">Premium Offering</p>
                  <h3 className="font-serif text-2xl text-foreground mb-4">Private Magic Show</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6">
                    For clients who want a centerpiece moment. Emerald curtain drapes, cinematic uplighting, and a curated soundtrack. 45 minutes of interactive magic, mentalism, and audience participation. This is the offering that justifies a higher entertainment line item.
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      to="/contact"
                      className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-6 py-3 hover:bg-accent/80 transition-colors"
                    >
                      Inquire
                    </Link>
                    <span className="font-sans text-xs text-muted-foreground">20–100 guests</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Photo Strip */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[reactionImg, crowdImg, cardsImg, penthouseImg].map((img, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="aspect-square overflow-hidden">
                <img
                  src={img}
                  alt="White Rabbit luxury magic experience"
                  width={400}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Logistics Grid */}
      <section className="py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Zero Production Hassle</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-4">
              The Logistics Planners Actually Care About
            </h2>
            <p className="font-sans text-sm text-muted-foreground text-center mb-14 max-w-xl mx-auto">
              No rider. No AV coordinator. No last-minute surprises. Here's exactly what to expect.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {logistics.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.05}>
                <div className="border border-border p-6 h-full">
                  <item.icon className="w-5 h-5 text-accent mb-4" />
                  <h3 className="font-serif text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Testimonials</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-16">
              What Clients Say
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="border border-border p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="fill-accent text-accent" />
                    ))}
                  </div>
                  <blockquote className="font-serif text-lg text-foreground leading-relaxed flex-grow mb-6">
                    "{t.quote}"
                  </blockquote>
                  <div>
                    <p className="font-sans text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="font-sans text-xs text-muted-foreground tracking-wider uppercase">{t.context}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* DMCs */}
      <AnimatedSection>
        <section className="py-24 lg:py-28">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">For DMCs & Destination Management</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">
              A Reliable Vendor for Multi-Day Programs
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
              If you coordinate entertainment for corporate groups visiting Los Angeles — or anywhere in the US — Scott is a reliable, repeatable vendor you can plug into multi-day programs. Fortune 500 client dinners, incentive trip receptions, and corporate retreat welcome events. No production complexity, no rider, no drama.
            </p>
            <div className="inline-block border border-accent/20 px-8 py-4">
              <p className="font-sans text-sm text-accent">
                Currently active in: Los Angeles · New York · Miami · Dallas · Chicago · San Francisco · Scottsdale · Nashville · Boston · 90+ markets nationwide
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Send to Client — Email Template */}
      <AnimatedSection>
        <section className="bg-card py-24">
          <div className="max-w-3xl mx-auto px-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Planner Tool</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4 text-center">
              Send This to Your Client
            </h2>
            <p className="font-sans text-sm text-muted-foreground text-center mb-10 max-w-lg mx-auto">
              Need to pitch this to a decision-maker? Copy the email below, customize the bracketed fields, and hit send.
            </p>
            <div className="relative border border-border bg-background p-6 md:p-8">
              <pre className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                {SEND_TO_CLIENT_EMAIL}
              </pre>
              <button
                onClick={handleCopyEmail}
                className="absolute top-4 right-4 inline-flex items-center gap-2 font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors bg-background border border-border px-3 py-2"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Email</>
                )}
              </button>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-cream mb-4">
              Let's Work Together
            </h2>
            <p className="font-sans text-base text-cream/70 mb-10 max-w-lg mx-auto">
              Tell us about your upcoming event and we'll usually get back to you within a few hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
              >
                Get in Touch <ArrowRight size={14} />
              </Link>
              <a
                href="tel:+14243941850"
                className="inline-flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase border border-cream/30 text-cream px-10 py-4 hover:border-cream/60 transition-colors"
              >
                Call (424) 394-1850
              </a>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Quiz CTA */}
      <QuizCTA />
    </main>
  );
};

export default Planners;
