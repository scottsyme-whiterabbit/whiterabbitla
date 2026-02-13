import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EVENT_TYPES = [
  { id: "corporate", label: "Corporate Event", description: "Galas, product launches, conferences" },
  { id: "wedding", label: "Wedding", description: "Ceremonies, receptions, rehearsal dinners" },
  { id: "private", label: "Private Party", description: "Birthdays, bachelorettes, anniversaries, holidays" },
  { id: "parlor", label: "Parlor Show", description: "Intimate seated show experience" },
  { id: "other", label: "Something Else", description: "Let's talk about your vision" },
];

const GUEST_COUNTS = [
  { id: "intimate", label: "Under 30", description: "Intimate gathering" },
  { id: "medium", label: "30–75", description: "Medium-sized event" },
  { id: "large", label: "75–150", description: "Large event" },
  { id: "xlarge", label: "150+", description: "Grand affair" },
];

const BUDGETS = [
  { id: "exploring", label: "Just Exploring", description: "I'm curious and want to learn more" },
  { id: "intimate", label: "Intimate & Intentional", description: "A curated experience for a smaller gathering" },
  { id: "elevated", label: "Elevated Experience", description: "Something memorable with real production value" },
  { id: "showstopper", label: "Go All Out", description: "No limits — make it unforgettable" },
];

type Step = "event" | "guests" | "date" | "budget" | "contact" | "recommendation";

interface QuizData {
  eventType: string;
  eventLabel: string;
  guestCount: string;
  guestLabel: string;
  date: string;
  budget: string;
  budgetLabel: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

const getRecommendation = (data: QuizData) => {
  const { eventType, guestCount } = data;

  if (eventType === "parlor" || (guestCount === "intimate" && eventType !== "corporate")) {
    return {
      title: "The White Rabbit Parlor Show",
      description:
        "An intimate, seated show with emerald curtains, cinematic uplighting, and a curated soundtrack. Scott transforms your space into something unforgettable — blending card mastery, mentalism, and audience participation that engages all the senses.",
      format: "Parlor Show",
    };
  }

  if (eventType === "corporate" || guestCount === "large" || guestCount === "xlarge") {
    return {
      title: "Corporate & Grand Event Experience",
      description:
        "Scott brings world-class sleight of hand and mentalism with the warmth of a master host. Perfect for cocktail hours and reception entertainment that makes every guest feel like the most important person in the room — then a show-stopping parlor performance.",
      format: "Corporate",
    };
  }

  if (eventType === "wedding") {
    return {
      title: "Wedding & Celebration Magic",
      description:
        "Close-up magic during cocktail hour creates joy and conversation among guests who may be meeting for the first time. Scott weaves through your celebration with warmth, humor, and impossible moments that bring people together.",
      format: "Wedding",
    };
  }

  return {
    title: "Private Event Experience",
    description:
      "Whether it's close-up magic weaving through your guests or a seated parlor show, Scott will craft an experience tailored to your event's energy, space, and guest count — making everyone feel truly alive.",
    format: "Private",
  };
};

const STEPS: Step[] = ["event", "guests", "date", "budget", "contact", "recommendation"];

const BookingQuiz = () => {
  const { isOpen, closeQuiz } = useBookingQuiz();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("event");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<QuizData>({
    eventType: "",
    eventLabel: "",
    guestCount: "",
    guestLabel: "",
    date: "",
    budget: "",
    budgetLabel: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    switch (step) {
      case "event": return !!data.eventType;
      case "guests": return !!data.guestCount;
      case "date": return !!data.date;
      case "budget": return !!data.budget;
      case "contact": return !!data.name && !!data.email && !!data.phone;
      default: return true;
    }
  };

  const next = () => {
    if (stepIndex < STEPS.length - 1 && canAdvance()) {
      setStep(STEPS[stepIndex + 1]);
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const rec = getRecommendation(data);
    try {
      const { error } = await supabase.functions.invoke("send-inquiry", {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          eventType: `${data.eventLabel} (${rec.format})`,
          date: data.date,
          location: "TBD — from quiz funnel",
          message: `Guest Count: ${data.guestLabel}\nBudget: ${data.budgetLabel}\nRecommended: ${rec.title}\n\n${data.message || "No additional message."}`,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or email us at events@whiterabbitla.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeQuiz();
    setTimeout(() => {
      setStep("event");
      setSubmitted(false);
      setData({ eventType: "", eventLabel: "", guestCount: "", guestLabel: "", date: "", budget: "", budgetLabel: "", name: "", email: "", phone: "", message: "" });
    }, 300);
  };

  const OptionCard = ({
    selected,
    label,
    description,
    onClick,
  }: {
    selected: boolean;
    label: string;
    description: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 border transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/10 shadow-sm"
          : "border-border hover:border-accent/50 bg-background"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-sm font-medium text-foreground">{label}</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {selected && <Check size={18} className="text-accent flex-shrink-0" />}
      </div>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-dark/90 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-lg bg-background border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {/* Progress */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step + (submitted ? "-done" : "")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
                        <Sparkles size={28} className="text-accent" />
                      </div>
                      <h3 className="font-serif text-3xl text-foreground mb-4">You're All Set!</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                        Scott will review your inquiry and get back to you within 24 hours with a personalized plan for your event.
                      </p>
                      <Button onClick={handleClose} className="font-sans text-sm tracking-[0.2em] uppercase px-8 py-5">
                        Close
                      </Button>
                    </div>
                  ) : step === "event" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 1 of 5</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">What's the Occasion?</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">Select the type of event you're planning.</p>
                      <div className="space-y-3">
                        {EVENT_TYPES.map((t) => (
                          <OptionCard
                            key={t.id}
                            selected={data.eventType === t.id}
                            label={t.label}
                            description={t.description}
                            onClick={() => setData({ ...data, eventType: t.id, eventLabel: t.label })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : step === "guests" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 2 of 5</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">How Many Guests?</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">This helps us recommend the right format.</p>
                      <div className="space-y-3">
                        {GUEST_COUNTS.map((g) => (
                          <OptionCard
                            key={g.id}
                            selected={data.guestCount === g.id}
                            label={g.label}
                            description={g.description}
                            onClick={() => setData({ ...data, guestCount: g.id, guestLabel: g.label })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : step === "date" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 3 of 5</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">When Is Your Event?</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">An approximate date is fine — we can finalize later.</p>
                      <Input
                        value={data.date}
                        onChange={(e) => setData({ ...data, date: e.target.value })}
                        placeholder="MM/DD/YYYY or 'Spring 2026'"
                        className="bg-background border-border"
                      />
                    </div>
                  ) : step === "budget" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 4 of 5</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">Investment Range</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">This helps us tailor the experience to your vision.</p>
                      <div className="space-y-3">
                        {BUDGETS.map((b) => (
                          <OptionCard
                            key={b.id}
                            selected={data.budget === b.id}
                            label={b.label}
                            description={b.description}
                            onClick={() => setData({ ...data, budget: b.id, budgetLabel: b.label })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : step === "contact" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 5 of 5</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">Almost There!</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">How can Scott reach you?</p>
                      <div className="space-y-4">
                        <div>
                          <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">Name</label>
                          <Input
                            required
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            className="bg-background border-border"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">Email</label>
                          <Input
                            required
                            type="email"
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            className="bg-background border-border"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">Phone</label>
                          <Input
                            required
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData({ ...data, phone: e.target.value })}
                            className="bg-background border-border"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                            Anything else? <span className="normal-case tracking-normal text-muted-foreground/60">(optional)</span>
                          </label>
                          <Textarea
                            value={data.message}
                            onChange={(e) => setData({ ...data, message: e.target.value })}
                            className="bg-background border-border min-h-[80px]"
                            placeholder="Venue, special requests, vision for the event..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : step === "recommendation" ? (
                    <div>
                      {(() => {
                        const rec = getRecommendation(data);
                        return (
                          <>
                            <div className="text-center mb-6">
                              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Your Recommendation</p>
                              <h3 className="font-serif text-2xl text-foreground">{rec.title}</h3>
                            </div>
                            <div className="p-5 bg-accent/5 border border-accent/20 mb-6">
                              <p className="font-sans text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                            </div>
                            <div className="space-y-2 text-sm font-sans text-muted-foreground mb-6">
                              <div className="flex justify-between border-b border-border pb-2">
                                <span>Event</span>
                                <span className="text-foreground">{data.eventLabel}</span>
                              </div>
                              <div className="flex justify-between border-b border-border pb-2">
                                <span>Guests</span>
                                <span className="text-foreground">{data.guestLabel}</span>
                              </div>
                              <div className="flex justify-between border-b border-border pb-2">
                                <span>Date</span>
                                <span className="text-foreground">{data.date}</span>
                              </div>
                              <div className="flex justify-between pb-2">
                                <span>Budget</span>
                                <span className="text-foreground">{data.budgetLabel}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!submitted && (
              <div className="p-6 border-t border-border flex items-center justify-between">
                {stepIndex > 0 ? (
                  <button
                    onClick={prev}
                    className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step === "recommendation" ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="font-sans text-sm tracking-[0.15em] uppercase px-8 py-5"
                  >
                    {isSubmitting ? "Sending..." : "Send Inquiry"}
                    {!isSubmitting && <ArrowRight size={16} className="ml-1" />}
                  </Button>
                ) : (
                  <Button
                    onClick={next}
                    disabled={!canAdvance()}
                    className="font-sans text-sm tracking-[0.15em] uppercase px-8 py-5"
                  >
                    Continue <ArrowRight size={16} className="ml-1" />
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingQuiz;
