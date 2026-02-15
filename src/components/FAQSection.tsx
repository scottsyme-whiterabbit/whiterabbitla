import { useEffect } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  subtitle?: string;
  schemaId?: string;
  className?: string;
}

const FAQSection = ({
  faqs,
  title = "Frequently Asked Questions",
  subtitle,
  schemaId = "faq-schema",
  className = "",
}: FAQSectionProps) => {
  // Inject FAQPage JSON-LD for voice search / featured snippets
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = schemaId;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });

    document.getElementById(schemaId)?.remove();
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [faqs, schemaId]);

  return (
    <section className={`py-24 ${className}`}>
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedSection>
          {subtitle && (
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4 text-center">
              {subtitle}
            </p>
          )}
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-12 text-center">
            {title}
          </h2>
        </AnimatedSection>
        <AnimatedSection delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border-b border-border/40"
              >
                <AccordionTrigger className="font-sans text-sm md:text-base text-foreground text-left py-6 hover:no-underline hover:text-accent transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FAQSection;
