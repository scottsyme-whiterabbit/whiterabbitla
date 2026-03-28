import { Link } from "react-router-dom";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import QuizCTA from "@/components/QuizCTA";
import SEOHead from "@/components/SEOHead";
import threeStars from "@/assets/three-stars-gold.png";

const logistics = [
  { title: "Insurance", detail: "Fully insured with general liability coverage. COI available on request." },
  { title: "Setup", detail: "Zero. No stage, no power, no AV, no backdrop. Scott integrates into your existing event flow." },
  { title: "Timing", detail: "Typically 2–3 hours for cocktail/roaming magic. 45–60 minutes for a private parlor show. Flexible based on your run-of-show." },
  { title: "Coordination", detail: "Scott communicates directly with your team before the event — venue contact, timeline, room layout, guest count, VIP notes." },
  { title: "Travel", detail: "Based in Los Angeles. Available worldwide. Travel fees quoted per event — no surprises." },
  { title: "Attire", detail: "Black tie, business formal, themed — coordinated with your event's dress code." },
  { title: "Capacity", detail: "Roaming close-up magic works for 20 to 300+ guests. Private parlor shows seat 20–100." },
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

const Planners = () => {
  const { openQuiz } = useBookingQuiz();
  useScrollDepth("planners");

  return (
    <main id="main-content" className="pt-20">
      <SEOHead
        title="For Event Planners & DMCs | White Rabbit Magic — Los Angeles"
        description="The magician event planners and DMCs trust for corporate events, galas, and weddings. Zero setup, full insurance, available nationwide. Check availability."
        canonical="/planners"
      />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-forest-dark">
        <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/60 via-forest-dark/80 to-forest-dark" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 w-full text-center">
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
                className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors"
              >
                Check Availability
              </Link>
              <button
                onClick={openQuiz}
                className="font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-8 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Take the Quiz
              </button>
            </div>
            <p className="font-sans text-sm text-accent/70 italic mt-6">35-second quiz — no commitment required</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Section 1 — Why Planners Keep Rebooking */}
      <AnimatedSection>
        <section className="py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex justify-center mb-4">
              <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-16 w-auto opacity-70" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-10">
              Why Planners Keep Rebooking
            </h2>
            <div className="font-sans text-base text-muted-foreground leading-relaxed space-y-6">
              <p>
                You already know how hard it is to find entertainment that works across every client, every venue, and every guest list. Acts that kill at a 30-person dinner fall flat at a 200-person gala. Performers who are great on stage can't work a cocktail hour. And most entertainers need a stage, a sound system, AV coordination, and a prayer.
              </p>
              <p>
                Close-up magic and mentalism are the only entertainment format that works in any room, at any event size, with zero production requirements. Scott performs during cocktail hours, between courses, at receptions, in hospitality suites — wherever your guests are standing with a drink and an open minute. No stage. No AV. No disruption to your timeline.
              </p>
              <p>
                Your clients get a performer who makes every guest in the room feel like the most important person there. You get an entertainer who shows up early, coordinates with your team, reads the room, and never needs to be managed.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Section 2 — Logistics */}
      <AnimatedSection>
        <section className="py-20 lg:py-28 bg-secondary/5">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-12">
              The Logistics Planners Actually Care About
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {logistics.map((item) => (
                <div
                  key={item.title}
                  className="border border-secondary/30 rounded p-6 bg-card"
                >
                  <h3 className="font-serif text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Section 3 — What Your Clients Experience */}
      <AnimatedSection>
        <section className="py-20 lg:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-12">
              What Your Clients Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1 */}
              <div className="border border-secondary/30 rounded p-8 bg-card flex flex-col">
                <h3 className="font-serif text-2xl text-foreground mb-4">Close-Up Magic & Mentalism</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  Scott moves through the event approaching groups organically. Cards, borrowed objects, mind reading — performed inches from your guests' hands. The magic is the icebreaker that gets strangers talking and turns a well-planned event into one people actually remember. This is the format most planners book.
                </p>
                <Link
                  to="/contact"
                  className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-8 py-3 text-center hover:bg-accent hover:text-accent-foreground transition-colors self-start"
                >
                  Inquire
                </Link>
              </div>
              {/* Card 2 */}
              <div className="border border-secondary/30 rounded p-8 bg-card flex flex-col">
                <h3 className="font-serif text-2xl text-foreground mb-4">Private Magic Show</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  For clients who want a centerpiece moment. Scott transforms the space with emerald curtain drapes, cinematic uplighting, and a curated soundtrack. 45 minutes of interactive magic, mentalism, and audience participation for 20–100 guests. This is the premium offering that justifies a higher entertainment line item.
                </p>
                <Link
                  to="/contact"
                  className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-8 py-3 text-center hover:bg-accent hover:text-accent-foreground transition-colors self-start"
                >
                  Inquire
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Section 4 — Testimonials */}
      <AnimatedSection>
        <section className="py-20 lg:py-28 bg-secondary/5">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-12">
              What Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="border border-secondary/30 rounded p-8 bg-card flex flex-col"
                >
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed italic mb-6 flex-1">
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="font-serif text-base text-foreground">{t.name}</p>
                    <p className="font-sans text-xs text-muted-foreground tracking-wide">{t.context}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Section 5 — DMCs */}
      <AnimatedSection>
        <section className="py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-10">
              For DMCs & Destination Management Companies
            </h2>
            <div className="font-sans text-base text-muted-foreground leading-relaxed space-y-6 mb-8">
              <p>
                If you coordinate entertainment for corporate groups visiting Los Angeles — or anywhere in the US — Scott is a reliable, repeatable vendor you can plug into multi-day programs. He's performed for Fortune 500 client dinners, incentive trip receptions, and corporate retreat welcome events. No production complexity, no rider, no drama. Just a world-class performer who makes your programming look good.
              </p>
            </div>
            <p className="font-sans text-sm text-accent italic text-center">
              Currently active in: Los Angeles, New York, Miami, Dallas, Chicago, San Francisco, Scottsdale, Nashville, Boston, and 90+ additional markets nationwide.
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Section 6 — CTA */}
      <AnimatedSection>
        <section className="py-20 lg:py-28 bg-secondary/5">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="border border-secondary/30 rounded p-10 md:p-14 bg-card">
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
                Let's Work Together
              </h2>
              <p className="font-sans text-base text-muted-foreground mb-8 max-w-lg mx-auto">
                Tell us about your upcoming event and we'll get back to you within 24 hours.
              </p>
              <Link
                to="/contact"
                className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
              >
                Get in Touch
              </Link>
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
