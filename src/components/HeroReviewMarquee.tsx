import { useState } from "react";
import { Star } from "lucide-react";
import { useReducedMotion } from "framer-motion";

export type HeroReview = { text: string; name: string; role?: string };

type Props = {
  reviews: HeroReview[];
  /** "desktop" keeps stars, quote and name on one line; "mobile" stacks them. */
  variant: "desktop" | "mobile";
};

/**
 * Seamless right-to-left review loop. The list is rendered twice and the
 * track slides by exactly half its width, so the repeat point is invisible.
 * Pauses on mouse hover and while a finger is held down; static for
 * visitors who ask for reduced motion.
 */
const HeroReviewMarquee = ({ reviews, variant }: Props) => {
  const reduceMotion = useReducedMotion();
  const [held, setHeld] = useState(false);
  const stacked = variant === "mobile";

  const renderItem = (review: HeroReview, key: string, hidden: boolean) => (
    <div
      key={key}
      aria-hidden={hidden || undefined}
      className={`shrink-0 flex items-center justify-center ${
        stacked ? "flex-col gap-3 px-8" : "flex-row gap-6 px-10"
      }`}
    >
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="fill-accent text-accent" />
        ))}
      </div>
      <p className={`font-serif ${stacked ? "text-sm" : "text-sm md:text-base"} text-cream/90 text-center whitespace-nowrap`}>
        "{review.text}"
      </p>
      <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/60 whitespace-nowrap">
        {review.name}
        {review.role ? `, ${review.role}` : ""}
      </p>
    </div>
  );

  const edgeFade =
    "linear-gradient(to right, transparent 0, #000 12%, #000 88%, transparent 100%)";

  if (reduceMotion) {
    return (
      <div
        className="overflow-x-auto"
        style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade }}
        aria-label="Client reviews"
        role="region"
      >
        <div className="flex w-max px-[12%]">
          {reviews.map((r, i) => renderItem(r, `r-${i}`, false))}
        </div>
      </div>
    );
  }

  const release = () => setHeld(false);

  return (
    <div
      className="review-marquee overflow-hidden select-none [-webkit-touch-callout:none]"
      style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade, touchAction: "pan-y" }}
      aria-label="Client reviews"
      role="region"
      data-held={held || undefined}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") setHeld(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="review-marquee-track flex w-max">
        {reviews.map((r, i) => renderItem(r, `a-${i}`, false))}
        {reviews.map((r, i) => renderItem(r, `b-${i}`, true))}
      </div>
    </div>
  );
};

export default HeroReviewMarquee;
