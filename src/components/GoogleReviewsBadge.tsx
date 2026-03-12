import { Star } from "lucide-react";

interface GoogleReviewsBadgeProps {
  variant?: "light" | "dark";
  className?: string;
}

const GoogleReviewsBadge = ({ variant = "dark", className = "" }: GoogleReviewsBadgeProps) => {
  const textColor = variant === "dark" ? "text-cream/70" : "text-muted-foreground";
  const ratingColor = variant === "dark" ? "text-cream/90" : "text-foreground";

  return (
    <a
      href="https://g.co/kgs/MbQh3xN"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 group ${className}`}
      aria-label="5.0 stars on Google Reviews"
    >
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} className="fill-accent text-accent" />
        ))}
      </div>
      <span className={`font-sans text-xs tracking-wider ${ratingColor} font-medium`}>5.0</span>
      <span className={`font-sans text-xs tracking-wider ${textColor} group-hover:text-accent transition-colors`}>
        on Google
      </span>
    </a>
  );
};

export default GoogleReviewsBadge;
