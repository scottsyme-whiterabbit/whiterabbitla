import { useParams, Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import { getBlogArticleBySlug } from "@/data/blogArticles";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useArticleSchema } from "@/hooks/useSchemaOrg";
import ShareButton from "@/components/ShareButton";
import QuizNudge from "@/components/QuizNudge";
import QuizCTA from "@/components/QuizCTA";
import RelatedReads from "@/components/RelatedReads";
import NewsletterSignup from "@/components/NewsletterSignup";

import closeupImg from "@/assets/event-closeup-cocktail.jpg";
import parlorImg from "@/assets/event-parlor-show.jpg";
import corporateImg from "@/assets/event-penthouse-show.jpg";
import scottCardsImg from "@/assets/event-scott-cards.jpg";
import experienceImg from "@/assets/experience-closeup.jpg";
import threeStars from "@/assets/three-stars-gold.png";
import guestReactionImg from "@/assets/event-guest-reaction.jpg";
import crowdReactionImg from "@/assets/event-crowd-reaction.jpg";
import intimateImg from "@/assets/event-closeup-intimate.jpg";
import mentalistImg from "@/assets/event-mentalism-closeup.jpg";
import parlorAudienceImg from "@/assets/event-parlor-audience.jpg";
import groupFinaleImg from "@/assets/event-group-finale.jpg";
import scottPerformingImg from "@/assets/event-scott-performing.jpg";
import restaurantImg from "@/assets/event-restaurant-magic.jpg";

const categoryImages: Record<string, string> = {
  "For Planners": corporateImg,
  "Magic Destinations": parlorImg,
  "Private Events": closeupImg,
  "Corporate Events": corporateImg,
  "Behind the Craft": scottCardsImg,
  "Luxury Nightlife": closeupImg,
  "Resident Events": corporateImg,
};

// Two inline images per category for mid-article injection
const inlineImages: Record<string, { src: string; alt: string }[]> = {
  "For Planners": [
    { src: guestReactionImg, alt: "Event guests reacting to close-up magic during a cocktail reception" },
    { src: parlorAudienceImg, alt: "Seated audience watching a private parlor magic show" },
  ],
  "Magic Destinations": [
    { src: scottPerformingImg, alt: "Scott Syme performing close-up magic at a luxury venue" },
    { src: crowdReactionImg, alt: "Audience members reacting with amazement during a magic performance" },
  ],
  "Private Events": [
    { src: intimateImg, alt: "Close-up magic performed for a small group at an intimate private event" },
    { src: groupFinaleImg, alt: "Guests applauding after a private magic show finale" },
  ],
  "Corporate Events": [
    { src: crowdReactionImg, alt: "Corporate event attendees reacting to a magic performance" },
    { src: mentalistImg, alt: "Mentalism performance at a corporate dinner event" },
  ],
  "Corporate": [
    { src: crowdReactionImg, alt: "Corporate event attendees reacting to a magic performance" },
    { src: mentalistImg, alt: "Mentalism performance at a corporate dinner event" },
  ],
  "Behind the Craft": [
    { src: scottPerformingImg, alt: "Scott Syme performing sleight of hand magic" },
    { src: restaurantImg, alt: "Close-up magic performance at an upscale restaurant" },
  ],
  "Luxury Nightlife": [
    { src: restaurantImg, alt: "Magic performance at an upscale cocktail lounge" },
    { src: intimateImg, alt: "Close-up magic at an exclusive nightlife event" },
  ],
  "Resident Events": [
    { src: parlorAudienceImg, alt: "Residents enjoying a private magic show in a luxury apartment community" },
    { src: guestReactionImg, alt: "Community members reacting to close-up magic at a resident social" },
  ],
  "For Production Companies": [
    { src: scottPerformingImg, alt: "Scott Syme performing at a studio event" },
    { src: crowdReactionImg, alt: "Production crew reacting to a magic performance" },
  ],
  "For DMCs": [
    { src: groupFinaleImg, alt: "Group of incentive trip attendees enjoying a magic show" },
    { src: intimateImg, alt: "Close-up magic at a destination event reception" },
  ],
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getBlogArticleBySlug(slug) : undefined;
  const { openQuiz } = useBookingQuiz();

  usePageMeta({
    title: article?.metaTitle || "White Rabbit LA | Blog",
    description: article?.metaDescription || "",
    path: slug ? `/blog/${slug}` : "/blog",
    type: "article",
    image: article ? (categoryImages[article.category] || experienceImg) : undefined,
  });

  const BASE_URL = "https://whiterabbitla.com";
  const schemaCategoryImages: Record<string, string> = {
    "For Planners": `${BASE_URL}/og/corporate.jpg`,
    "Magic Destinations": `${BASE_URL}/og/magic-destinations.jpg`,
    "Private Events": `${BASE_URL}/og/private.jpg`,
    "Corporate Events": `${BASE_URL}/og/corporate.jpg`,
    "Behind the Craft": `${BASE_URL}/og/behind-the-craft.jpg`,
    "Resident Events": `${BASE_URL}/og/corporate.jpg`,
  };
  const schemaImage = article ? (schemaCategoryImages[article.category] || `${BASE_URL}/og/experience.jpg`) : undefined;
  useArticleSchema(article ? { ...article, image: schemaImage } : { title: "", metaDescription: "", slug: "", publishDate: "", category: "", content: [], image: undefined });

  if (!article) return null;

  const publishDate = new Date(article.publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pick a pull quote: use a sentence from the middle content that's impactful
  const midIndex = Math.floor(article.content.length / 2);
  const pullQuoteSource = (article.content[midIndex] || "").replace(/<[^>]+>/g, "");
  // Extract first two sentences as pull quote
  const pullQuoteSentences = pullQuoteSource.split(". ").slice(0, 2).join(". ") + ".";
  // If too long, cut at last full word before 200 chars
  const pullQuoteSentence = pullQuoteSentences.length > 200
    ? pullQuoteSentences.slice(0, 200).replace(/\s+\S*$/, "")
    : pullQuoteSentences;
  const showPullQuote = article.content.length > 4;

  // Check if text contains HTML markup
  const hasHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

  // Render paragraph with drop cap for first, and HTML support
  const renderParagraph = (text: string, index: number) => {
    const isFirst = index === 0;
    const containsHtml = hasHtml(text);

    if (isFirst) {
      // Drop cap + lede styling
      // Strip any leading HTML tag to get the actual first character
      const strippedText = text.replace(/^<[^>]+>/, "");
      const firstChar = strippedText.charAt(0);
      const restHtml = containsHtml
        ? text.replace(new RegExp(`^(<[^>]+>)?${firstChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), "$1")
        : text.slice(1);

      return (
        <p className="font-sans text-lg md:text-xl text-foreground/90 leading-relaxed mb-8">
          <span
            className="font-serif text-6xl md:text-7xl float-left mr-3 mt-1 leading-[0.8] text-accent"
            style={{ fontStyle: "normal" }}
          >
            {firstChar}
          </span>
          {containsHtml ? (
            <span dangerouslySetInnerHTML={{ __html: restHtml }} />
          ) : (
            restHtml
          )}
        </p>
      );
    }

    if (containsHtml) {
      return (
        <p
          className="font-sans text-base text-muted-foreground leading-[1.85] mb-7 [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-accent/80 [&_a]:transition-colors"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }

    return (
      <p className="font-sans text-base text-muted-foreground leading-[1.85] mb-7">
        {text}
      </p>
    );
  };

  return (
    <main id="main-content" className="pt-20">
      {/* Hero */}
      <section className="bg-forest-dark py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-6">
              {article.category}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-8 leading-[1.15]">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-cream/50 font-sans text-xs tracking-[0.2em] uppercase">
              <span>By Scott Syme</span>
              <span className="w-1 h-1 rounded-full bg-cream/30" />
              <span>{publishDate}</span>
              <span className="w-1 h-1 rounded-full bg-cream/30" />
              <span>{article.readTime}</span>
            </div>
            <div className="mt-6">
              <ShareButton shareSlug={slug || ""} />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Quiz Nudge — above the fold */}
      <QuizNudge />

      {/* Lede / Excerpt */}
      <section className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <AnimatedSection>
            <p className="font-serif text-xl md:text-2xl text-foreground/80 leading-relaxed text-center" style={{ fontStyle: "normal" }}>
              {article.excerpt}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-6">
          {(() => {
            const inlineSignupIndex = Math.floor(article.content.length * 0.6);
            return article.content.map((paragraph, i) => {
              const elements = [];

              // Insert pull quote before the middle paragraph
              if (showPullQuote && i === midIndex) {
                elements.push(
                  <AnimatedSection key={`pullquote-${i}`}>
                    <blockquote className="border-l-2 border-accent pl-8 my-12 md:my-16">
                      <p className="font-serif text-2xl md:text-3xl text-foreground/80 leading-snug" style={{ fontStyle: "normal" }}>
                        {pullQuoteSentence}
                      </p>
                    </blockquote>
                  </AnimatedSection>
                );
              }

              // Insert inline newsletter signup at ~60% through the article
              if (i === inlineSignupIndex && article.content.length > 5) {
                elements.push(
                  <AnimatedSection key="inline-signup">
                    <NewsletterSignup variant="inline" />
                  </AnimatedSection>
                );
              }

              // Insert decorative break every ~4 paragraphs (not first)
              if (i > 0 && i !== midIndex && i % 4 === 0) {
                elements.push(
                  <div key={`divider-${i}`} className="flex justify-center my-6 md:my-8">
                    <img src={threeStars} alt="" aria-hidden="true" className="h-12 w-auto opacity-60" />
                  </div>
                );
              }

              elements.push(
                <AnimatedSection key={i} delay={Math.min(i * 0.03, 0.15)}>
                  {renderParagraph(paragraph, i)}
                </AnimatedSection>
              );

              return elements;
            });
          })()}
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="bg-forest-dark py-20 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">
              Ready to Elevate Your Next Event?
            </h2>
            <p className="font-sans text-sm text-cream/70 mb-8">
              Tell us about your event and we'll confirm availability within 24 hours.
            </p>
            <button
              onClick={openQuiz}
              className="inline-block font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/80 transition-colors"
            >
              Book Now
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* Quiz CTA */}
      <QuizCTA title="Not Sure What You Need? Take the Quiz" />

      {/* Related Reads */}
      <RelatedReads currentSlug={slug || ""} category={article.category} />

      {/* Back link */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Link
            to="/blog"
            className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to All Guides
          </Link>
        </div>
      </section>

      {/* Copyright Notice */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <p className="font-sans text-[10px] text-muted-foreground/50 leading-relaxed text-center">
            © {new Date().getFullYear()} White Rabbit Los Angeles. All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher. All trademarks, service marks, and trade names referenced herein are the property of their respective owners.
          </p>
        </div>
      </section>
    </main>
  );
};

export default BlogArticle;
