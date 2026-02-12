import AnimatedSection from "@/components/AnimatedSection";
import scottPhoto from "@/assets/scott-syme-photo.jpg";
import creditsPhoto from "@/assets/credits-photo.png";
import scottPerformingImg from "@/assets/event-scott-performing.jpg";
import guestReactionImg from "@/assets/event-guest-reaction.jpg";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <main className="pt-20">
      {/* Hero with Scott's photo */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={scottPhoto} alt="Scott Syme, Magician" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 w-full">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Magician</p>
            <h1 className="font-serif text-5xl md:text-7xl text-cream">Scott Syme</h1>
          </AnimatedSection>
        </div>
      </section>

      {/* Bio */}
      <section className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-8">
              Redefining the Art of Magic
            </h2>
            <div className="space-y-6 font-sans text-base text-muted-foreground leading-relaxed">
              <p>
                Based in Los Angeles, Scott Syme is the creative force behind White Rabbit — a luxury magic 
                experience designed for the world's most discerning audiences. With a career spanning Fortune 500 
                corporate events, A-list celebrity gatherings, and intimate private affairs, Scott has redefined 
                what it means to experience magic.
              </p>
              <p>
                His client roster reads like a who's who of global excellence: Netflix, Disney, Rolls Royce, 
                Morgan Stanley, YouTube, Rivian, Hyatt Hotels, Lionsgate, and countless private clients 
                including billionaires and industry leaders.
              </p>
              <p>
                Every White Rabbit performance is a bespoke creation — tailored to the audience, the occasion, 
                and the atmosphere. Scott doesn't just perform tricks; he crafts moments of genuine wonder that 
                forge connections and leave lasting impressions.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* In Action */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedSection>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={scottPerformingImg} alt="Scott Syme performing live" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={guestReactionImg} alt="Guest reacting to magic" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Mission</p>
            <h2 className="font-serif text-3xl md:text-4xl text-cream italic leading-relaxed">
              "To elevate magic beyond entertainment — creating immersive, 
              personalized experiences that redefine what's possible."
            </h2>
          </div>
        </section>
      </AnimatedSection>

      {/* Credits */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Notable Clients</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-12 text-center">
              Trusted by the Best
            </h2>
            <div className="overflow-hidden">
              <img src={creditsPhoto} alt="White Rabbit client logos" className="w-full h-auto" />
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
