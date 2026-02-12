import { Star } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Link } from "react-router-dom";
import audienceImg from "@/assets/event-audience.jpg";

const reviews = [
  {
    name: "Morgan Stanley",
    role: "Private Client Event",
    text: "Scott's performance was the highlight of our entire event. Our guests are still talking about it months later. Truly world-class entertainment.",
    rating: 5,
  },
  {
    name: "Sarah L.",
    role: "Private Birthday Party",
    text: "We hired Scott for my husband's 50th birthday and he absolutely blew everyone away. The close-up magic was so intimate and personal — every guest felt like they had their own private show.",
    rating: 5,
  },
  {
    name: "Netflix",
    role: "Corporate Holiday Gala",
    text: "Sophisticated, charming, and incredibly talented. Scott elevated our holiday event beyond what we imagined. Our team is still asking when he can come back.",
    rating: 5,
  },
  {
    name: "Michael R.",
    role: "Wedding Reception",
    text: "Hiring White Rabbit for our wedding cocktail hour was the best decision we made. Guests mingled and laughed together — Scott broke the ice in the most magical way possible.",
    rating: 5,
  },
  {
    name: "Rolls Royce",
    role: "Product Launch",
    text: "We needed something extraordinary for our launch event, and Scott delivered beyond expectations. His performance perfectly matched our brand's commitment to excellence.",
    rating: 5,
  },
  {
    name: "Jennifer K.",
    role: "Charity Gala",
    text: "Scott's parlor show had our 80 guests completely captivated for 45 minutes straight. The storytelling, the humor, the impossible moments — it was unforgettable.",
    rating: 5,
  },
  {
    name: "Disney",
    role: "Executive Dinner",
    text: "In an industry built on creating magic, Scott managed to genuinely surprise and delight our team. That says everything.",
    rating: 5,
  },
  {
    name: "David P.",
    role: "Private Dinner Party",
    text: "I've seen a lot of magicians, but Scott is in a completely different league. His close-up work is flawless and his presence is magnetic. The best money I've ever spent on entertainment.",
    rating: 5,
  },
  {
    name: "Travis M.",
    role: "Private Show Guest",
    text: "I was blown away by a recent White Rabbit show and would recommend it to anyone — even if you're not necessarily into magic. The atmosphere, the hospitality, the performance — it all comes together into something truly special.",
    rating: 5,
  },
  {
    name: "Emily D.",
    role: "Corporate Party",
    text: "We booked Scott for our company party and it was a huge success. Every single guest was completely captivated. He has this incredible ability to make everyone feel like they're the most important person in the room.",
    rating: 5,
  },
  {
    name: "Sarah W.",
    role: "Private Celebration",
    text: "For top-notch entertainment, Scott is the one to call. The combination of his warm personality and jaw-dropping magic created an experience our guests are still raving about weeks later.",
    rating: 5,
  },
  {
    name: "Robert R.",
    role: "Birthday Event",
    text: "I found White Rabbit while searching for something unique for my wife's birthday. The show was fantastic — intimate, funny, and genuinely astonishing. It felt less like a performance and more like an unforgettable evening with friends.",
    rating: 5,
  },
];

const Reviews = () => {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={audienceImg} alt="Audience reacting to Scott Syme White Rabbit magic show at a luxury event in Los Angeles" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-forest-dark/70" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pb-16 pt-32">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Testimonials</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              What They Say
            </h1>
             <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
               They came for the magic. They stayed for the feeling. Hear from guests who left feeling truly alive.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="bg-card border border-border p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-accent text-accent" />
                    ))}
                  </div>
                  <blockquote className="font-serif text-lg text-card-foreground leading-relaxed flex-grow mb-6">
                    "{review.text}"
                  </blockquote>
                  <div>
                    <p className="font-sans text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="font-sans text-xs text-muted-foreground tracking-wider uppercase">{review.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark pt-24 pb-12 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-cream mb-6">Join the Experience</h2>
            <p className="font-sans text-base text-cream/70 mb-10">
              Ready to create your own unforgettable moment?
            </p>
            <Link
              to="/contact"
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default Reviews;
