import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

interface QuizCTAProps {
  title?: string;
}

const QuizCTA = ({ title = "Discover Your Magic Guest Persona" }: QuizCTAProps) => (
  <AnimatedSection>
    <section className="py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="border border-secondary/30 rounded p-10 md:p-14 bg-secondary/10">
          <div className="flex justify-center mb-4">
            <Sparkles size={24} className="text-secondary" />
          </div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-secondary mb-4">30-Second Quiz</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {title}
          </h2>
          <p className="font-sans text-base text-muted-foreground mb-3 max-w-lg mx-auto">
            Take our quick quiz and discover your Magic Guest Persona — plus get a personalized, downloadable card to share.
          </p>
          <p className="font-sans text-sm text-accent italic mb-8">
            No commitment — just a fun reveal and a tailored recommendation.
          </p>
          <Link
            to="/quiz"
            className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-10 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Take the Quiz
          </Link>
        </div>
      </div>
    </section>
  </AnimatedSection>
);

export default QuizCTA;
