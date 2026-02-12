import { Link } from "react-router-dom";
import { ChevronDown, Star } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import heroImage from "@/assets/hero-magic.jpg";
import experienceImg from "@/assets/experience-closeup.jpg";


import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.svg";
import youtubeLogo from "@/assets/logos/youtube.png";
import hyattLogo from "@/assets/logos/hyatt.png";
import rivianLogo from "@/assets/logos/rivian.png";
import paramountLogo from "@/assets/logos/paramount.png";
import oliviarodrigoLogo from "@/assets/logos/oliviarodrigo.png";
import taittingerLogo from "@/assets/logos/taittinger.png";
import blackrabbitroseLogo from "@/assets/logos/blackrabbitrose.svg";
import fosterallLogo from "@/assets/logos/fosterall.svg";
import pistolaLogo from "@/assets/logos/pistola-new.png";
import lionsgateLogo from "@/assets/logos/lionsgate.png";
import agtLogo from "@/assets/logos/agt.png";

const clients = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "YouTube", logo: youtubeLogo },
  { name: "Hyatt", logo: hyattLogo },
  { name: "Rivian", logo: rivianLogo },
  { name: "Paramount", logo: paramountLogo },
  { name: "Olivia Rodrigo", logo: oliviarodrigoLogo },
  { name: "Taittinger", logo: taittingerLogo },
  { name: "Lionsgate", logo: lionsgateLogo },
  { name: "America's Got Talent", logo: agtLogo },
  { name: "Black Rabbit Rose", logo: blackrabbitroseLogo },
  { name: "FosterAll", logo: fosterallLogo },
  { name: "Pistola", logo: pistolaLogo },
];

const Index = () => {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Luxury magic performance" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-forest-dark/60" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center justify-end pb-16 h-full">
          <motion.p
            className="font-serif text-xl md:text-3xl text-cream/90 italic tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Redefine the Perception of a Magic Experience
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12"
          >
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-cream px-10 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Book an Experience
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-cream/50"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* Client Logo Carousel */}
      <AnimatedSection>
        <section className="bg-forest-dark py-16 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-10">
              Trusted by World-Class Brands
            </p>
          </div>
          <div className="relative">
            <div className="flex animate-scroll-logos" style={{ width: 'max-content' }}>
              {[...clients, ...clients, ...clients].map((client, i) => (
                <div key={`${client.name}-${i}`} className="flex-shrink-0 mx-6 md:mx-8 flex items-center justify-center" style={{ width: '160px', height: '60px' }}>
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-h-[50px] max-w-[150px] w-auto h-auto object-contain opacity-50 hover:opacity-80 transition-opacity brightness-0 invert"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* The Experience Teaser */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Experience</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
                Magic That Transcends Entertainment
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
                White Rabbit delivers bespoke magical experiences for the world's most discerning audiences. 
                From intimate close-up performances to grand parlor shows, every moment is crafted 
                to leave a lasting impression of wonder.
              </p>
              <Link
                to="/experience"
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Explore
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={experienceImg}
                alt="Luxury close-up magic experience"
                className="w-full h-full object-cover"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured Testimonial */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 italic leading-relaxed mb-8">
              "Scott's performance was the highlight of our entire event. Our guests are still talking about it 
              months later. Truly world-class entertainment."
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              — Morgan Stanley, Private Client Event
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-24 lg:py-32 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
              Create an Unforgettable Moment
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-10">
              Elevate your next event with an experience your guests will never forget.
            </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default Index;
