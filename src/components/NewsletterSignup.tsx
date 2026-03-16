import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NewsletterSignupProps {
  variant?: "footer" | "section" | "inline";
}

const NewsletterSignup = ({ variant = "section" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      // Upsert into newsletter_contacts with source "newsletter_signup"
      const { error } = await supabase.from("newsletter_contacts").upsert(
        {
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          source: "newsletter_signup",
          drip_campaign: "general",
          subscribed: true,
        },
        { onConflict: "email" }
      );

      if (error) throw error;

      setSubmitted(true);
      setEmail("");
      setName("");
      toast.success("You're on the list! ✨");
    } catch (err) {
      console.error("Newsletter signup error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={variant === "footer" ? "text-center" : "text-center py-4"}>
        <p className={`font-serif text-lg ${variant === "footer" ? "text-cream" : "text-foreground"}`}>
          You're in. ✨
        </p>
        <p className={`font-sans text-sm mt-1 ${variant === "footer" ? "text-cream/60" : "text-muted-foreground"}`}>
          Watch your inbox for something special.
        </p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center md:items-start gap-3 w-full max-w-sm">
        <h4 className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-1">Stay in the Loop</h4>
        <p className="font-sans text-sm text-cream/60 leading-relaxed">
          Behind-the-scenes moments, upcoming shows & insider updates.
        </p>
        <div className="flex w-full gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email"
            required
            className="flex-1 bg-cream/5 border border-cream/15 text-cream placeholder:text-cream/30 px-4 py-2.5 font-sans text-sm tracking-wider focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="font-sans text-xs tracking-[0.2em] uppercase bg-accent text-forest-dark px-5 py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {submitting ? "..." : "Join"}
          </button>
        </div>
        <p className="font-sans text-[10px] text-cream/30 tracking-wider">No spam. Unsubscribe anytime.</p>
      </form>
    );
  }

  // Section variant (for homepage)
  return (
    <div className="text-center max-w-lg mx-auto">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Stay in the Loop</p>
      <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
        The Inner Circle
      </h2>
      <p className="font-sans text-base text-muted-foreground mb-8">
        Get behind-the-scenes moments, event recaps, and first access to upcoming shows. No spam, just magic.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="First name"
          className="sm:w-1/3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground px-4 py-3 font-sans text-sm tracking-wider focus:outline-none focus:border-accent/50 transition-colors"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="flex-1 bg-secondary border border-border text-foreground placeholder:text-muted-foreground px-4 py-3 font-sans text-sm tracking-wider focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          type="submit"
          disabled={submitting}
          className="font-sans text-xs tracking-[0.2em] uppercase bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Joining..." : "Subscribe"}
        </button>
      </form>
      <p className="font-sans text-[10px] text-muted-foreground/60 mt-4 tracking-wider">No spam. Unsubscribe anytime.</p>
    </div>
  );
};

export default NewsletterSignup;
