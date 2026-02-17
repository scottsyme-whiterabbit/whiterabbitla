import { Check, CalendarClock } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";

const painPoints = [
  "Guests standing around during cocktail hour, checking their phones, waiting for something to happen.",
  "Entertainment that feels generic, forgettable, or out of place at a high-end gathering.",
  "Transitions between courses or program segments that lose the room's energy.",
  "Spending months planning every detail, only to have the atmosphere fall flat.",
];

const included = [
  "World-class sleight of hand, mentalism, and impossible coincidences",
  "A warm, magnetic host who makes every guest feel like the most important person in the room",
  "Curated atmosphere: signature soundtrack, cinematic lighting, emerald curtain drapes",
  "Pre-event consultation to tailor the experience to your guests and venue",
  "Seamless coordination with your planner, venue, and production team",
  "A lasting impression your guests will talk about for years",
];

const ValueProposition = () => {
  const { openQuiz } = useBookingQuiz();

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Problem Agitation */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The Truth About Event Entertainment</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6 leading-tight">
              Your Event Deserves More Than Background Noise
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              You've invested in the venue, the catering, the florals. Every detail is intentional. 
              But there's a moment most hosts don't plan for.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="space-y-4 mb-16">
            {painPoints.map((point, i) => (
              <div key={i} className="flex gap-4 items-start p-4 border border-border/50 bg-background/50">
                <span className="font-serif text-accent/40 text-lg mt-0.5 flex-shrink-0">✕</span>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* The Solution */}
        <AnimatedSection delay={0.15}>
          <div className="text-center mb-10">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The White Rabbit Difference</p>
            <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Scott Doesn't Just Perform. He Transforms the Room.
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
          <div className="border border-accent/20 bg-accent/5 p-8 md:p-10 mb-16">
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

        {/* Scarcity */}
        <AnimatedSection delay={0.25}>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-accent/30 bg-accent/5 mb-6">
              <CalendarClock size={14} className="text-accent" />
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-accent">Limited Availability</p>
            </div>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
              Scott personally performs at every event. No associates, no substitutes. 
              Because of this, he accepts a limited number of bookings each month. 
              If your date is important to you, reach out early.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Check Availability
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ValueProposition;
