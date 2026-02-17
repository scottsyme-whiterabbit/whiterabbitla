import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CLIENT_TYPES = [
  { id: "corporate", label: "Corporate / Brand", description: "Planning on behalf of a company or brand" },
  { id: "event_planner", label: "Event Planner", description: "Professional planner booking for a client" },
  { id: "wedding_planner", label: "Wedding Planner", description: "Coordinating a wedding celebration" },
  { id: "individual", label: "Individual", description: "Planning my own private event" },
];

const EVENT_TYPES = [
  { id: "corporate", label: "Corporate Event", description: "Galas, product launches, golf tournaments, conferences" },
  { id: "wedding", label: "Wedding", description: "Ceremonies, receptions, rehearsal dinners" },
  { id: "private", label: "Private Party", description: "Birthdays, red carpet events, anniversaries, holidays" },
  { id: "parlor", label: "Private Magic Show", description: "Intimate seated show for your home or venue" },
  { id: "other", label: "Something Else", description: "Award ceremonies, charity galas, brand activations" },
];

const GUEST_COUNTS = [
  { id: "intimate", label: "Under 30", description: "Intimate dinner or VIP reception" },
  { id: "medium", label: "30–75", description: "Private party or cocktail hour" },
  { id: "large", label: "75–150", description: "Corporate event or gala" },
  { id: "xlarge", label: "150+", description: "Grand affair, tournament, or festival" },
];

const BUDGETS = [
  { id: "exploring", label: "Just Exploring", description: "Curious about what's possible for my event" },
  { id: "intimate", label: "Intimate & Intentional", description: "Close-up magic for a dinner or cocktail hour" },
  { id: "elevated", label: "Elevated Experience", description: "A curated show that transforms the room" },
  { id: "showstopper", label: "Go All Out", description: "The full White Rabbit experience, no limits" },
];

type Step = "clientType" | "event" | "location" | "guests" | "date" | "budget" | "contact" | "recommendation";

interface QuizData {
  clientType: string;
  clientTypeLabel: string;
  eventType: string;
  eventLabel: string;
  location: string;
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
      title: "The White Rabbit Private Magic Show",
      description:
        "An intimate, seated show with emerald curtains, cinematic uplighting, and a curated soundtrack. Scott transforms your space into something unforgettable, blending card mastery, mentalism, and audience participation that engages all the senses.",
      format: "Private Magic Show",
    };
  }

  if (eventType === "corporate" || guestCount === "large" || guestCount === "xlarge") {
    return {
      title: "Corporate & Grand Event Experience",
      description:
        "Scott brings world-class sleight of hand and mentalism with the warmth of a master host. Perfect for cocktail hours and reception entertainment that makes every guest feel like the most important person in the room, followed by a show-stopping parlor performance.",
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
      "Whether it's close-up magic weaving through your guests or a seated parlor show, Scott will craft an experience tailored to your event's energy, space, and guest count. Making everyone feel truly alive.",
    format: "Private",
  };
};

const STEPS: Step[] = ["clientType", "event", "location", "guests", "date", "budget", "contact", "recommendation"];

const BookingQuiz = () => {
  const { isOpen, closeQuiz } = useBookingQuiz();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("clientType");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<QuizData>({
    clientType: "",
    clientTypeLabel: "",
    eventType: "",
    eventLabel: "",
    location: "",
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
      case "clientType": return !!data.clientType;
      case "event": return !!data.eventType;
      case "location": return !!data.location;
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
      // Save to database
      await supabase.from("contact_inquiries").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        event_type: data.eventLabel,
        date: data.date,
        location: data.location || "TBD",
        guest_count: data.guestLabel,
        budget: data.budgetLabel,
        message: data.message || null,
        client_type: data.clientType || null,
        source: "booking_quiz",
        recommendation: rec.title,
      });

      // Send email notification
      const { error } = await supabase.functions.invoke("send-inquiry", {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          eventType: `${data.eventLabel} (${rec.format})`,
          date: data.date,
          location: data.location || "TBD",
          message: `Client Type: ${data.clientTypeLabel}\nGuest Count: ${data.guestLabel}\nBudget: ${data.budgetLabel}\nRecommended: ${rec.title}\n\n${data.message || "No additional message."}`,
        },
      });
      if (error) throw error;
      // Meta Pixel: track booking quiz lead
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Booking Quiz',
          content_category: data.eventLabel || 'Event Inquiry',
        });
      }
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
      setStep("clientType");
      setSubmitted(false);
      setData({ clientType: "", clientTypeLabel: "", eventType: "", eventLabel: "", location: "", guestCount: "", guestLabel: "", date: "", budget: "", budgetLabel: "", name: "", email: "", phone: "", message: "" });
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
            role="dialog"
            aria-modal="true"
            aria-label="Booking quiz"
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
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Close booking quiz"
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
                  ) : step === "clientType" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 1 of 7</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">Which Best Describes You?</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">This helps us tailor the experience.</p>
                      <div className="space-y-3">
                        {CLIENT_TYPES.map((c) => (
                          <OptionCard
                            key={c.id}
                            selected={data.clientType === c.id}
                            label={c.label}
                            description={c.description}
                            onClick={() => setData({ ...data, clientType: c.id, clientTypeLabel: c.label })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : step === "event" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 2 of 7</p>
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
                  ) : step === "location" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 3 of 7</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">Where's the Event?</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">City or general area. Helps us plan logistics.</p>
                      <Input
                        value={data.location}
                        onChange={(e) => setData({ ...data, location: e.target.value })}
                        placeholder="e.g. Los Angeles, Miami, New York..."
                        className="bg-background border-border"
                      />
                    </div>
                  ) : step === "guests" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 4 of 7</p>
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
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 5 of 7</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">When Is Your Event?</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">An approximate date is fine. We can finalize later.</p>
                      <Input
                        value={data.date}
                        onChange={(e) => setData({ ...data, date: e.target.value })}
                        placeholder="MM/DD/YYYY or 'Spring 2026'"
                        className="bg-background border-border"
                      />
                    </div>
                  ) : step === "budget" ? (
                    <div>
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 6 of 7</p>
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
                      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">Step 7 of 7</p>
                      <h3 className="font-serif text-2xl text-foreground mb-2">Almost There!</h3>
                      <p className="font-sans text-sm text-muted-foreground mb-6">How can Scott reach you?</p>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="quiz-name" className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">Name</label>
                          <Input
                            id="quiz-name"
                            required
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            className="bg-background border-border"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label htmlFor="quiz-email" className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">Email</label>
                          <Input
                            id="quiz-email"
                            required
                            type="email"
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            className="bg-background border-border"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="quiz-phone" className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">Phone</label>
                          <Input
                            id="quiz-phone"
                            required
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData({ ...data, phone: e.target.value })}
                            className="bg-background border-border"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <label htmlFor="quiz-message" className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                            Anything else? <span className="normal-case tracking-normal text-muted-foreground/60">(optional)</span>
                          </label>
                          <Textarea
                            id="quiz-message"
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
                                <span>Location</span>
                                <span className="text-foreground">{data.location}</span>
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
