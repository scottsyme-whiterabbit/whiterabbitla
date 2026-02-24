import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import threeStars from "@/assets/three-stars-gold.png";

const QuizNudge = () => (
  <AnimatedSection>
    <div className="bg-card border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between gap-5">
        <div className="flex items-center gap-3 min-w-0">
          <img src={threeStars} alt="" aria-hidden="true" className="h-9 w-auto opacity-70 shrink-0 -my-2" />
          <p className="font-sans text-sm sm:text-base text-muted-foreground">
            <span className="hidden sm:inline">Not sure what fits your event? </span>
            <span className="text-foreground font-medium">Take the 35-second quiz</span>
          </p>
        </div>
        <Link
          to="/quiz"
          className="shrink-0 font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-6 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Start Quiz
        </Link>
      </div>
    </div>
  </AnimatedSection>
);

export default QuizNudge;
