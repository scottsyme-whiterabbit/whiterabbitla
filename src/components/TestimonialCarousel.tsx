import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import GoogleReviewsBadge from "./GoogleReviewsBadge";

const testimonials = [
  {
    text: "Beyond magnificent! Scott is mesmerizing and my guests were in awe the entire time. From booking him to seeing him live, I was truly blown away. I could not recommend him highly enough and will most definitely be booking him for future events.",
    name: "Farnaz F.",
    role: "40th Birthday at Gravitas, Beverly Hills",
  },
  {
    text: "Scott performed at a 200-person event for us and the guests absolutely LOVED him and were amazed by his talents. I could not recommend him more! We can't wait to have him back.",
    name: "Morgan Stanley",
    role: "200-Person Corporate Event",
  },
  {
    text: "Scott performed up close magic for small groups at my 40th birthday party and was OUTSTANDING. I can't tell you how many guests told me he was the highlight of the evening.",
    name: "Meridith F.",
    role: "40th Birthday Party",
  },
  {
    text: "He was fantastic to work with from the moment I reached out. Scott is warm, personable, funny, energetic and an EXCELLENT magician. I can't recommend him highly enough.",
    name: "Josh T.",
    role: "Men's Group Host",
  },
  {
    text: "Scott & White Rabbit made my birthday one I will never forget. The show left my friends in awe. I was getting messages for two days after from friends telling me how great it was.",
    name: "Shaahin J.",
    role: "35th Birthday Celebration",
  },
  {
    text: "My company hosted a holiday dinner last Friday, and we had the pleasure of experiencing Scott's magic show. He is incredible and had the whole room captivated.",
    name: "Grace G.",
    role: "Corporate Holiday Dinner",
  },
  {
    text: "2nd year in a row hiring him and he knocks it out of the park both times! All the guests loved him and were blown away from his tricks and magic!",
    name: "Taylor R.",
    role: "Corporate Holiday Party",
  },
];

const TestimonialCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-forest-dark py-20 lg:py-24">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-8">
          What Clients Are Saying
        </p>

        <div className="relative min-h-[200px] md:min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="font-serif text-xl md:text-2xl text-cream/90 leading-relaxed mb-6">
                "{testimonials[current].text}"
              </blockquote>
              <p className="font-sans text-sm tracking-[0.2em] uppercase text-cream/50">
                {testimonials[current].name}, {testimonials[current].role}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-accent w-6" : "bg-cream/20 hover:bg-cream/40"
              }`}
              aria-label={`View testimonial ${i + 1}`}
            />
          ))}
        </div>

        {/* Read More Reviews button */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/reviews"
            className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-cream px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors">
            Read More Reviews
          </Link>
        </div>

        {/* Google badge */}
        <div className="mt-6 flex justify-center">
          <GoogleReviewsBadge variant="dark" />
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
