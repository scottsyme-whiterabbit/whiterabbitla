import AnimatedSection from "@/components/AnimatedSection";
import QuizCTA from "@/components/QuizCTA";
import scottPhoto from "@/assets/about-hero-desert.jpg";
import creditsPhoto from "@/assets/credits-photo.png";
import scottCouchImg from "@/assets/scott-couch.jpg";
import cardsMotionImg from "@/assets/cards-motion-curtain.jpg";
import cardsStackImg from "@/assets/cards-stack-curtain.jpg";
import cardsFanImg from "@/assets/cards-fan-closeup.jpg";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const About = () => {
  usePageMeta({
    title: "About Scott Syme | White Rabbit Magic — Los Angeles Magician",
    description: "Meet Scott Syme, the magician behind White Rabbit. A Magic Castle® member and former America's Got Talent consultant who has performed for Netflix, Disney, and Morgan Stanley.",
    path: "/about",
    image: scottPhoto,
  });
  return (
    <main id="main-content" className="pt-20">
      {/* Hero with Scott's photo */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={scottPhoto} alt="Scott Syme, luxury magician and entertainer for private events in Los Angeles, walking through a desert landscape in a tailored suit" className="w-full h-full object-cover object-center" fetchPriority="high" decoding="async" style={{ filter: 'contrast(1.1) saturate(0.85) brightness(0.95) sepia(0.15)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/30 to-forest-dark/10 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent md:hidden" />
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
                Based in Los Angeles, Scott Syme is the creative force behind White Rabbit, a luxury magic 
                experience built on a simple belief: the best entertainment makes people feel truly alive. 
                Not through tricks, but through an atmosphere of joy, genuine hospitality, and human connection 
                that guests carry with them long after the night ends. A proud member of the world-famous 
                Magic Castle® in Hollywood and the International Brotherhood of Magicians, Scott brings both 
                elite craft and warm showmanship to every performance.
              </p>
              <p>
                Scott's path to magic wasn't a straight line, and that's what makes him different. Before 
                White Rabbit, he built a career in luxury real estate at Compass in Beverly Hills, where he 
                learned to anticipate the needs of high-net-worth clients and deliver white-glove service. 
                When he decided to pursue magic full-time, he took a job as a hotel valet. Not out of 
                necessity, but intention. He wanted to study hospitality from the ground up, learning what 
                makes people feel genuinely welcomed and cared for. On his very first day after leaving 
                that position to become a full-time magician, he was invited to perform at a billionaire's 
                home. A moment that cemented what he already felt: he was exactly where he was meant to be.
              </p>
              <p>
                That combination of business acumen, hospitality training, and world-class sleight of hand 
                is why Fortune 500 companies, charitable organizations, and the most discerning private clients 
                (Netflix, Disney, Rolls Royce, Morgan Stanley, and countless industry leaders) trust Scott 
                with their most important events. Beyond performing, Scott has consulted for major productions, 
                teaching the cast of Disney Channel's Bizaardvark how to perform magic on screen alongside 
                Olivia Rodrigo, consulting for America's Got Talent champion winner Dustin Tavella, and 
                coaching comedian Adam Ray for a show at the legendary Comedy Store. When you hire White Rabbit, 
                you're not just booking a magician. You're hiring someone who has dedicated his life to making 
                people feel extraordinary.
              </p>
              <p>
                In 2025, Scott created and hosted Magic Mondays at the Kookaburra Lounge in Hollywood, a 
                weekly magic and comedy show produced by White Rabbit and the Kookaburra Lounge. The show 
                featured some of the biggest names in magic, including Taylor Hughes, Kyle Marlett, Franco 
                Pascali, and Blake Vogt, alongside comedians like Adam Ray, Tiffany Haddish, Craig Robinson, 
                Dean Delray, and Katie Cazorla. Magic Mondays is returning in 2026 in Studio City.
              </p>
              <p>
                For premium White Rabbit private magic shows, Scott transforms spaces with emerald curtain drapes, 
                cinematic uplighting, and a curated soundtrack, creating an atmosphere that feels like stepping 
                into an upscale hotel lobby. The show is bigger emotionally than it is physically. Guests don't 
                just leave entertained; they leave feeling changed, carrying stories they'll tell for years.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* In Action */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedSection>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsMotionImg} alt="Playing cards in motion against emerald curtain backdrop" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={scottCouchImg} alt="Scott Syme portrait seated on couch, White Rabbit magician Los Angeles" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsFanImg} alt="Close-up card fan sleight of hand by Scott Syme" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsStackImg} alt="Card stack flourish with emerald curtain backdrop" loading="lazy" decoding="async" className="w-full h-full object-cover scale-x-[-1]" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Mission</p>
            <h2 className="font-serif text-3xl md:text-4xl text-cream leading-relaxed">"To make people feel alive. Creating an encounter with joy, wonder, and hospitality that stays with them long after the evening is over"


            </h2>
          </div>
        </section>
      </AnimatedSection>

      {/* What Scott Offers — links to Experience */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">What Scott Offers</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-12 text-center">
              Experiences Tailored to Your Event
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Close-Up Magic", desc: "Intimate sleight of hand performed right in your guests' hands during cocktail hours and receptions.", link: "/services/close-up-magician" },
              { title: "Private Magic Show", desc: "A curated 45-minute theatrical experience with cinematic lighting, sound, and audience interaction.", link: "/services/private-magic-show" },
              { title: "Corporate Events", desc: "Sophisticated entertainment for galas, product launches, holiday parties, and executive retreats.", link: "/services/corporate-magician" },
              { title: "Weddings", desc: "The cocktail hour experience that breaks the ice and gives your guests a story to tell forever.", link: "/services/wedding-magician" },
            ].map((service, i) => (
              <AnimatedSection key={service.title} delay={i * 0.1}>
                <Link
                  to={service.link}
                  className="group block border border-border p-8 hover:border-accent/40 transition-colors h-full"
                >
                  <h3 className="font-serif text-xl text-foreground mb-3 group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-4">
                    {service.desc}
                  </p>
                  <span className="font-sans text-xs tracking-[0.2em] uppercase text-accent">
                    Learn More →
                  </span>
                </Link>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={0.3}>
            <div className="text-center mt-10">
              <Link
                to="/experience"
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                View All Experiences
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Quiz CTA - after services */}
      <QuizCTA />

      {/* Credits */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">Notable Clients</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-12 text-center">Trusted by the Best in Class

            </h2>
            <div className="overflow-hidden">
              <img src={creditsPhoto} alt="White Rabbit magician client logos including Netflix, Disney, Rolls Royce, Morgan Stanley, and more" loading="lazy" decoding="async" className="w-full h-auto" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="py-12 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-foreground mb-6">Let's Create Something Extraordinary</h2>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors">

              Get in Touch
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>);

};

export default About;