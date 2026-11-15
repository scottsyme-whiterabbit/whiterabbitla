import { Link } from "react-router-dom";

/** One quiet line of body text pointing readers at the Los Angeles hire page. */
const LosAngelesHireLine = ({ className = "" }: { className?: string }) => (
  <p className={`font-sans text-base text-muted-foreground leading-[1.85] ${className}`}>
    White Rabbit LA is based in Los Angeles. If you are planning an evening here, this is how to{" "}
    <Link to="/areas/los-angeles" className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">
      hire a magician in Los Angeles
    </Link>
    .
  </p>
);

export default LosAngelesHireLine;
