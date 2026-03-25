import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Gift } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Refer = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  usePageMeta({
    title: "Refer a Friend | White Rabbit Los Angeles",
    description: "Know someone planning an event in Los Angeles? Refer them to White Rabbit and earn a complimentary 30-minute close-up magic experience for your next LA event.",
    path: "/refer",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      referrer_name: (data.get("referrer_name") as string)?.trim(),
      referrer_email: (data.get("referrer_email") as string)?.trim(),
      referrer_company: (data.get("referrer_company") as string)?.trim() || null,
      referred_name: (data.get("referred_name") as string)?.trim(),
      referred_email: (data.get("referred_email") as string)?.trim() || null,
      referred_event_details: (data.get("referred_event_details") as string)?.trim() || null,
    };

    if (!payload.referrer_name || !payload.referrer_email || !payload.referred_name) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("referrals").insert(payload);

    if (error) {
      toast({ title: "Something went wrong", description: "Please try again or email us directly.", variant: "destructive" });
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 border border-accent/30 px-4 py-2 mb-8">
              <Gift className="w-4 h-4 text-accent" />
              <span className="font-sans text-xs tracking-[0.3em] uppercase text-accent">
                Referral Program
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-cream mb-6">
              Share the Magic
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto leading-relaxed">
              Know someone planning an event in Los Angeles? Refer them to White Rabbit.
              When they book, you'll receive a complimentary 30-minute close-up magic experience
              at your next LA event — on us.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">
              How It Works
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
            {[
              { step: "01", title: "Submit a Referral", desc: "Fill out the form below with your info and who you're referring." },
              { step: "02", title: "They Book & Pay", desc: "Once your referral books an event with White Rabbit and payment is received, your reward activates." },
              { step: "03", title: "You Get Rewarded", desc: "A complimentary 30-minute close-up magic add-on at your next Los Angeles event. Valid for 12 months." },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.15}>
                <div className="text-center">
                  <p className="font-serif text-4xl text-accent/30 mb-4">{item.step}</p>
                  <h3 className="font-serif text-xl text-foreground mb-3">{item.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-card py-24">
        <div className="max-w-2xl mx-auto px-6">
          {submitted ? (
            <AnimatedSection>
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-accent mb-6">
                  <Check className="w-8 h-8 text-accent" />
                </div>
                <h2 className="font-serif text-3xl text-foreground mb-4">Referral Submitted</h2>
                <p className="font-sans text-base text-muted-foreground max-w-md mx-auto">
                  Thank you! We'll reach out to your referral and keep you updated. Once they book,
                  your complimentary 30-minute experience will be ready to schedule.
                </p>
              </div>
            </AnimatedSection>
          ) : (
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">
                Submit a Referral
              </p>
              <h2 className="font-serif text-4xl text-foreground mb-4 text-center">
                Tell Us Who to Reach Out To
              </h2>
              <p className="font-sans text-sm text-muted-foreground text-center mb-12 max-w-lg mx-auto">
                All referrals are verified before rewards are issued. The reward is redeemable for
                Los Angeles events only.
              </p>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Your Info */}
                <div>
                  <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Your Information</p>
                  <div className="space-y-4">
                    <input
                      name="referrer_name"
                      type="text"
                      required
                      placeholder="Your Name *"
                      maxLength={100}
                      className="w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
                    />
                    <input
                      name="referrer_email"
                      type="email"
                      required
                      placeholder="Your Email *"
                      maxLength={255}
                      className="w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
                    />
                    <input
                      name="referrer_company"
                      type="text"
                      placeholder="Your Company (optional)"
                      maxLength={100}
                      className="w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {/* Referral Info */}
                <div>
                  <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Who Are You Referring?</p>
                  <div className="space-y-4">
                    <input
                      name="referred_name"
                      type="text"
                      required
                      placeholder="Their Name *"
                      maxLength={100}
                      className="w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
                    />
                    <input
                      name="referred_email"
                      type="email"
                      placeholder="Their Email (optional)"
                      maxLength={255}
                      className="w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
                    />
                    <textarea
                      name="referred_event_details"
                      placeholder="Any details about their event? (optional)"
                      maxLength={500}
                      rows={3}
                      className="w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Referral"} <ArrowRight size={14} />
                </button>
              </form>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Fine Print */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          <AnimatedSection>
            <div className="border border-border p-8">
              <h3 className="font-serif text-lg text-foreground mb-4">Program Details</h3>
              <ul className="space-y-2 font-sans text-sm text-muted-foreground leading-relaxed">
                <li>• Reward activates once the referred client has booked and paid.</li>
                <li>• The complimentary 30-minute close-up magic experience is available for Los Angeles events only.</li>
                <li>• Reward must be redeemed within 12 months of verification.</li>
                <li>• One reward per referrer per calendar year.</li>
                <li>• White Rabbit reserves the right to verify all referrals before issuing rewards.</li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
};

export default Refer;
