import AnimatedSection from "@/components/AnimatedSection";
import scottPhoto from "@/assets/scott-syme-photo.jpg";
import creditsPhoto from "@/assets/credits-photo.png";
import scottPerformingImg from "@/assets/event-scott-performing.jpg";
import guestReactionImg from "@/assets/event-guest-reaction.jpg";

import parlorShowImg from "@/assets/event-parlor-show.jpg";
import closeupCocktailImg from "@/assets/event-closeup-cocktail.jpg";
import penthouseShowImg from "@/assets/event-penthouse-show.jpg";
import scottCouchImg from "@/assets/scott-couch.jpg";
import cardsMotionImg from "@/assets/cards-motion-curtain.jpg";
import cardsStackImg from "@/assets/cards-stack-curtain.jpg";
import cardsFanImg from "@/assets/cards-fan-closeup.jpg";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <main className="pt-20">
      {/* Hero with Scott's photo */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={scottPhoto} alt="Scott Syme, Los Angeles luxury magician and founder of White Rabbit" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/30 to-forest-dark/10" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 w-full">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Magician</p>
            <h1 className="font-serif text-5xl md:text-7xl text-cream">Scott Syme</h1>
          </AnimatedSection>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-8">
              Redefining the Art of Magic
            </h2>
            <div className="space-y-6 font-sans text-base text-muted-foreground leading-relaxed">
              <p>
                Based in Los Angeles, Scott Syme is the creative force behind White Rabbit — a luxury magic 
                experience built on a simple belief: the best entertainment makes people feel truly alive. 
                Not through tricks, but through an atmosphere of joy, genuine hospitality, and human connection 
                that guests carry with them long after the night ends. A proud member of the world-famous 
                Magic Castle in Hollywood and the International Brotherhood of Magicians, Scott brings both 
                elite craft and warm showmanship to every performance.
              </p>
              <p>
                Think of the feeling of flying first class. There's no product you take home — it's the way 
                you're treated. The warmth. The feeling of being seen and cared for. That's what Scott delivers, 
                and it's why the world's most discerning clients — Netflix, Disney, Rolls Royce, Morgan Stanley, 
                and countless private collectors and industry leaders — trust him with their most important events.
              </p>
              <p>
                For premium White Rabbit parlor shows, Scott transforms spaces with emerald curtain drapes, 
                cinematic uplighting, and a curated soundtrack — creating an atmosphere that feels like stepping 
                into an upscale hotel lobby. The show is bigger emotionally than it is physically. Guests don't 
                just leave entertained; they leave feeling changed, carrying stories they'll tell for years.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* In Action */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatedSection>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={scottPerformingImg} alt="Scott Syme performing close-up magic at a luxury private event" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={scottCouchImg} alt="Scott Syme portrait on couch" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={guestReactionImg} alt="Guest reacting to White Rabbit magic show" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsMotionImg} alt="Cards in motion against curtain backdrop" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsStackImg} alt="Card stack flourish with curtain backdrop" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsFanImg} alt="Close-up card fan sleight of hand" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={parlorShowImg} alt="White Rabbit parlor show with emerald curtain backdrop" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={closeupCocktailImg} alt="Close-up magic at a cocktail event" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={penthouseShowImg} alt="Penthouse magic show performance" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Mission</p>
            <h2 className="font-serif text-3xl md:text-4xl text-cream leading-relaxed">
              "To make people feel alive — creating an encounter with joy, wonder, 
              and hospitality that stays with them long after the last card is turned."
            </h2>
          </div>
        </section>
      </AnimatedSection>

      {/* Credits */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Notable Clients</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-12 text-center">
              Trusted by the Best
            </h2>
            <div className="overflow-hidden">
              <img src={creditsPhoto} alt="White Rabbit magician client logos including Netflix, Disney, Rolls Royce, Morgan Stanley, and more" className="w-full h-auto" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-foreground mb-6">Let's Create Something Extraordinary</h2>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default About;
