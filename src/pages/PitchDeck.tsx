import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Copy, Check, ArrowRight, Users, Award, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

import heroImg from "@/assets/event-parlor-stage.jpg";
import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-show.jpg";
import crowdImg from "@/assets/event-crowd-reaction.jpg";
import scottImg from "@/assets/scott-couch.jpg";
import cardsImg from "@/assets/event-cards-emerald.jpg";
import groupImg from "@/assets/event-group-finale.jpg";
import penthouseImg from "@/assets/event-penthouse-show.jpg";
import creditsPhoto from "@/assets/credits-photo.png";

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

const testimonials = [
  {
    name: "Jamie I.",
    role: "Morgan Stanley, 200-Person Corporate Event",
    text: "Scott performed at a 200-person event for us and the guests absolutely LOVED him. I could not recommend him more!",
  },
  {
    name: "Taylor R.",
    role: "Corporate Holiday Party",
    text: "2nd year in a row hiring him and he knocks it out of the park both times!",
  },
  {
    name: "Grace G.",
    role: "Corporate Holiday Dinner",
    text: "He is incredible and had the whole room captivated.",
  },
];

const experiences = [
  {
    title: "Close-Up Magic",
    desc: "Intimate interactive magic during cocktail hours & receptions. Perfect for 20–200+ guests.",
    image: closeupImg,
  },
  {
    title: "Private Magic Show",
    desc: "A 45-minute theatrical experience with cinematic lighting, sound, and audience interaction. 20–100 guests.",
    image: parlorImg,
  },
  {
    title: "Corporate & Gala",
    desc: "Fortune 500 galas, product launches, executive retreats, and holiday parties.",
    image: penthouseImg,
  },
];

const stats = [
  { icon: Users, label: "Guests Entertained", value: "10,000+" },
  { icon: Star, label: "Google Rating", value: "5.0 ★" },
  { icon: Award, label: "Magic Castle® Member", value: "Hollywood" },
  { icon: Sparkles, label: "Notable Clients", value: "50+" },
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

const PitchDeck = () => {
  const { openQuiz } = useBookingQuiz();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  usePageMeta({
    title: "White Rabbit Lookbook | Luxury Magic Entertainment — Los Angeles",
    description: "Explore White Rabbit's digital lookbook: credentials, photos, testimonials, and booking details for luxury magic entertainment by Scott Syme.",
    path: "/deck",
    image: heroImg,
  });

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
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="White Rabbit private magic show with emerald curtains and cinematic lighting"
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
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              Lookbook
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-4">
              White Rabbit
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto leading-relaxed">
              Luxury magic entertainment for the world's most discerning events.
              Share this page with your team or client to show them what's possible.
            </p>
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
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/40">
                  {stat.label}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* About Scott */}
      <section className="py-24">
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
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
                The Magician
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">Scott Syme</h2>
              <div className="space-y-4 font-sans text-base text-muted-foreground leading-relaxed">
                <p>
                  Scott Syme believes every great event deserves a moment that makes the room feel
                  truly alive — for the guests and the host alike. That's the mission behind White
                  Rabbit: to create an experience so personal and unexpected that people talk about
                  it for years. A proud member of the world-famous Magic Castle® in Hollywood and
                  the International Brotherhood of Magicians, Scott travels nationwide to bring
                  luxury entertainment to the most discerning private events and corporate
                  gatherings.
                </p>
                <p>
                  He has consulted for America's Got Talent, coached performers for Disney Channel,
                  and entertained guests for Netflix, Morgan Stanley, Rolls Royce, and dozens of
                  Fortune 500 brands. With a background in high-net-worth client services, Scott
                  brings a white-glove hospitality approach to every performance — guests don't just
                  watch a show, they feel genuinely cared for from the moment the evening begins.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Experiences */}
      <section className="bg-card py-24">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">
              Experiences
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-16 text-center">
              Tailored to Your Event
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {experiences.map((exp, i) => (
              <AnimatedSection key={exp.title} delay={i * 0.1}>
                <div className="group">
                  <div className="aspect-[4/3] overflow-hidden mb-6">
                    <img
                      src={exp.image}
                      alt={exp.title}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-3">{exp.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {exp.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[closeupImg, crowdImg, cardsImg, groupImg].map((img, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="aspect-square overflow-hidden">
                <img
                  src={img}
                  alt="White Rabbit magic experience"
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

      {/* Client Logos */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20">
          <div className="max-w-5xl mx-auto px-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-12 text-center">
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
                    className="max-h-full max-w-full w-auto h-auto object-contain opacity-60 brightness-0 invert"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">
              Testimonials
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-16 text-center">
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
                    "{t.text}"
                  </blockquote>
                  <div>
                    <p className="font-sans text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="font-sans text-xs text-muted-foreground tracking-wider uppercase">
                      {t.role}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Send to Your Client — Email Template */}
      <AnimatedSection>
        <section className="bg-card py-24">
          <div className="max-w-3xl mx-auto px-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">
              For Planners
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4 text-center">
              Send This to Your Client
            </h2>
            <p className="font-sans text-sm text-muted-foreground text-center mb-10 max-w-lg mx-auto">
              Need to pitch this to a decision-maker? Copy the email below, customize the bracketed
              fields, and hit send.
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
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Email
                  </>
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
              Ready to Create Something Unforgettable?
            </h2>
            <p className="font-sans text-base text-cream/70 mb-10 max-w-lg mx-auto">
              Check availability for your event date. Scott personally responds to every inquiry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={openQuiz}
                className="inline-flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
              >
                Book Now <ArrowRight size={14} />
              </button>
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
    </main>
  );
};

export default PitchDeck;
