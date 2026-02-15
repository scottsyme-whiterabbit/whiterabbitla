import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const QuizCTA = () => (
  <AnimatedSection>
    <section className="py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="border border-accent/20 rounded p-10 md:p-14 bg-forest-dark/30">
          <div className="flex justify-center mb-4">
            <Sparkles size={24} className="text-accent" />
          </div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">60-Second Quiz</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Discover Your Magic Guest Persona
          </h2>
          <p className="font-sans text-base text-muted-foreground mb-3 max-w-lg mx-auto">
            Are you The Curator? The Showstopper? The Skeptic-Turned-Believer? Take our quick quiz and find out — plus get a personalized, downloadable persona card to share.
          </p>
          <p className="font-sans text-sm text-accent/70 italic mb-8">
            No commitment — just a fun reveal and a tailored recommendation.
          </p>
          <Link
            to="/quiz"
            className="inline-block font-sans text-sm tracking-[0.2em] uppercase border border-accent text-foreground px-10 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Take the Quiz
          </Link>
        </div>
      </div>
    </section>
  </AnimatedSection>
);

export default QuizCTA;
