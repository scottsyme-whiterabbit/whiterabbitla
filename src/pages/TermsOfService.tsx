import AnimatedSection from "@/components/AnimatedSection";
import SEOHead from "@/components/SEOHead";

const TermsOfService = () => {

  return (
    <main id="main-content" className="pt-20">
      <SEOHead title="Terms of Service | White Rabbit Los Angeles" description="Terms of Service for White Rabbit Los Angeles. Please review our terms before using our website or booking services." canonical="/terms" />
      <section className="bg-forest-dark py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Terms of Service</h1>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/50">Last updated: February 2026</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-6 space-y-10">
          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Acceptance of Terms</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              By accessing and using the White Rabbit Entertainment Productions LLC ("White Rabbit," "White Rabbit Los Angeles," "we," "us," or "our") website, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Use of Website</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              This website is provided for informational purposes and to facilitate inquiries about our entertainment services. You agree to use this website only for lawful purposes and in a manner that does not infringe on the rights of others or restrict their use of the website.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Intellectual Property</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              All content on this website, including text, images, graphics, logos, videos, and other materials, is the property of White Rabbit Los Angeles or its content creators and is protected by copyright and intellectual property laws. No part of this website may be reproduced, distributed, or transmitted in any form without prior written permission.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Booking and Services</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Inquiries submitted through our website do not constitute a binding contract. All bookings are subject to availability and confirmation. Specific terms regarding pricing, cancellation, and event logistics will be provided in a separate agreement upon booking confirmation.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Limitation of Liability</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              White Rabbit Los Angeles makes no warranties, expressed or implied, regarding the accuracy or completeness of the information on this website. We shall not be liable for any damages arising from your use of this website or reliance on any information provided herein.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Third-Party Links</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites. These links are provided for convenience only and do not imply endorsement. We are not responsible for the content or privacy practices of any linked websites.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Changes to Terms</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to this website. Your continued use of the website following any changes constitutes acceptance of the revised terms.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="font-serif text-2xl text-foreground mb-4">Contact</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:events@whiterabbitla.com" className="text-accent hover:text-accent/80 transition-colors">events@whiterabbitla.com</a>.
            </p>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
};

export default TermsOfService;
