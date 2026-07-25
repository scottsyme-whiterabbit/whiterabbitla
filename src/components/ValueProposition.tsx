import { Check } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";

const beats = [
  "The room is ready before you are. The music begins the moment the cases open. Emerald drapes rise. A trace of sandalwood settles into the air half an hour before the first guest arrives.",
  "A green velvet table holds a notepad, a beautiful pen, a dish of White Rabbit matches, a small hotel bell. Every object has a job. Some of them you won't notice until later.",
  "Before the show begins, Scott meets every guest. No tricks. A real handshake, unhurried. By the first word of the show, this is a room full of people who already know him.",
  "Forty minutes, built entirely around the people in the room.",
  "A postcard on every phone. A bow. And guests who keep finding the matches in their pockets weeks later.",
];

const included = [
  "World-class interactive magic, mentalism, and impossible coincidences",
  "A warm, magnetic host who makes every guest feel like the most important person in the room",
  "A curated atmosphere that transforms any space into something unforgettable",
  "Pre-event consultation to tailor the experience to your guests and venue",
  "Seamless coordination with your planner, venue, and production team",
  "A lasting impression your guests will talk about for years",
];

const ValueProposition = () => {
  const { openQuiz } = useBookingQuiz();

  return (
    <section className="py-24 lg:py-36 bg-card">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* The Evening — slow vertical ritual */}
        <AnimatedSection>
          <div className="text-center mb-20">
            <p className="font-sans text-xs tracking-[0.4em] uppercase text-accent mb-5">The Ritual</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight">
              The Evening
            </h2>
          </div>
        </AnimatedSection>

        <div className="space-y-16 md:space-y-20 mb-24">
          {beats.map((beat, i) => (
            <AnimatedSection key={i} delay={i * 0.05}>
              <div className="text-center max-w-2xl mx-auto">
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent/70 mb-6">
                  Beat {i + 1}
                </p>
                <p className="font-serif text-xl md:text-2xl text-foreground/90 leading-relaxed">
                  {beat}
                </p>
                {i < beats.length - 1 && (
                  <div className="mt-16 md:mt-20 mx-auto w-16 border-t border-accent/25" />
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* The Solution */}
        <AnimatedSection delay={0.15}>
          <div className="text-center mb-12 pt-8">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The White Rabbit Difference</p>
            <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-4 leading-tight">
              By the time the first card is touched, the room already feels different.
            </h3>
            <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              When Scott walks into your event, something shifts. Strangers start talking. Laughter fills the room. 
              Guests put their phones away because what's happening in front of them is more interesting than anything on a screen. 
              That's not a trick. That's hospitality at the highest level.
            </p>
          </div>
        </AnimatedSection>

        {/* What's Included */}
        <AnimatedSection delay={0.2}>
          <div className="border border-accent/20 bg-accent/5 p-8 md:p-10 mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-6 text-center">What Every Client Receives</p>
            <div className="space-y-4">
              {included.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Check size={16} className="text-accent mt-1 flex-shrink-0" />
                  <p className="font-sans text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Quiet scarcity + CTA */}
        <AnimatedSection delay={0.25}>
          <div className="text-center">
            <p className="font-sans text-sm text-muted-foreground/90 italic leading-relaxed max-w-xl mx-auto mb-8">
              Scott takes a limited number of engagements each month. Dates for fall and the holiday season are filling.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Inquire
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ValueProposition;
