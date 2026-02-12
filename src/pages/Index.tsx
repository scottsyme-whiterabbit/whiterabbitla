import { Link } from "react-router-dom";
import { ChevronDown, Star } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import heroImage from "@/assets/hero-magic-cinematic.jpg";
import experienceImg from "@/assets/experience-closeup.jpg";
import eventCardsImg from "@/assets/cards-spring-bw.jpg";
import penthouseImg from "@/assets/event-penthouse-show.jpg";
import cocktailImg from "@/assets/event-closeup-cocktail.jpg";


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
{ name: "Pistola", logo: pistolaLogo }];


const Index = () => {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Scott Syme performing luxury close-up magic at a private event in Los Angeles" className="w-full h-full object-cover object-[center_55%]" />
          <div className="absolute inset-0 bg-forest-dark/60" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center justify-end pb-6 h-full">
          <motion.p
            className="text-xl text-cream/90 tracking-wide font-bold text-center font-serif md:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}>
            Experience Magic<br />
            That Make Your Guests Feel Truly Alive
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12">

            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-cream px-10 py-4 hover:bg-accent hover:text-accent-foreground transition-colors">

              Book an Experience
            </Link>
          </motion.div>
        </div>

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
              {[...clients, ...clients, ...clients].map((client, i) =>
              <div key={`${client.name}-${i}`} className="flex-shrink-0 flex items-center justify-center px-8 md:px-10" style={{ width: '180px', height: '60px' }}>
                  <img
                  src={client.logo}
                  alt={client.name}
                  className="max-h-full max-w-full w-auto h-auto object-contain opacity-50 hover:opacity-80 transition-opacity brightness-0 invert" />

                </div>
              )}
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
                More Than Magic.<br />A Feeling.
              </h2>
               <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
                 Imagine the hush of a five-star lobby, the thrill of turning left on a flight — that rare feeling 
                 when every detail has been crafted just for you. Now bring that into a room full of your guests. 
                 Scott Syme blends world-class sleight of hand, mentalism, and impossible coincidences with the 
                 warmth of a master host — transforming any space into something cinematic, intimate, and utterly 
                 alive. Curated lighting, a signature soundtrack, and moments so close you can feel them. This 
                 isn't a magic show. It's a White Rabbit experience.
               </p>
              <Link
                to="/experience"
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors">

                Explore
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={eventCardsImg}
                alt="Scott Syme performing close-up card magic at a luxury corporate event in Los Angeles"
                className="w-full h-full object-cover" />

            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured Testimonial */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) =>
              <Star key={i} size={20} className="fill-accent text-accent" />
              )}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 leading-relaxed mb-8">
              "Our guests didn't just enjoy the show — they came alive. Months later, they still talk about 
              how Scott made them feel. That's not entertainment. That's something else entirely."
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50 mb-8">
              — Morgan Stanley, Private Client Event
            </p>
            <Link
              to="/reviews"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-cream px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors">
              Read More Reviews
            </Link>
          </div>
        </section>
      </AnimatedSection>

      {/* Photo Break */}
      <section className="py-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedSection>
            <div className="aspect-[4/3] overflow-hidden">
              <img src={penthouseImg} alt="Scott Syme performing White Rabbit parlor magic show in a luxury Los Angeles penthouse with panoramic city views" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="aspect-[4/3] overflow-hidden">
              <img src={cocktailImg} alt="Guests laughing and reacting to close-up magic by Scott Syme at a luxury cocktail event in Los Angeles" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-12 lg:py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
              Make Your Guests Feel Alive
            </h2>
             <p className="font-sans text-base text-muted-foreground mb-10">
               Scott Syme transforms any space into something extraordinary — an atmosphere of joy, wonder, and genuine 
               hospitality that your guests will talk about for years to come.
             </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors">
              Book Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>);

};

export default Index;