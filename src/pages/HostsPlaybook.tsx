import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import AnimatedSection from "@/components/AnimatedSection";
import eventAudience from "@/assets/event-audience.jpg";
import eventParlorShow from "@/assets/event-parlor-show.jpg";
import eventCloseupCocktail from "@/assets/event-closeup-cocktail.jpg";

const HostsPlaybook = () => {
  const { openQuiz } = useBookingQuiz();

  const sections = [
    {
      number: "01",
      title: "The #1 Mistake Hosts Make When Booking Entertainment",
      content: `Most hosts wait until two weeks before their event to think about entertainment. By then, the best performers are booked and you're left choosing from whoever's available — not whoever's best.\n\nThe secret? Start your search 2–4 weeks out. This gives you time to vet performers, check references, and ensure the act is tailored to your specific event. The hosts who create legendary nights always plan entertainment as early as they plan the venue.`,
    },
    {
      number: "02",
      title: "How to Match the Right Performer to Your Event Format",
      content: `A 200-person corporate gala requires a completely different act than a 20-person dinner party. Here's the framework:\n\n**Cocktail receptions (20–100 guests)** work best with close-up, roaming magic. The performer moves through the crowd, creating intimate moments in small groups.\n\n**Seated dinners (10–50 guests)** call for table-side performances between courses. Each table gets a private 5–8 minute show.\n\n**Stage events (50–500+ guests)** shine with a curated parlor show featuring a dedicated performance space, sound, and lighting.\n\nThe best entertainers adapt their act to your format — not the other way around.`,
    },
    {
      number: "03",
      title: "The Cocktail Hour Trick That Transforms Guest Energy",
      content: `The first 20 minutes of any event set the tone for the entire night. If guests are standing around making small talk, the energy stays flat.\n\nHere's what luxury event planners know: booking a close-up magician for cocktail hour creates instant conversation, breaks the ice between strangers, and generates the kind of buzz that carries through the rest of the evening.\n\nOne Morgan Stanley event planner told us: "Scott performed at a 200-person event and the guests absolutely LOVED him." That energy didn't happen by accident — it was engineered during the first 20 minutes.`,
    },
    {
      number: "04",
      title: "What Luxury Brands Look for in an Entertainer",
      content: `When companies like Netflix, Rolls-Royce, and Morgan Stanley hire entertainment, they're not just looking for tricks. They evaluate four key areas.\n\n**Presentation** — does the performer match the sophistication of the event? **Adaptability** — can they read the room and adjust in real-time? **Discretion** — are they professional enough for high-profile guests? **Storytelling** — does the act create a narrative, or is it just a series of tricks?\n\nThe difference between a good magician and a great one isn't the tricks — it's the experience they create around them.`,
    },
    {
      number: "05",
      title: "How to Create a 'Moment' Your Guests Will Talk About for Years",
      content: `Every legendary event has a moment — a single experience that guests bring up months later. The secret is intentional surprise.\n\nDon't announce the entertainment. Let it unfold organically. When a magician approaches a group during cocktails and creates an impossible moment with a borrowed ring or a signed playing card, the surprise amplifies the impact tenfold.\n\nOne birthday host shared: "Scott completely stole the show! His magic tricks were absolutely mind-blowing, leaving everyone in awe." That's the kind of moment you can't manufacture with a DJ or a photo booth.`,
    },
    {
      number: "06",
      title: "The Venue Checklist: Setting Up for Maximum Impact",
      content: `Your venue affects the entertainment more than you think. Before booking, consider these essentials.\n\n**Lighting** — can it be dimmed for a parlor show? Is there enough light for close-up magic during cocktails? **Sound** — for stage shows, is there a house system or do you need to provide one? **Flow** — where will guests naturally gather? Position the performer there. **Timing** — build the entertainment into the event timeline, not as an afterthought. The best results happen when the performer coordinates with your event planner or venue manager.`,
    },
    {
      number: "07",
      title: "5 Questions to Ask Any Entertainer Before Signing a Contract",
      content: `Before you commit, ask these five questions.\n\n**"Can you describe a similar event you've performed at?"** Experience with your event type matters more than raw talent. **"How do you handle different audience sizes?"** A great performer has different formats for different scales. **"What do you need from the venue?"** Professionals know exactly what they need and keep it minimal. **"Can I see unedited video or reviews?"** Polished reels are nice, but real reviews tell the truth. **"What's your cancellation policy?"** Professionalism extends to the business side too.\n\nIf an entertainer can answer all five confidently, you're in good hands.`,
    },
  ];

  // noindex is handled by SEOHead below

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              An Exclusive Guide · 12 min read
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-cream mb-6 leading-tight">
              The Host's Playbook
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              7 Secrets to Choosing Entertainment That Makes Your Event Legendary
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
              Whether you're planning a corporate gala, an intimate dinner party, or a milestone celebration, the entertainment you choose will define how your guests remember the night. This guide distills everything we've learned from hundreds of private events into seven actionable secrets.
            </p>
          </AnimatedSection>

          {sections.map((section, i) => (
            <AnimatedSection key={section.number} delay={Math.min(i * 0.05, 0.2)}>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4 mt-12">
                Secret {section.number}: {section.title}
              </h2>
              {section.content.split('\n\n').map((paragraph, pi) => (
                <p key={pi} className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                  {paragraph.split(/(\*\*.*?\*\*)/).map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={j} className="text-foreground/80 font-medium">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <span key={j}>{part}</span>;
                  })}
                </p>
              ))}

              {i === 2 && (
                <img
                  src={eventParlorShow}
                  alt="Parlor magic show"
                  width={800}
                  height={450}
                  className="w-full aspect-[16/9] object-cover my-8"
                  loading="lazy"
                />
              )}
              {i === 4 && (
                <img
                  src={eventCloseupCocktail}
                  alt="Close-up magic during cocktail hour"
                  width={800}
                  height={450}
                  className="w-full aspect-[16/9] object-cover my-8"
                  loading="lazy"
                />
              )}
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">
              Ready to Elevate Your Next Event?
            </h2>
            <p className="font-sans text-sm text-cream/70 mb-8">
              Now that you know the secrets, let us help you put them into action. Every White Rabbit experience is tailored to your vision.
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

export default HostsPlaybook;
