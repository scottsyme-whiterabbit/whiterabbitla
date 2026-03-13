import { useState, useEffect } from "react";
import { Star, SmilePlus, MessageCircle, Send, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_REVIEW_URL = "https://g.page/r/CXLCQWnGrGWrEAE/review";

const ReviewGate = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"sentiment" | "positive" | "feedback">("sentiment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ name: "", email: "", message: "" });

  // Extract deal ID from URL param for review tracking
  const dealId = new URLSearchParams(window.location.search).get("cid");

  const flagReviewCompleted = async () => {
    if (!dealId) return;
    try {
      await supabase.functions.invoke("send-inquiry", {
        body: { _reviewFlag: true, dealId },
      });
    } catch {
      // silent — don't block the review flow
    }
  };

  const handlePositive = () => {
    setStep("positive");
    flagReviewCompleted();
    setTimeout(() => {
      window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
    }, 1500);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-inquiry", {
        body: {
          name: feedbackData.name,
          email: feedbackData.email,
          phone: "",
          eventType: "Private Feedback",
          date: "",
          location: "",
          message: `[PRIVATE FEEDBACK]\n\n${feedbackData.message}`,
        },
      });
      if (error) throw error;
      toast({ title: "Thank you!", description: "Your feedback has been received. We'll be in touch." });
      setFeedbackData({ name: "", email: "", message: "" });
      setStep("sentiment");
    } catch {
      toast({ title: "Something went wrong", description: "Please email us at events@whiterabbitla.com", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="pt-20 min-h-screen bg-background">
      <section className="py-24 lg:py-32">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {/* Sentiment Step */}
          {step === "sentiment" && (
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
                Your Experience
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
                How Was the Magic?
              </h1>
              <p className="font-sans text-base text-muted-foreground max-w-md mx-auto mb-12">
                We'd love to hear about your time with Scott Syme and the White Rabbit experience. Your feedback helps us create even more unforgettable moments.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                <button
                  onClick={handlePositive}
                  className="group flex flex-col items-center gap-4 p-8 border border-border bg-card hover:border-accent transition-all duration-300"
                >
                  <SmilePlus size={40} className="text-accent group-hover:scale-110 transition-transform" />
                  <span className="font-serif text-xl text-card-foreground">Loved It</span>
                  <span className="font-sans text-xs text-muted-foreground">Share your experience</span>
                </button>

                <button
                  onClick={() => setStep("feedback")}
                  className="group flex flex-col items-center gap-4 p-8 border border-border bg-card hover:border-muted-foreground transition-all duration-300"
                >
                  <MessageCircle size={40} className="text-muted-foreground group-hover:scale-110 transition-transform" />
                  <span className="font-serif text-xl text-card-foreground">Could Be Better</span>
                  <span className="font-sans text-xs text-muted-foreground">Write a quick note</span>
                </button>
              </div>
            </AnimatedSection>
          )}

          {/* Positive Redirect */}
          {step === "positive" && (
            <AnimatedSection>
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={28} className="fill-accent text-accent mx-1" />
                ))}
              </div>
              <h2 className="font-serif text-4xl text-foreground mb-4">Thank You!</h2>
              <p className="font-sans text-base text-muted-foreground mb-8">
                We're so glad you loved the experience. Taking you to Google now…
              </p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
              >
                Leave Your Review <ArrowRight size={16} />
              </a>
            </AnimatedSection>
          )}

          {/* Private Feedback Form */}
          {step === "feedback" && (
            <AnimatedSection>
              <h2 className="font-serif text-4xl text-foreground mb-4">We Want to Make It Right</h2>
              <p className="font-sans text-base text-muted-foreground max-w-md mx-auto mb-10">
                Your feedback stays between us. Scott reads every message personally and will follow up directly.
              </p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-6 text-left max-w-md mx-auto">
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Your Name
                  </label>
                  <Input
                    required
                    value={feedbackData.name}
                    onChange={(e) => setFeedbackData({ ...feedbackData, name: e.target.value })}
                    className="bg-background border-border"
                    placeholder="Full name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Email
                  </label>
                  <Input
                    required
                    type="email"
                    value={feedbackData.email}
                    onChange={(e) => setFeedbackData({ ...feedbackData, email: e.target.value })}
                    className="bg-background border-border"
                    placeholder="your@email.com"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    What Could We Improve?
                  </label>
                  <Textarea
                    required
                    value={feedbackData.message}
                    onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                    className="bg-background border-border min-h-[150px]"
                    placeholder="Tell us what happened and how we can do better…"
                    maxLength={1000}
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("sentiment")}
                    className="font-sans text-sm tracking-[0.2em] uppercase"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-8 py-6 hover:bg-primary/90 flex-1"
                  >
                    <Send size={16} className="mr-2" />
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </Button>
                </div>
              </form>
            </AnimatedSection>
          )}
        </div>
      </section>
    </main>
  );
};

export default ReviewGate;
