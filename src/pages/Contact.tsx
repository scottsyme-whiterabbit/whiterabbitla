import { useState } from "react";
import { Instagram, Mail, Phone } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import contactBg from "@/assets/event-silhouette.jpg";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-inquiry", {
        body: formData,
      });
      if (error) throw error;
      toast({
        title: "Inquiry Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", phone: "", eventType: "", date: "", location: "", message: "" });
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
    <main className="pt-20">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={contactBg} alt="Book Scott Syme White Rabbit magician for luxury events in Los Angeles" className="w-full h-full object-cover" />
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

      {/* Form + Contact Info */}
      <section className="py-24">
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-10 py-6 hover:bg-primary/90"
              >
                {isSubmitting ? "Sending..." : "Send Inquiry"}
              </Button>
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
              </div>
              <div className="pt-8 border-t border-border">
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Based in</p>
                <p className="font-serif text-xl text-foreground">Los Angeles, California</p>
                <p className="font-sans text-sm text-muted-foreground mt-1">Available worldwide for travel</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
};

export default Contact;
