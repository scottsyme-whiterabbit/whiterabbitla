import { Link } from "react-router-dom";
import type { ArticleHostCallout as ArticleHostCalloutData } from "@/data/blogArticles";

/** Bordered callout shown after an article's first paragraph, for articles that set hostCallout. */
const ArticleHostCallout = ({ callout }: { callout: ArticleHostCalloutData }) => (
  <aside className="clear-both border border-border p-6 md:p-8 mb-8" data-testid="article-host-callout">
    <h2 className="font-serif text-xl md:text-2xl text-foreground mb-3">{callout.heading}</h2>
    <p className="font-sans text-base text-muted-foreground leading-[1.85]">
      {callout.body.map((segment, i) =>
        typeof segment === "string" ? (
          <span key={i}>{segment}</span>
        ) : (
          <Link
            key={i}
            to={segment.to}
            className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors"
          >
            {segment.text}
          </Link>
        ),
      )}
    </p>
  </aside>
);

export default ArticleHostCallout;
