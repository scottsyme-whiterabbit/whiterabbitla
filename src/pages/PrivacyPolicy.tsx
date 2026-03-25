import AnimatedSection from "@/components/AnimatedSection";
import SEOHead from "@/components/SEOHead";

const PrivacyPolicy = () => {

  return (
    <main id="main-content" className="pt-20">
      <SEOHead title="Privacy Policy | White Rabbit Los Angeles" description="Privacy Policy for White Rabbit Los Angeles. Learn how we collect, use, and protect your personal information." canonical="/privacy" />
      <section className="bg-forest-dark py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Privacy Policy</h1>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/50">Last updated: February 2026</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-6 space-y-10">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Information We Collect</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">
              When you interact with White Rabbit Entertainment Productions LLC ("White Rabbit," "White Rabbit Los Angeles," "we," "us," or "our"), we may collect information you voluntarily provide, including your name, email address, phone number, event details, and any other information submitted through our contact forms, booking quiz, or newsletter signup.
            </p>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              We also automatically collect certain technical information when you visit our website, such as your IP address, browser type, device information, and browsing behavior through cookies and similar technologies.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">How We Use Your Information</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              We use the information we collect to respond to your inquiries, process booking requests, send newsletters and promotional communications (with your consent), improve our website and services, and comply with legal obligations. We will never sell your personal information to third parties.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Cookies</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Our website uses cookies and similar tracking technologies to enhance your browsing experience and analyze site traffic. You can manage your cookie preferences through our cookie consent banner. For more information about the cookies we use, please refer to the consent options presented when you first visit our site.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Third-Party Services</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              We may use third-party services for email delivery, analytics, and website hosting. These services have their own privacy policies governing the use of your information. We only share the minimum data necessary for these services to function.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Data Retention</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Your Rights</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal information. You may also unsubscribe from marketing communications at any time by clicking the unsubscribe link in any email or by contacting us directly. California residents may have additional rights under the CCPA.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Contact Us</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:events@whiterabbitla.com" className="text-accent hover:text-accent/80 transition-colors">events@whiterabbitla.com</a>.
            </p>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
