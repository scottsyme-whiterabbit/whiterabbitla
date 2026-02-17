import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useServiceSchema } from "@/hooks/useSchemaOrg";
import AnimatedSection from "@/components/AnimatedSection";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSeoPagesByCategory } from "@/data/seoPages";

import netflixLogo from "@/assets/logos/netflix.png";
import disneyLogo from "@/assets/logos/disney.png";
import rollsroyceLogo from "@/assets/logos/rollsroyce.png";
import morganstanleyLogo from "@/assets/logos/morganstanley.png";
import paramountLogo from "@/assets/logos/paramount.png";
import rivianLogo from "@/assets/logos/rivian.png";

import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-stage.jpg";
import corporateImg from "@/assets/event-penthouse-show.jpg";
import weddingImg from "@/assets/event-group-photo.jpg";
import privateImg from "@/assets/experience-private.jpg";

const trustLogos = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney", logo: disneyLogo },
  { name: "Morgan Stanley", logo: morganstanleyLogo },
  { name: "Rolls Royce", logo: rollsroyceLogo },
  { name: "Paramount", logo: paramountLogo },
  { name: "Rivian", logo: rivianLogo },
];

interface ServiceData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSub: string;
  image: string;
  intro: string;
  sections: { heading: string; body: string }[];
  included: string[];
  faqs: { question: string; answer: string }[];
  testimonial: { quote: string; attribution: string };
}

const servicePages: Record<string, ServiceData> = {
  "corporate-magician": {
    slug: "corporate-magician",
    title: "Corporate Event Magician",
    metaTitle: "Corporate Event Magician | White Rabbit Magic Entertainment",
    metaDescription: "Hire a world-class corporate event magician for galas, product launches, and executive retreats. Trusted by Netflix, Disney & Morgan Stanley.",
    heroHeadline: "Corporate Event Magic",
    heroSub: "The entertainment your guests will actually remember, and your competitors will wish they'd booked first.",
    image: corporateImg,
    intro: "White Rabbit delivers world-class close-up magic and mentalism for Fortune 500 galas, product launches, holiday parties, and executive retreats. The kind of entertainment that makes your event feel like a first-class experience.",
    sections: [
      {
        heading: "Why Magic Works for Corporate Events",
        body: "Here's the problem with most corporate entertainment: it's forgettable. A DJ nobody dances to. A comedian who doesn't read the room. Background noise. White Rabbit is the opposite. Scott Syme walks into your event and within minutes, your CEO is laughing, your clients are leaning in, and strangers are bonding over something they can't explain. That's not a party trick. That's a business advantage.",
      },
      {
        heading: "Cocktail Hour & Roaming Magic",
        body: "Scott moves through your event performing intimate close-up magic for small groups: cards, mentalism, borrowed objects. Within seconds, people who've never met are gasping, laughing, and bonding over something extraordinary. It's the most effective icebreaker in the corporate entertainment world.",
      },
      {
        heading: "Full Show Experiences",
        body: "For events that call for a centerpiece moment, the Private Magic Show transforms your venue into an intimate theater. Professional lighting, a curated soundtrack, and 45 minutes of world-class magic that leaves your audience speechless. Available as a standalone show or paired with roaming magic for the complete White Rabbit experience.",
      },
    ],
    included: [
      "Pre-event consultation to tailor the performance to your audience and goals",
      "World-class close-up magic, mentalism, and audience interaction",
      "Professional appearance in signature style",
      "Custom integration with your event's theme and timeline",
      "Post-event follow-up to ensure your event exceeded expectations",
    ],
    faqs: [
      { question: "What type of corporate events is White Rabbit best suited for?", answer: "Cocktail receptions, holiday parties, product launches, executive retreats, client appreciation events, trade shows, and galas. Scott's close-up magic is designed to break the ice and create genuine connections between guests." },
      { question: "How long does a corporate performance last?", answer: "Roaming close-up magic is typically booked for 2 to 3 hours. The Private Magic Show is a curated 45-minute theatrical experience. Many clients book both for a full-evening White Rabbit experience." },
      { question: "Can the performance be customized for our brand?", answer: "Absolutely. Every performance is tailored to your event's goals, audience, and tone, from incorporating brand messaging to matching the energy of your event theme." },
      { question: "How far in advance should we book?", answer: "We recommend booking 4 to 8 weeks in advance, especially during peak event season. Contact us with your date and we'll confirm availability within 24 hours." },
    ],
    testimonial: {
      quote: "I've never seen a room full of executives laugh that hard. Every single person came up to me afterward asking where I found him.",
      attribution: "VP of Marketing, Tech Company",
    },
  },
  "wedding-magician": {
    slug: "wedding-magician",
    title: "Wedding Magician",
    metaTitle: "Wedding Magician | Cocktail Hour Entertainment | White Rabbit",
    metaDescription: "Hire a wedding magician who transforms your cocktail hour into the highlight of the evening. Elegant, sophisticated, unforgettable. Check availability.",
    heroHeadline: "Wedding Magic",
    heroSub: "The cocktail hour entertainment that makes your wedding unforgettable, for all the right reasons.",
    image: weddingImg,
    intro: "White Rabbit's cocktail hour magic is the secret weapon couples wish they'd known about sooner. While your guests mingle and the champagne flows, Scott creates moments of pure, joyful astonishment that turn strangers into friends before they even find their seats.",
    sections: [
      {
        heading: "Why Cocktail Hour Magic Works",
        body: "Here's what nobody tells you about weddings: cocktail hour is make-or-break. It's the moment when your college friends meet your partner's family, when coworkers meet cousins. Close-up magic solves this instantly. Within seconds, people who've never met are gasping, laughing, and bonding over something extraordinary.",
      },
      {
        heading: "Elegant & Sophisticated",
        body: "Every performance is perfectly calibrated for the tone of your celebration. No cheesy props. No interrupting toasts. No pulling rabbits out of hats. Just beautiful, intimate moments of wonder that feel right at home at a five-star venue, because that's where White Rabbit belongs.",
      },
      {
        heading: "Tailored to Your Vision",
        body: "Scott has performed at weddings across Southern California and beyond. From clifftop ceremonies to grand ballroom receptions. Each performance is tailored to your guest count, timeline, and vision. Cocktail hour roaming magic, a pre-dinner show, or both: whatever your celebration needs.",
      },
    ],
    included: [
      "Pre-wedding consultation to understand your vision and guest dynamics",
      "Elegant close-up magic designed for wedding atmospheres",
      "Seamless coordination with your wedding planner and venue",
      "Flexible timing to fit your cocktail hour or reception",
      "A follow-up to make sure your celebration exceeded expectations",
    ],
    faqs: [
      { question: "When during the wedding does the magician perform?", answer: "Cocktail hour is the most popular window. It's the perfect time to break the ice between guests. Scott can also perform during the reception or as a pre-dinner show. We work with your timeline to find the ideal moment." },
      { question: "Is the magic appropriate for all ages?", answer: "Yes. Every performance is elegant, sophisticated, and family-friendly. Just beautiful, intimate moments of wonder that feel right at home at a black-tie celebration." },
      { question: "How does booking work with our wedding planner?", answer: "Scott works directly with your planner or coordinator to ensure seamless integration. We handle timing, positioning, and flow so you don't have to think about it on your big day." },
      { question: "How far in advance should we book?", answer: "Peak wedding season (May through October) books months in advance. We recommend reaching out as soon as you have your date to secure availability." },
    ],
    testimonial: {
      quote: "Hiring Scott was the single best decision we made for our wedding. Our guests are STILL talking about him six months later.",
      attribution: "Private Client, Los Angeles",
    },
  },
  "private-party-magician": {
    slug: "private-party-magician",
    title: "Private Party Magician",
    metaTitle: "Private Party Magician | Luxury Event Entertainment | White Rabbit",
    metaDescription: "Hire a private party magician for birthdays, anniversaries, and exclusive celebrations. White Rabbit transforms gatherings into unforgettable experiences.",
    heroHeadline: "Private Party Magic",
    heroSub: "Give your guests a night they'll retell for years, not just another party they attended.",
    image: privateImg,
    intro: "The best parties aren't remembered for the venue or the menu. They're remembered for how they made people feel. White Rabbit transforms birthday celebrations, anniversary dinners, holiday gatherings, and house parties into evenings your guests will never stop talking about.",
    sections: [
      {
        heading: "The White Rabbit Effect",
        body: "Picture this: your guests are gathered close, drinks in hand, when impossible things start happening inches from their fingertips. A card they merely thought of appears in a sealed envelope. A borrowed ring vanishes and reappears inside a locked box. The room erupts. Not polite applause, but genuine, wide-eyed astonishment.",
      },
      {
        heading: "More Than a Magician",
        body: "Scott doesn't just perform tricks. He creates an atmosphere. The lighting shifts, a curated soundtrack sets the mood, and suddenly your living room feels like a private members' club. Every guest feels like the most important person in the room. That's the difference between hiring a magician and hiring White Rabbit.",
      },
      {
        heading: "Perfect for Every Occasion",
        body: "Milestone birthdays (30th, 40th, 50th), engagement parties, holiday gatherings, dinner parties, housewarming celebrations, and any occasion that deserves to be extraordinary. Available for intimate groups of 6 to celebrations of 200+.",
      },
    ],
    included: [
      "Pre-event consultation to tailor the experience to your guests",
      "World-class close-up magic, mentalism, and audience interaction",
      "Professional appearance in signature style",
      "Curated atmosphere with optional sound and lighting",
      "A follow-up to make sure your event exceeded expectations",
    ],
    faqs: [
      { question: "What size party works best?", answer: "White Rabbit performs for intimate gatherings of 6 guests up to celebrations of 200+. For smaller groups, the magic becomes intensely personal. For larger parties, Scott moves through the room creating pockets of wonder everywhere." },
      { question: "What occasions work well with a magician?", answer: "Milestone birthdays, anniversary dinners, engagement parties, holiday gatherings, dinner parties, housewarming celebrations, and bachelorette events. Any occasion where you want guests talking about your party for years." },
      { question: "Can you perform at my home?", answer: "Absolutely. Many of our most memorable performances happen in private homes. Scott transforms any space (living rooms, backyards, dining rooms) into an intimate performance venue." },
      { question: "How far in advance should I book?", answer: "We recommend booking 4 to 8 weeks in advance. Holiday season and summer weekends fill especially fast." },
    ],
    testimonial: {
      quote: "He read my mind. Actually read it. I still don't know how. My guests were screaming with joy, and these are people who don't scream.",
      attribution: "Private Event Host, Beverly Hills",
    },
  },
  "close-up-magician": {
    slug: "close-up-magician",
    title: "Close-Up Magician",
    metaTitle: "Close-Up Magician | Intimate Magic Entertainment | White Rabbit",
    metaDescription: "Hire a world-class close-up magician for your next event. Intimate, interactive magic that happens right in your guests' hands. Check availability.",
    heroHeadline: "Close-Up Magic",
    heroSub: "Magic that happens right in your hands. Intimate, impossible, and absolutely unforgettable.",
    image: closeupImg,
    intro: "Close-up magic is the most powerful form of entertainment because it's personal. It happens right there in your hands, inches from your face. White Rabbit brings world-class interactive magic directly to your guests, creating moments that feel like encountering real magic.",
    sections: [
      {
        heading: "Why Close-Up Magic",
        body: "There's a reason the world's most exclusive events feature close-up magic: it creates genuine human connection. When Scott approaches a group, within sixty seconds they're united. Executives and interns, introverts and extroverts, all sharing the same moment of pure, unfiltered amazement.",
      },
      {
        heading: "Interactive & Personal",
        body: "Scott's close-up work blends interactive magic, mentalism, and mind reading into seamless, conversational performances. Guests don't just watch. They participate. They make impossible choices, they hold objects that vanish and reappear, they experience moments that defy explanation. Every person feels like the star of the show.",
      },
      {
        heading: "Perfect for Any Setting",
        body: "Cocktail hours, dinner parties, VIP lounges, restaurant activations, hotel lobbies, brand activations, trade shows, and any event where you want guests mingling, laughing, and completely present in the moment.",
      },
    ],
    included: [
      "Pre-event consultation to understand your audience and goals",
      "World-class mentalism, interactive magic, and impossible moments",
      "Seamless roaming performance through your event",
      "Professional appearance in signature style",
      "Post-event follow-up",
    ],
    faqs: [
      { question: "What is close-up magic?", answer: "Close-up magic happens right in your guests' hands: cards, coins, borrowed objects. Scott performs for small groups of 4 to 8 at a time, creating intimate, jaw-dropping moments. It's interactive, personal, and the most powerful form of live entertainment." },
      { question: "How long does a close-up performance last?", answer: "Most clients book 2–3 hours of roaming close-up magic. Each small group gets about 8–10 minutes of dedicated performance. Custom timing is always available." },
      { question: "Does close-up magic work for large events?", answer: "Absolutely. Scott moves through events of any size, creating intimate moments within larger gatherings. For 150+ guests, we recommend pairing close-up magic with a Private Magic Show." },
      { question: "What do I need to provide?", answer: "Nothing. Scott brings everything. All you need is your guests and a great event. No stage, no setup, no special requirements." },
    ],
    testimonial: {
      quote: "Our guests didn't just enjoy the show. They came alive. Months later, they still talk about how Scott made them feel.",
      attribution: "Morgan Stanley, Private Client Event",
    },
  },
  "private-magic-show": {
    slug: "private-magic-show",
    title: "Private Magic Show",
    metaTitle: "Private Magic Show | Theatrical Magic Experience | White Rabbit",
    metaDescription: "Book a curated 45-minute theatrical magic show for 20–120 guests. Full production with lighting, sound, and staging. An unforgettable experience.",
    heroHeadline: "The Private Magic Show",
    heroSub: "A curated 45-minute theatrical experience your guests will be buzzing about for months.",
    image: parlorImg,
    intro: "The Private Magic Show is a curated 45-minute theatrical experience: part magic show, part one-man theater, part collective hallucination. Designed for groups of 20 to 120, it transforms any space into an intimate venue where the impossible feels inevitable.",
    sections: [
      {
        heading: "The Experience",
        body: "Imagine emerald curtains, warm lighting, and a curated soundtrack that pulls your guests into another world before the first trick even begins. Then Scott takes the stage, and for the next 45 minutes, reality gets beautifully unreliable. Cards defy physics. Minds are read. Objects appear in places they have no business being. And the audience? They're screaming, laughing, and grabbing each other's arms.",
      },
      {
        heading: "The Centerpiece of Your Evening",
        body: "The Private Magic Show isn't background entertainment. It's the centerpiece of your evening. It's the thing your guests will text each other about the next morning. It's the reason they'll RSVP 'yes' to your next event before you even send the invitation.",
      },
      {
        heading: "Full Production Support",
        body: "White Rabbit provides full production support in the greater Los Angeles area: professional lighting, sound design, and staging, turning your venue, living room, or conference room into a world-class performance space. Every show is tailored to your audience, your space, and the feeling you want to create.",
      },
    ],
    included: [
      "Pre-event consultation to design the perfect show for your audience",
      "45-minute curated theatrical performance",
      "Full production (lighting, sound, staging) in greater LA area",
      "Curated soundtrack and atmosphere design",
      "Post-event follow-up",
    ],
    faqs: [
      { question: "How many guests can attend?", answer: "The Private Magic Show is designed for groups of 20 to 120 guests. This range ensures every person feels connected, close enough to see every detail, intimate enough to feel like they're part of something special." },
      { question: "What space do you need?", answer: "We can transform almost any space: living rooms, event venues, conference rooms, restaurants. In the LA area, we bring full production (curtains, lighting, sound). For events elsewhere, Scott works with your venue's existing setup." },
      { question: "Can the show be paired with close-up magic?", answer: "Yes, this is our most popular combination. Roaming close-up magic during cocktails, then the Private Magic Show as the evening's centerpiece. It's the complete White Rabbit experience." },
      { question: "Is the show appropriate for all audiences?", answer: "Absolutely. The show is sophisticated, elegant, and universally engaging. Perfect for corporate events, private celebrations, and mixed-age gatherings alike." },
    ],
    testimonial: {
      quote: "We've hired entertainers before. Scott is in a completely different category. He turned our cocktail hour into the highlight of the entire evening.",
      attribution: "Director of Events, Fortune 500 Company",
    },
  },
};

const ServicePage = () => {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { openQuiz } = useBookingQuiz();
  const page = serviceSlug ? servicePages[serviceSlug] : undefined;

  usePageMeta({
    title: page?.metaTitle || "White Rabbit LA",
    description: page?.metaDescription || "",
    path: serviceSlug ? `/services/${serviceSlug}` : "/experience",
    image: page?.image,
  });

  useServiceSchema(page ? { title: page.title, metaDescription: page.metaDescription, slug: page.slug, intro: page.intro } : { title: "", metaDescription: "", slug: "", intro: "" });

  // FAQ JSON-LD
  useEffect(() => {
    if (!page?.faqs?.length) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "service-faq-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
    document.getElementById("service-faq-schema")?.remove();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [page]);

  if (!page) {
    return <Navigate to="/experience" replace />;
  }

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <img src={page.image} alt={page.heroHeadline} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-forest-dark/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
              White Rabbit Experience
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              {page.heroHeadline}
            </h1>
            <p className="font-sans text-lg text-cream/80 max-w-2xl mx-auto mb-10">
              {page.heroSub}
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Check Availability
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-forest-dark py-8 border-t border-cream/10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-cream/40 mb-6">
            Trusted by World-Class Brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {trustLogos.map((client) => (
              <img key={client.name} src={client.logo} alt={client.name} className="h-6 md:h-8 w-auto object-contain opacity-50 brightness-0 invert" />
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-lg text-foreground leading-relaxed mb-10 font-medium">
              {page.intro}
            </p>
          </AnimatedSection>

          {page.sections.map((section, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4 mt-12">
                {section.heading}
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
                {section.body}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Mid CTA */}
      <AnimatedSection>
        <section className="bg-secondary/30 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Ready to Elevate Your Event?
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Tell us about your event and we'll confirm availability within 24 hours.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Inquire Now, It's Free
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* What's Included */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <div className="p-8 border border-border">
              <h3 className="font-serif text-2xl text-foreground mb-6">What's Included</h3>
              <ul className="space-y-4">
                {page.included.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-accent mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {page.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="font-sans text-sm md:text-base text-foreground text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonial */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif text-2xl md:text-3xl text-cream/90 leading-relaxed mb-6">
              "{page.testimonial.quote}"
            </blockquote>
            <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
              {page.testimonial.attribution}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Related City Pages */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-6">Available Nationwide</h2>
            <p className="font-sans text-sm text-muted-foreground mb-6">
              White Rabbit performs across the country. Find {page.title.toLowerCase()} services near you:
            </p>
            <div className="flex flex-wrap gap-2">
              {getSeoPagesByCategory(
                page.slug === "corporate-magician" ? "Corporate Events" :
                page.slug === "wedding-magician" ? "Weddings" :
                page.slug === "private-party-magician" ? "Private Events" :
                page.slug === "close-up-magician" ? "Close-Up Magic" :
                "Private Magic Shows"
              )
                .slice(0, 10)
                .map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="font-sans text-xs tracking-[0.15em] uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    {p.location}
                  </Link>
                ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/experience" className="font-sans text-sm text-accent hover:text-accent/80 transition-colors underline underline-offset-4">
                See all experiences →
              </Link>
              <Link to="/reviews" className="font-sans text-sm text-accent hover:text-accent/80 transition-colors underline underline-offset-4">
                Read client reviews →
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Make Your Next Event Unforgettable
            </h2>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">
              Most clients book 2–4 weeks in advance · No obligation to inquire
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors"
            >
              Book White Rabbit Now
            </button>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
};

export default ServicePage;
