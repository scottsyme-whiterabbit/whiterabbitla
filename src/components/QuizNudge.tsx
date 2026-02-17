import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";

const QuizNudge = () => (
  <AnimatedSection>
    <div className="bg-card border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles size={16} className="text-secondary shrink-0" />
          <p className="font-sans text-sm text-muted-foreground truncate">
            <span className="hidden sm:inline">Not sure what fits your event? </span>
            <span className="text-foreground font-medium">Take the 30-second quiz</span>
          </p>
        </div>
        <Link
          to="/quiz"
          className="shrink-0 font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent px-5 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Start Quiz
        </Link>
      </div>
    </div>
  </AnimatedSection>
);

export default QuizNudge;
