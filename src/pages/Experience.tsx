import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import QuizNudge from "@/components/QuizNudge";
import heroDesertImg from "@/assets/experience-hero-desert.jpg";
import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-stage.jpg";
import corporateImg from "@/assets/event-penthouse-show.jpg";
import privateImg from "@/assets/event-group-photo.jpg";
import cardsEmeraldImg from "@/assets/event-cards-emerald.jpg";
import intimateImg from "@/assets/event-closeup-intimate.jpg";
import mentalistImg from "@/assets/event-mentalism-closeup.jpg";
import guestLaughImg from "@/assets/event-guest-laughing.jpg";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useWebPageSchema } from "@/hooks/useSchemaOrg";

const services = [
  {
    title: "Close-Up Magic",
    slug: "close-up-magician",
    description: "Intimate sleight of hand, mentalism, and impossible coincidences performed inches away. But it's the hospitality that sets it apart. Scott moves through your event like a world-class host, weaving humor, audience participation, and sensory moments into every interaction, making each guest feel like the most important person in the room. Perfect for cocktail hours, dinners, and VIP receptions.",
    image: guestLaughImg,
  },
  {
    title: "Private Magic Shows",
    slug: "private-magic-show",
    description: "The premium White Rabbit experience. Scott transforms your space with emerald curtain drapes, cinematic uplighting, and a curated soundtrack, turning any room into an atmosphere that feels like stepping into an upscale hotel lobby. The show blends classic magic, card mastery, mentalism, and stunning coincidences with humor and audience participation that engages all the senses. For 20 to 100 guests, the show is bigger emotionally than it is physically. Guests walk away feeling like they experienced something they've never felt before.",
    image: parlorImg,
  },
  {
    title: "Corporate Events",
    slug: "corporate-magician",
    description: "Fortune 500 galas, product launches, executive retreats. Scott brings sleight of hand, mentalism, and classics of magic together with warmth, humor, and genuine audience connection. Your team and clients don't just watch entertainment; they participate, they laugh, they feel taken care of and alive. That's why the world's top brands keep coming back.",
    image: corporateImg,
  },
  {
    title: "Weddings & Private Events",
    slug: "wedding-magician",
    description: "Birthdays, weddings, holiday celebrations, and exclusive gatherings. Scott creates an atmosphere of joy through card magic, mind-reading, impossible coincidences, and playful audience participation, engaging all the senses and bringing people together. Guests leave with stories to tell their friends and a lasting impression that this was unlike anything they've experienced before.",
    image: privateImg,
  },
];

const Experience = () => {
  const { openQuiz } = useBookingQuiz();

  usePageMeta({
    title: "Our Services | White Rabbit Magic — Los Angeles",
    description: "Explore White Rabbit's luxury magic experiences: close-up magic, parlor shows, corporate entertainment, wedding magic, and private party performances.",
    path: "/experience",
    image: heroDesertImg,
  });
  useWebPageSchema({ name: "Our Services", description: "Explore White Rabbit's luxury magic experiences: close-up magic, parlor shows, corporate entertainment, and private party performances.", path: "/experience" });

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroDesertImg} alt="Scott Syme in the desert, White Rabbit luxury magician Los Angeles" className="w-full h-full object-cover" fetchPriority="high" decoding="async" style={{ objectPosition: 'center 55%', filter: 'contrast(1.15) saturate(0.8) brightness(0.92) sepia(0.2)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/30 to-forest-dark/10" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 w-full text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The White Rabbit Experience</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              An Encounter with Joy
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-2xl mx-auto leading-relaxed">
              A White Rabbit experience is more than magic. It's an atmosphere of warmth, wonder, and world-class hospitality. 
              Scott Syme transforms your space into something extraordinary, where every guest feels seen, cared for, and truly alive. 
              They leave with more than amazement. They leave feeling changed.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Quiz Nudge — above the fold */}
      <QuizNudge />

      {/* Services */}
      {services.map((service, index) => (
        <section key={service.title} className={`py-24 ${index % 2 === 0 ? "" : "bg-card"}`}>
          <div className={`max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? "lg:direction-rtl" : ""}`}>
            <AnimatedSection className={index % 2 === 1 ? "lg:order-2" : ""}>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={service.image} alt={`${service.title}, White Rabbit luxury magic entertainment Los Angeles`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2} className={index % 2 === 1 ? "lg:order-1" : ""}>
              <div>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">{service.title}</h2>
                <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">{service.description}</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={openQuiz}
                    className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Inquire
                  </button>
                  <Link
                    to={`/services/${service.slug}`}
                    className="inline-block font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground px-8 py-3 transition-colors"
                  >
                    Learn More →
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      ))}

      {/* Quiz CTA - after services */}
      <QuizCTA title="Not Sure Which Experience Fits Your Event?" />

      {/* Atmosphere Photo Strip */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedSection>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={cardsEmeraldImg} alt="Close-up of card sleight of hand with emerald green curtain backdrop at White Rabbit private magic show Los Angeles" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={mentalistImg} alt="Scott Syme performing mentalism close-up for guest at private event" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <div className="aspect-[3/4] overflow-hidden">
              <img src={parlorImg} alt="Scott Syme performing private magic show with emerald curtains and cinematic uplighting Los Angeles" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-16 text-center mb-24">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-cream mb-6">Give Your Guests a Memory That Lasts</h2>
            <p className="font-sans text-base text-cream/70 mb-10">
              Let Scott transform your next event into an atmosphere of wonder, joy, and genuine connection.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book Now
            </button>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default Experience;
