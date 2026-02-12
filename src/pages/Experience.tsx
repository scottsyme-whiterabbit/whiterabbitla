import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import closeupImg from "@/assets/experience-closeup.jpg";
import parlorImg from "@/assets/experience-parlor.jpg";
import corporateImg from "@/assets/experience-corporate.jpg";
import privateImg from "@/assets/experience-private.jpg";

const services = [
  {
    title: "Close-Up Magic",
    description: "Intimate, jaw-dropping sleight of hand performed inches away. Perfect for cocktail hours, dinners, and VIP receptions where personal connection matters most.",
    image: closeupImg,
  },
  {
    title: "Parlor Shows",
    description: "An elegant, theatrical experience for groups of 20–100 guests. A curated show blending storytelling, mystery, and audience participation in an intimate setting.",
    image: parlorImg,
  },
  {
    title: "Corporate Events",
    description: "From Fortune 500 galas to product launches, White Rabbit brings sophistication and wonder to corporate gatherings that demand excellence.",
    image: corporateImg,
  },
  {
    title: "Private Events",
    description: "Birthdays, weddings, holiday parties, and exclusive gatherings. A bespoke performance tailored to your celebration and your guests.",
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
              Magic, Elevated
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-2xl mx-auto leading-relaxed">
              Every performance is meticulously crafted for your audience, your venue, and your vision. 
              Immersive. Personalized. Sophisticated.
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
                <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
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
            <h2 className="font-serif text-4xl md:text-5xl text-cream mb-6">Ready to Begin?</h2>
            <p className="font-sans text-base text-cream/70 mb-10">
              Let's craft the perfect experience for your next event.
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
