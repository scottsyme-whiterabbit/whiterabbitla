import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { supabase } from "@/integrations/supabase/client";
import AnimatedSection from "@/components/AnimatedSection";
import PersonaCard, { personas, getPersona } from "@/components/PersonaCard";
import { trackQuizStart, trackQuizComplete } from "@/lib/analytics";
import threeStars from "@/assets/three-stars-gold.png";

interface QuizAnswer {
  eventType: string;
  clientType: string;
  vibe: string;
  concern: string;
  guestCount: string;
  priority: string;
}

const questions = [
  {
    id: "eventType",
    question: "What kind of event are you planning?",
    subtitle: "This helps us tailor the perfect experience.",
    options: [
      { value: "corporate", label: "Corporate Event", desc: "Team building, client dinner, product launch" },
      { value: "wedding", label: "Wedding or Rehearsal", desc: "Cocktail hour, reception, after-party" },
      { value: "private", label: "Private Party", desc: "Birthday, anniversary, holiday gathering" },
      { value: "fundraiser", label: "Fundraiser or Gala", desc: "Charity event, auction, benefit dinner" },
      { value: "unsure", label: "Not sure yet", desc: "Just exploring what's possible" },
    ],
  },
  {
    id: "clientType",
    question: "Which best describes you?",
    subtitle: "This helps us personalize your experience.",
    options: [
      { value: "corporate", label: "Business / Corporate", desc: "Company event, team outing, client entertainment" },
      { value: "planner", label: "Event Planner / Coordinator", desc: "Planning on behalf of a client or organization" },
      { value: "wedding_planner", label: "Wedding Planner / Bride & Groom", desc: "Planning a wedding or rehearsal event" },
      { value: "individual", label: "Individual / Host", desc: "Hosting a personal celebration or gathering" },
      { value: "other", label: "Other", desc: "Something else entirely" },
    ],
  },
  {
    id: "vibe",
    question: "What vibe are you going for?",
    subtitle: "There's no wrong answer — every event has a sweet spot.",
    options: [
      { value: "elegant", label: "Elegant & Sophisticated", desc: "Think candlelit, curated, luxurious" },
      { value: "fun", label: "Fun & High-Energy", desc: "Laughter, interaction, unforgettable moments" },
      { value: "intimate", label: "Intimate & Personal", desc: "Small group, meaningful connections" },
      { value: "wow", label: "Jaw-Dropping Wow Factor", desc: "Leave them speechless" },
    ],
  },
  {
    id: "concern",
    question: "What's your biggest hesitation about hiring a magician?",
    subtitle: "Be honest — we've heard it all, and we get it.",
    options: [
      { value: "cheesy", label: "I'm worried it'll feel cheesy", desc: "Top hats and rabbits aren't my thing" },
      { value: "audience", label: "My guests are hard to impress", desc: "They've seen everything" },
      { value: "fit", label: "I'm not sure it fits my event", desc: "Is magic even right for this crowd?" },
      { value: "budget", label: "I'm unsure about the investment", desc: "Is it worth the budget?" },
      { value: "none", label: "No hesitation — just curious!", desc: "Show me what you've got" },
    ],
  },
  {
    id: "guestCount",
    question: "How many guests are you expecting?",
    subtitle: "This helps us recommend the right format.",
    options: [
      { value: "intimate", label: "Under 30", desc: "Intimate gathering" },
      { value: "medium", label: "30–75", desc: "Medium-sized event" },
      { value: "large", label: "75–200", desc: "Large event" },
      { value: "grand", label: "200+", desc: "Grand-scale production" },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you?",
    subtitle: "Pick the one that resonates most.",
    options: [
      { value: "memorable", label: "Making it unforgettable", desc: "I want guests talking about this for years" },
      { value: "engagement", label: "Guest engagement", desc: "I want everyone involved, not just watching" },
      { value: "seamless", label: "Seamless integration", desc: "It should feel effortless and natural" },
      { value: "unique", label: "Something truly unique", desc: "Nothing generic — I want a one-of-a-kind moment" },
    ],
  },
];

type RecommendationKey = "closeup" | "parlor" | "full" | "cocktail";

interface Recommendation {
  title: string;
  subtitle: string;
  description: string;
  ideal: string[];
  objectionResponse: string;
}

const recommendations: Record<RecommendationKey, Recommendation> = {
  closeup: {
    title: "Close-Up Magic Experience",
    subtitle: "Intimate. Interactive. Impossible.",
    description:
      "This is magic that happens in your guests' hands. No stage, no distance — just breathtaking sleight of hand performed inches away. It's the most personal, most talked-about form of entertainment you can offer.",
    ideal: [
      "Cocktail hours and receptions",
      "Intimate dinners and private parties",
      "VIP client experiences",
      "Events where you want every guest engaged",
    ],
    objectionResponse:
      "This isn't the magic you're imagining. There are no props, no gimmicks, no awkward audience participation. It's elegant, sophisticated, and performed at the level of a Michelin-starred experience. Your guests will feel like they witnessed something truly impossible.",
  },
  parlor: {
    title: "Parlor Show Experience",
    subtitle: "A curated performance for a captivated room.",
    description:
      "A 30–45 minute seated show designed for groups of 20–80 guests. Think of it as a private theatrical experience — intimate enough that everyone feels the magic, grand enough to feel like an event within your event.",
    ideal: [
      "Rehearsal dinners and wedding receptions",
      "Corporate retreats and team events",
      "Birthday celebrations and milestones",
      "Private dining rooms and intimate venues",
    ],
    objectionResponse:
      "This is not a kids' birthday party act. It's a fully produced, cinematic experience with curated lighting, a signature soundtrack, and moments that make a room of adults gasp. Brands like Netflix, Morgan Stanley, and Rolls Royce have trusted this experience for their most important guests.",
  },
  full: {
    title: "Full Evening Experience",
    subtitle: "Close-up magic + a private show. The complete package.",
    description:
      "Scott moves through your event in two acts: first, performing jaw-dropping close-up magic during cocktails, building anticipation and intrigue. Then, a curated parlor show gathers the room for a shared, cinematic finale. It's the ultimate way to create a night no one forgets.",
    ideal: [
      "Weddings and galas",
      "Corporate holiday parties",
      "High-end private celebrations",
      "Any event where you want to leave a lasting impression",
    ],
    objectionResponse:
      "This is the format that makes even the most skeptical guests become the biggest fans. The close-up magic earns their trust; the show earns their standing ovation. It's been refined across hundreds of events for the world's most discerning audiences.",
  },
  cocktail: {
    title: "Cocktail Hour Magic",
    subtitle: "The ultimate icebreaker for any gathering.",
    description:
      "Scott mingles with guests during cocktail hour, performing impossible moments at each table or group. It creates organic conversation, breaks the ice, and sets an extraordinary tone for the rest of the evening. No setup needed — just seamless magic.",
    ideal: [
      "Pre-dinner cocktail receptions",
      "Networking events and mixers",
      "Product launches and brand activations",
      "Any event that needs an elevated atmosphere",
    ],
    objectionResponse:
      "This is the gateway experience. If you're not sure about magic, this is the lowest commitment, highest reward option. It requires zero setup, integrates seamlessly, and transforms an ordinary cocktail hour into the most memorable part of the night.",
  },
};

function getRecommendation(answers: QuizAnswer): RecommendationKey {
  const { vibe, concern, guestCount, priority } = answers;

  if (guestCount === "grand" || (guestCount === "large" && priority === "memorable")) return "full";
  if (guestCount === "intimate" && (vibe === "intimate" || vibe === "elegant")) return "closeup";
  if (vibe === "wow" || priority === "memorable") return "full";
  if (concern === "cheesy" || concern === "fit") return "cocktail";
  if (vibe === "fun" || priority === "engagement") return "closeup";
  if (priority === "seamless") return "cocktail";
  if (guestCount === "medium") return "parlor";
  return "parlor";
}

const DiscoveryQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswer>>({});
  const [showResult, setShowResult] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exactGuestCount, setExactGuestCount] = useState("");
  const { openQuiz } = useBookingQuiz();

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (value: string) => {
    const key = currentQuestion.id as keyof QuizAnswer;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    // Don't auto-advance when "Under 30" is picked — wait so they can fill optional exact count
    const isUnder30Pick = currentQuestion.id === "guestCount" && value === "intimate";
    if (isUnder30Pick) return;

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const advance = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const recommendation = recommendations[getRecommendation(answers as QuizAnswer)];

  const handleSubmitLead = async () => {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      // Save to quiz leads table — append exact count to guest_count if Under 30 + provided
      const guestCountValue = answers.guestCount === "intimate" && exactGuestCount.trim()
        ? `Under 30 (${exactGuestCount.trim()} guests)`
        : answers.guestCount || null;

      await supabase.from("discovery_quiz_leads").insert({
        name: name.trim(),
        email: email.trim(),
        event_type: answers.eventType || null,
        guest_count: guestCountValue,
        biggest_concern: answers.concern || null,
        experience_priority: answers.priority || null,
        client_type: answers.clientType || null,
        recommendation: recommendation.title,
        quiz_answers: { ...answers, exact_guest_count: exactGuestCount.trim() || null },
      });

      // Auto-enroll into drip sequence (fire and forget)
      const personaKey = getPersona(answers as QuizAnswer);
      const personaName = personas[personaKey]?.name || "";
      supabase.functions.invoke("enroll-drip", {
        body: {
          name: name.trim(),
          email: email.trim(),
          source: "quiz",
          persona: personaName,
          recommendation: recommendation.title,
        },
      });

      // Meta Pixel: track discovery quiz completion
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'CompleteRegistration', {
          content_name: 'Discovery Quiz',
          content_category: recommendation.title,
        });
      }
      // GA4: track discovery quiz completion
      trackQuizComplete("discovery", recommendation.title);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-forest-dark text-cream pt-24 pb-16">
      <SEOHead title="Get a Custom Magic Quote in 60 Seconds | White Rabbit LA" description="Tell us about your event in 60 seconds for a custom magic entertainment quote. Magic Castle pro Scott Syme — LA-based, available for events nationwide." canonical="/quiz" />
      <div className="max-w-2xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              {/* Progress */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-cream/40">
                    Question {step + 1} of {questions.length}
                  </p>
                  {step > 0 && (
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1 font-sans text-xs tracking-wider uppercase text-cream/50 hover:text-cream transition-colors"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                </div>
                <div className="h-1 bg-cream/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Question */}
              <h1 className="font-serif text-3xl md:text-4xl text-cream mb-3">
                {currentQuestion.question}
              </h1>
              <p className="font-sans text-sm text-cream/50 mb-10">
                {currentQuestion.subtitle}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id as keyof QuizAnswer] === option.value;
                  const isUnder30 = currentQuestion.id === "guestCount" && option.value === "intimate";
                  return (
                    <div key={option.value}>
                      <button
                        onClick={() => handleSelect(option.value)}
                        className={`w-full text-left p-5 border rounded transition-all duration-200 group ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-cream/15 hover:border-cream/30 hover:bg-cream/5"
                        }`}
                      >
                        <p className="font-sans text-base text-cream font-medium mb-1">{option.label}</p>
                        <p className="font-sans text-sm text-cream/50">{option.desc}</p>
                      </button>
                      {isUnder30 && isSelected && (
                        <div className="mt-3 ml-1 flex flex-col sm:flex-row sm:items-end gap-3">
                          <div className="flex-1">
                            <label className="font-sans text-xs tracking-[0.15em] uppercase text-cream/50 mb-2 block">
                              Optional — exact guest count
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={29}
                              value={exactGuestCount}
                              onChange={(e) => setExactGuestCount(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="e.g. 12"
                              className="w-full sm:w-48 bg-forest-dark/50 border border-cream/15 rounded px-4 py-3 font-sans text-cream placeholder:text-cream/30 focus:outline-none focus:border-accent transition-colors"
                            />
                          </div>
                          <button
                            onClick={advance}
                            className="font-sans text-xs tracking-[0.2em] uppercase bg-accent text-accent-foreground px-6 py-3 hover:bg-accent/80 transition-colors flex items-center gap-2"
                          >
                            Continue <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Recommendation First */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                  className="flex justify-center mb-4"
                >
                  <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-12 w-auto opacity-50" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3"
                >
                  Our Recommendation for You
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="font-serif text-4xl md:text-5xl text-cream mb-3"
                >
                  {recommendation.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="font-serif text-lg text-cream/60 italic mb-2"
                >
                  {recommendation.subtitle}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="space-y-8"
              >
                {/* Recommendation description */}
                <p className="font-sans text-base text-cream/80 leading-relaxed text-center">
                  {recommendation.description}
                </p>

                {/* Address their concern */}
                {answers.concern && answers.concern !== "none" && (
                  <div className="border border-accent/30 rounded p-6 bg-accent/5">
                    <p className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-3">
                      About your hesitation…
                    </p>
                    <p className="font-sans text-sm text-cream/80 leading-relaxed">
                      {recommendation.objectionResponse}
                    </p>
                  </div>
                )}

                {/* Ideal for */}
                <div>
                  <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/40 mb-4">
                    Ideal For
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendation.ideal.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                        <p className="font-sans text-sm text-cream/70">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgency CTA */}
                <div className="text-center border border-accent/30 rounded p-8 bg-accent/5">
                  <p className="font-serif text-2xl text-cream mb-2">Ready to Book Your Experience?</p>
                  <p className="font-sans text-sm text-cream/60 mb-6">
                    Scott's calendar fills up quickly, especially during peak event season. Lock in your preferred date before it's taken.
                  </p>
                  <button
                    onClick={openQuiz}
                    className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors mb-3"
                  >
                    Book an Experience
                  </button>
                  <p className="font-sans text-xs text-cream/40 tracking-wide">
                    Limited availability. No obligation to confirm until you're ready.
                  </p>
                </div>

                {/* Persona reveal + card — Zoltar-style dramatic reveal */}
                <motion.div
                  className="border-t border-cream/10 pt-10 relative overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.8 }}
                >
                  {/* Mystical glow backdrop */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0.3] }}
                    transition={{ delay: 2.8, duration: 2, ease: "easeOut" }}
                    style={{
                      background: "radial-gradient(ellipse at center, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
                    }}
                  />

                  <motion.p
                    className="font-sans text-[10px] tracking-[0.4em] uppercase text-cream/40 text-center mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.8, duration: 0.6 }}
                  >
                    The cards have spoken
                  </motion.p>

                  <motion.p
                    className="font-sans text-xs tracking-[0.3em] uppercase text-accent text-center mb-1"
                    initial={{ opacity: 0, letterSpacing: "0.6em" }}
                    animate={{ opacity: 1, letterSpacing: "0.3em" }}
                    transition={{ delay: 3.1, duration: 0.8, ease: "easeOut" }}
                  >
                    Your Magic Guest Persona
                  </motion.p>

                  <motion.div
                    className="flex justify-center my-4"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 3.4, duration: 0.6, ease: "easeOut" }}
                  >
                    <div className="w-16 h-px bg-accent/40" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 3.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <PersonaCard persona={personas[getPersona(answers as QuizAnswer)]} />
                  </motion.div>

                  <motion.p
                    className="font-sans text-sm text-cream/50 text-center mt-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.2, duration: 0.6 }}
                  >
                    Save and share your persona card with friends.
                  </motion.p>
                </motion.div>

                {/* Lead capture */}
                {!submitted ? (
                  <div className="border-t border-cream/10 pt-8">
                    <p className="font-serif text-2xl text-cream mb-2">
                      Want us to follow up with details?
                    </p>
                    <p className="font-sans text-sm text-cream/50 mb-6">
                      Drop your info and we'll send you a personalized overview. No pressure, no spam.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 bg-cream/5 border border-cream/15 rounded px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-accent"
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-cream/5 border border-cream/15 rounded px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <button
                      onClick={handleSubmitLead}
                      disabled={submitting || !name.trim() || !email.trim()}
                      className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground py-3.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Sending…" : "Send Me Details"}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-cream/10 pt-8 text-center">
                    <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-12 w-auto opacity-50 mx-auto mb-4" />
                    <p className="font-serif text-xl text-cream mb-2">You're all set.</p>
                    <p className="font-sans text-sm text-cream/50 mb-6">
                      We'll be in touch shortly with a personalized overview.
                    </p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5, duration: 0.6 }}
                      className="mt-4"
                    >
                      <p className="font-sans text-xs text-cream/40 mb-3">Already know your date?</p>
                      <button
                        onClick={openQuiz}
                        className="inline-block font-sans text-xs tracking-[0.2em] uppercase border border-accent/50 text-accent px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        Book Now
                      </button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default DiscoveryQuiz;
