import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import closeupImg from "@/assets/event-closeup-reaction.jpg";
import parlorImg from "@/assets/event-parlor-show.jpg";
import corporateImg from "@/assets/event-scott-cards.jpg";
import privateImg from "@/assets/event-crowd.jpg";

const services = [
  {
    title: "Close-Up Magic",
    description: "Intimate sleight of hand performed inches away — but it's the hospitality that sets it apart. Scott moves through your event like a world-class host, making every guest feel like the most important person in the room. Perfect for cocktail hours, dinners, and VIP receptions.",
    image: closeupImg,
  },
  {
    title: "Parlor Shows",
    description: "The premium White Rabbit experience. Scott transforms your space with emerald curtain drapes, cinematic uplighting, and a curated show soundtrack — turning any room into an atmosphere that feels like stepping into an upscale hotel lobby. For 20–100 guests, the show is bigger emotionally than it is physically. Guests walk away feeling like they experienced something they've never felt before.",
    image: parlorImg,
  },
  {
    title: "Corporate Events",
    description: "Fortune 500 galas, product launches, executive retreats — Scott brings the warmth and sophistication of a first-class experience to your corporate gathering. Your team and clients don't just watch entertainment; they feel taken care of, connected, and alive. That's why the world's top brands keep coming back.",
    image: corporateImg,
  },
  {
    title: "Weddings & Private Events",
    description: "Birthdays, weddings, holiday celebrations, and exclusive gatherings. Scott creates an atmosphere of joy and genuine connection that brings people together. Guests leave with stories to tell their friends and a lasting impression that this was unlike anything they've experienced before.",
    image: privateImg,
  },
];

const Experience = () => {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">The White Rabbit Experience</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              An Encounter with Joy
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-2xl mx-auto leading-relaxed">
              A White Rabbit experience is more than magic — it's an atmosphere of warmth, wonder, and world-class hospitality. 
              Scott Syme transforms your space into something extraordinary, where every guest feels seen, cared for, and truly alive. 
              They leave with more than amazement — they leave feeling changed.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Services */}
      {services.map((service, index) => (
        <section key={service.title} className={`py-24 ${index % 2 === 0 ? "" : "bg-card"}`}>
          <div className={`max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? "lg:direction-rtl" : ""}`}>
            <AnimatedSection className={index % 2 === 1 ? "lg:order-2" : ""}>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={service.image} alt={`${service.title} — White Rabbit luxury magic entertainment Los Angeles`} className="w-full h-full object-cover" />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2} className={index % 2 === 1 ? "lg:order-1" : ""}>
              <div>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">{service.title}</h2>
                <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">{service.description}</p>
                <Link
                  to="/contact"
                  className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Inquire
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      ))}

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-cream mb-6">Give Your Guests a Memory That Lasts</h2>
            <p className="font-sans text-base text-cream/70 mb-10">
              Let Scott transform your next event into an atmosphere of wonder, joy, and genuine connection.
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

export default Experience;
