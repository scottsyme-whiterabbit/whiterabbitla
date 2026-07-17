interface Props {
  /** "light" on cream backgrounds (default), "dark" on forest-dark sections. */
  variant?: "light" | "dark";
}

/**
 * The White Rabbit Promise — a quiet line of confidence placed near the
 * booking CTA on service pages and the contact page. Understated: serif
 * heading, single seal-style mark, generous spacing, no starburst badge.
 */
const WhiteRabbitPromise = ({ variant = "light" }: Props) => {
  const isDark = variant === "dark";
  const border = isDark ? "border-accent/40" : "border-primary/25";
  const seal = isDark ? "text-accent" : "text-primary";
  const heading = isDark ? "text-cream" : "text-foreground";
  const body = isDark ? "text-cream/75" : "text-muted-foreground";

  return (
    <section aria-labelledby="wr-promise-heading" className="py-14">
      <div className={`max-w-2xl mx-auto px-6 text-center border-t border-b ${border} py-10`}>
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          className={`w-6 h-6 mx-auto mb-5 ${seal}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        >
          <circle cx="20" cy="20" r="17" />
          <circle cx="20" cy="20" r="12" />
          <path d="M14 20l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2
          id="wr-promise-heading"
          className={`font-serif text-2xl md:text-3xl mb-4 ${heading}`}
        >
          The White Rabbit Promise
        </h2>
        <p className={`font-serif text-base md:text-lg leading-relaxed ${body}`}>
          Every booking is protected by a simple promise: if the performance isn't everything we
          discussed, your deposit is returned — no questions, no friction. It has never been needed.
          But a well-hosted evening means the guest never carries the risk, and neither should you.
        </p>
      </div>
    </section>
  );
};

export default WhiteRabbitPromise;
