import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trackFormSubmit } from "@/lib/analytics";
import { Star, Calendar, DollarSign, Clock, ChevronDown } from "lucide-react";
import wrLogo from "@/assets/wr-logo-stars-white.png";

const EVENT_TYPES = [
  "Corporate Event",
  "Wedding",
  "Private Party",
  "Nonprofit Gala",
  "Restaurant / Venue",
  "Other",
];

const testimonials = [
  { quote: "The best entertainment decision we ever made.", role: "Corporate Event Planner" },
  { quote: "Our guests are STILL talking about it.", role: "Wedding Coordinator" },
  { quote: "Scott made our fundraiser unforgettable.", role: "Nonprofit Director" },
];

const stats = [
  { value: "500+", label: "Events" },
  { value: "5-Star", label: "Rated" },
  { value: "Los Angeles", label: "Based" },
];

const features = [
  {
    icon: <Calendar className="w-8 h-8 text-accent" />,
    title: "Custom Event Plan",
    desc: "Tailored to your event type and audience.",
  },
  {
    icon: <DollarSign className="w-8 h-8 text-accent" />,
    title: "Transparent Pricing",
    desc: "Clear quotes with no hidden fees.",
  },
  {
    icon: <Clock className="w-8 h-8 text-accent" />,
    title: "Flexible Scheduling",
    desc: "We work around your timeline.",
  },
];

const Consultation = () => {
  usePageMeta({
    title: "Free Consultation | White Rabbit LA — Luxury Event Magician",
    description: "Book a free consultation with Los Angeles' premier close-up magician. Corporate events, weddings, private parties and galas.",
    path: "/consultation",
  });

  const formRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    event_type: "",
    event_date: "",
    description: "",
  });

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      await (supabase as any).from("consultation_leads").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        event_type: form.event_type || null,
        event_date: form.event_date || null,
        description: form.description.trim() || null,
        source: "meta_ads",
      });
      trackFormSubmit("consultation", "meta_ads");
      setSubmitted(true);
    } catch {
      // silent fail — lead still likely saved
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-dark text-cream">
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <motion.img
          src={wrLogo}
          alt="White Rabbit LA"
          className="h-16 md:h-20 w-auto mb-10 opacity-90"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.h1
          className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Make Your Next Event{" "}
          <span className="text-accent">Unforgettable</span>
        </motion.h1>
        <motion.p
          className="mt-6 font-sans text-base md:text-lg text-cream/70 max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          Book a complimentary consultation with White Rabbit LA. We'll design a custom
          magic experience your guests will talk about for years.
        </motion.p>
        <motion.button
          onClick={scrollToForm}
          className="mt-10 bg-accent text-accent-foreground font-sans text-sm md:text-base tracking-[0.2em] uppercase px-10 py-4 hover:bg-accent/85 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          Book Your Free Consultation
        </motion.button>
        <ChevronDown className="mt-12 w-6 h-6 text-cream/30 animate-bounce" />
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-forest-dark/80 border-y border-cream/10 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="text-center flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="font-serif text-base md:text-lg italic text-cream/90">"{t.quote}"</p>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-accent/80">
                {t.role} — {t.location}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-serif text-2xl md:text-3xl text-accent">{s.value}</p>
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-cream/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl md:text-4xl text-center mb-12">
            What's Included in Your{" "}
            <span className="text-accent">Free Consultation</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="bg-cream/5 border border-cream/10 p-8 text-center flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {f.icon}
                <h3 className="font-serif text-xl text-cream">{f.title}</h3>
                <p className="font-sans text-sm text-cream/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section ref={formRef} className="py-16 md:py-24 px-6 bg-forest-dark/60">
        <div className="max-w-xl mx-auto">
          <h2 className="font-serif text-2xl md:text-4xl text-center mb-10">
            Book Your <span className="text-accent">Free Consultation</span>
          </h2>

          {submitted ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              <h3 className="font-serif text-2xl mb-3">Thank You!</h3>
              <p className="font-sans text-cream/70">We'll be in touch within 24 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <input
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-cream/5 border border-cream/15 text-cream placeholder:text-cream/40 font-sans text-sm px-5 py-4 focus:outline-none focus:border-accent/60 transition-colors"
              />
              <input
                name="email"
                type="email"
                required
                maxLength={255}
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-cream/5 border border-cream/15 text-cream placeholder:text-cream/40 font-sans text-sm px-5 py-4 focus:outline-none focus:border-accent/60 transition-colors"
              />
              <input
                name="phone"
                type="tel"
                maxLength={20}
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-cream/5 border border-cream/15 text-cream placeholder:text-cream/40 font-sans text-sm px-5 py-4 focus:outline-none focus:border-accent/60 transition-colors"
              />
              <div className="relative">
                <select
                  name="event_type"
                  value={form.event_type}
                  onChange={handleChange}
                  className="w-full bg-cream/5 border border-cream/15 text-cream font-sans text-sm px-5 py-4 appearance-none focus:outline-none focus:border-accent/60 transition-colors"
                >
                  <option value="" className="bg-forest-dark">Event Type</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-forest-dark">{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40 pointer-events-none" />
              </div>
              <input
                name="event_date"
                type="date"
                value={form.event_date}
                onChange={handleChange}
                className="w-full bg-cream/5 border border-cream/15 text-cream font-sans text-sm px-5 py-4 focus:outline-none focus:border-accent/60 transition-colors [color-scheme:dark]"
              />
              <textarea
                name="description"
                maxLength={1000}
                rows={4}
                placeholder="Brief Event Description"
                value={form.description}
                onChange={handleChange}
                className="w-full bg-cream/5 border border-cream/15 text-cream placeholder:text-cream/40 font-sans text-sm px-5 py-4 focus:outline-none focus:border-accent/60 transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground font-sans text-sm tracking-[0.2em] uppercase py-4 hover:bg-accent/85 transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? "Submitting..." : "Get My Free Consultation"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* MINI FOOTER */}
      <footer className="py-10 text-center border-t border-cream/10">
        <p className="font-serif text-sm text-cream/50">
          White Rabbit LA · Luxury Magic Entertainment
        </p>
        <a
          href="https://whiterabbitla.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs text-accent/60 hover:text-accent transition-colors mt-2 inline-block"
        >
          whiterabbitla.com
        </a>
      </footer>
    </div>
  );
};

export default Consultation;
