import { useState } from "react";
import { Instagram, Linkedin, Mail, Phone } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import QuizCTA from "@/components/QuizCTA";
import contactBg from "@/assets/event-silhouette.jpg";
import threeStars from "@/assets/three-stars-gold.png";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { useWebPageSchema } from "@/hooks/useSchemaOrg";
import { trackFormSubmit } from "@/lib/analytics";
import GoogleReviewsBadge from "@/components/GoogleReviewsBadge";

const Contact = () => {
  usePageMeta({
    title: "Contact & Booking | White Rabbit Magic — Los Angeles",
    description: "Book Scott Syme for your next corporate event, wedding, or private celebration. Check availability and get a personalized quote within 24 hours.",
    path: "/contact",
    image: contactBg,
  });
  useWebPageSchema({ name: "Contact & Booking", description: "Book Scott Syme for your next corporate event, wedding, or private celebration.", path: "/contact", type: "ContactPage" });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    date: "",
    location: "",
    message: "",
    clientType: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Send email + save inquiry + create deal (all handled by edge function)

      // Send email
      const { error } = await supabase.functions.invoke("send-inquiry", {
        body: formData,
      });
      if (error) throw error;
      // Meta Pixel: track contact form lead
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Contact Form',
          content_category: formData.eventType || 'General Inquiry',
        });
      }
      // GA4: track contact form submission
      trackFormSubmit("Contact Form", formData.eventType || "General Inquiry");
      toast({
        title: "Inquiry Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", phone: "", eventType: "", date: "", location: "", message: "", clientType: "" });
    } catch (err) {
      console.error("Send error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or email us directly at events@whiterabbitla.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={contactBg} alt="Book Scott Syme White Rabbit magician for luxury events in Los Angeles" width={1200} height={800} className="w-full h-full object-cover" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-forest-dark/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Book Now</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-cream mb-6">
              Let's Create Magic
            </h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              Tell us about your event and Scott will design an atmosphere of wonder and hospitality 
              that makes your guests feel truly alive.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Branded divider */}
      <div className="flex justify-center py-8">
        <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={200} height={80} className="h-12 w-auto opacity-50" />
      </div>

      {/* Form + Contact Info */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Form */}
          <AnimatedSection className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Your Name
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Email
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background border-border"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                  Which Best Describes You?
                </label>
                <select
                  required
                  value={formData.clientType}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select one...</option>
                  <option value="corporate">Corporate / Brand</option>
                  <option value="event_planner">Event Planner</option>
                  <option value="wedding_planner">Wedding Planner</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-background border-border"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Event Type
                  </label>
                  <Input
                    required
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="bg-background border-border"
                    placeholder="Corporate, Private, Wedding..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Event Date
                  </label>
                  <Input
                    required
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-background border-border"
                    placeholder="MM/DD/YYYY or flexible"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                    Event Location
                  </label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-background border-border"
                    placeholder="City, venue, or address"
                  />
                </div>
              </div>
              <div>
                <label className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                  Tell Us About Your Event
                </label>
                <Textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-background border-border min-h-[150px]"
                  placeholder="Number of guests, venue, what you're envisioning..."
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-6 hover:bg-primary/90"
                >
                  {isSubmitting ? "Sending..." : "Send Inquiry"}
                </Button>
                <GoogleReviewsBadge variant="light" />
              </div>
            </form>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection delay={0.2} className="lg:col-span-2">
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl text-foreground mb-4">Get in Touch</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  For booking inquiries or questions, reach out to Scott directly. He responds within 24 hours.
                </p>
              </div>
              <div className="space-y-4">
                <a href="mailto:events@whiterabbitla.com" className="flex items-center gap-3 font-sans text-sm text-foreground hover:text-accent transition-colors">
                  <Mail size={18} className="text-accent" /> events@whiterabbitla.com
                </a>
                <a href="tel:+14243941850" className="flex items-center gap-3 font-sans text-sm text-foreground hover:text-accent transition-colors">
                  <Phone size={18} className="text-accent" /> (424) 394-1850
                </a>
                <a href="https://www.instagram.com/scottsyme_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-sans text-sm text-foreground hover:text-accent transition-colors">
                  <Instagram size={18} className="text-accent" /> @scottsyme_
                </a>
                <a href="https://www.instagram.com/whiterabbit_la/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-sans text-sm text-foreground hover:text-accent transition-colors">
                  <Instagram size={18} className="text-accent" /> @whiterabbit_la
                </a>
                <a href="https://www.linkedin.com/in/scottsymejr/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-sans text-sm text-foreground hover:text-accent transition-colors">
                  <Linkedin size={18} className="text-accent" /> Scott Syme Jr.
                </a>
              </div>
              <div className="pt-8 border-t border-accent/20">
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Based in</p>
                <p className="font-serif text-xl text-foreground">Los Angeles, California</p>
                <p className="font-sans text-sm text-muted-foreground mt-1">Available worldwide for travel</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Thin gold rule */}
      <div className="max-w-xs mx-auto border-t border-accent/20 my-4" />

      {/* Quiz CTA */}
      <QuizCTA />
    </main>
  );
};

export default Contact;
