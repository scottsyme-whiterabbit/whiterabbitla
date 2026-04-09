import { useParams, Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import { getBlogArticleBySlug, blogArticles } from "@/data/blogArticles";
import { useBookingQuiz } from "@/contexts/BookingQuizContext";
import SEOHead from "@/components/SEOHead";
import { useArticleSchema, useFAQSchema } from "@/hooks/useSchemaOrg";
import ShareButton from "@/components/ShareButton";
import QuizNudge from "@/components/QuizNudge";
import QuizCTA from "@/components/QuizCTA";
import RelatedReads from "@/components/RelatedReads";
import WhereWePerform from "@/components/WhereWePerform";
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
import cardFloatQueenImg from "@/assets/event-card-float-queen.jpg";
import scottDesertWalkingImg from "@/assets/scott-desert-walking.jpg";
import scottBwWalkingImg from "@/assets/scott-bw-walking.jpg";
import cardsShuffleGreenImg from "@/assets/event-cards-shuffle-green.jpg";
import cardFloatBwImg from "@/assets/event-card-float-bw.jpg";
import heroWhiteRabbitEveningImg from "@/assets/hero-white-rabbit-evening.jpg";
import venueChicagoMagicLoungeImg from "@/assets/venue-chicago-magic-lounge.webp";
import venueMagicCastleHallwayImg from "@/assets/venue-magic-castle-hallway.webp";
import venueMagicCastleExteriorImg from "@/assets/venue-magic-castle-exterior.webp";
import venueHandAndEyeImg from "@/assets/venue-hand-and-eye.png";
import venueMagicHideawayImg from "@/assets/venue-magic-hideaway.jpg";
import venueAlexRamonImg from "@/assets/venue-alex-ramon.webp";

// Per-article inline images: slug → array of { afterIndex, src, alt, caption }
const articleInlineImages: Record<string, { afterIndex: number; src: string; alt: string; caption?: string }[]> = {
  "what-happens-when-you-hire-white-rabbit-la": [
    {
      afterIndex: 11,
      src: heroWhiteRabbitEveningImg,
      alt: "White Rabbit LA event setup with emerald drapes and cinematic lighting",
      caption: "White Rabbit · Event Setup",
    },
  ],
  "best-magic-venues-america": [
    { afterIndex: 1, src: venueMagicCastleExteriorImg, alt: "The Magic Castle exterior on Franklin Avenue in Hollywood, California", caption: "The Magic Castle® · Hollywood, CA" },
    { afterIndex: 2, src: venueMagicCastleHallwayImg, alt: "The Magic Castle hallway lined with portraits and memorabilia of legendary magicians", caption: "The Magic Castle® · Inside the Hall of Fame" },
    { afterIndex: 2, src: venueChicagoMagicLoungeImg, alt: "The Chicago Magic Lounge signature showroom with velvet seating and red curtain stage", caption: "Chicago Magic Lounge · Chicago, IL" },
    { afterIndex: 4, src: venueHandAndEyeImg, alt: "The Hand and The Eye venue rendering, a new immersive magic destination in Chicago", caption: "The Hand and The Eye · Chicago, IL (Coming Soon)" },
    { afterIndex: 6, src: venueMagicHideawayImg, alt: "Bill Abbott performing close-up magic at The Magic Hideaway inside Casa Monica resort", caption: "The Magic Hideaway · St. Augustine, FL" },
    { afterIndex: 11, src: venueAlexRamonImg, alt: "Alex Ramon, magician and performer based in Lake Tahoe", caption: "Alex Ramon · Lake Tahoe, CA" },
  ],
};

const categoryImages: Record<string, string> = {
  "For Planners": corporateImg,
  "Magic Destinations": parlorImg,
  "Private Events": closeupImg,
  "Corporate Events": corporateImg,
  "Behind the Craft": scottCardsImg,
  "Luxury Nightlife": closeupImg,
  "Resident Events": corporateImg,
  "Wedding Entertainment": closeupImg,
  "For Event Planners": corporateImg,
  "The Experience": parlorImg,
};

// Two inline images per category for mid-article injection
const inlineImages: Record<string, { src: string; alt: string }[]> = {
  "For Planners": [
    { src: cardsShuffleGreenImg, alt: "Close-up of Scott Syme shuffling cards before a private event performance" },
    { src: parlorAudienceImg, alt: "Seated audience watching a private parlor magic show" },
  ],
  "Magic Destinations": [
    { src: scottDesertWalkingImg, alt: "Scott Syme walking through the desert in a suit" },
    { src: crowdReactionImg, alt: "Audience members reacting with amazement during a magic performance" },
  ],
  "Private Events": [
    { src: cardFloatQueenImg, alt: "Queen of hearts floating above Scott Syme's hand during a private event" },
    { src: groupFinaleImg, alt: "Guests applauding after a private magic show finale" },
  ],
  "Corporate Events": [
    { src: crowdReactionImg, alt: "Corporate event attendees reacting to a magic performance" },
    { src: cardFloatBwImg, alt: "Playing card suspended in mid-air during a corporate event performance" },
  ],
  "Corporate": [
    { src: crowdReactionImg, alt: "Corporate event attendees reacting to a magic performance" },
    { src: cardsShuffleGreenImg, alt: "Close-up card handling at a corporate entertainment event" },
  ],
  "Behind the Craft": [
    { src: scottBwWalkingImg, alt: "Scott Syme in black and white, walking with confidence" },
    { src: cardFloatQueenImg, alt: "Queen of hearts floating above a magician's hand" },
  ],
  "Luxury Nightlife": [
    { src: cardFloatBwImg, alt: "Card floating in dramatic black and white lighting at an exclusive event" },
    { src: intimateImg, alt: "Close-up magic at an exclusive nightlife event" },
  ],
  "Resident Events": [
    { src: parlorAudienceImg, alt: "Residents enjoying a private magic show in a luxury apartment community" },
    { src: cardsShuffleGreenImg, alt: "Card flourish performed at a resident social event" },
  ],
  "For Production Companies": [
    { src: scottDesertWalkingImg, alt: "Scott Syme on location for a production shoot" },
    { src: crowdReactionImg, alt: "Production crew reacting to a magic performance" },
  ],
  "For DMCs": [
    { src: groupFinaleImg, alt: "Group of incentive trip attendees enjoying a magic show" },
    { src: cardFloatQueenImg, alt: "Close-up card magic at a destination event reception" },
  ],
  "Wedding Entertainment": [
    { src: intimateImg, alt: "Close-up magic during an elegant wedding cocktail hour" },
    { src: guestReactionImg, alt: "Wedding guests reacting with delight to close-up magic" },
  ],
  "For Event Planners": [
    { src: scottPerformingImg, alt: "Scott Syme performing close-up magic at a corporate event" },
    { src: parlorAudienceImg, alt: "Seated audience watching a private parlor magic show" },
  ],
  "The Experience": [
    { src: scottPerformingImg, alt: "Scott Syme performing close-up magic at a private event" },
    { src: parlorAudienceImg, alt: "Guests experiencing an intimate parlor magic show" },
  ],
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getBlogArticleBySlug(slug) : undefined;
  const { openQuiz } = useBookingQuiz();

  const seoTitle = article?.metaTitle || "White Rabbit LA | Blog";
  const seoDescription = article?.metaDescription || "";
  const seoPath = slug ? `/blog/${slug}` : "/blog";
  const seoImage = article ? (categoryImages[article.category] || experienceImg) : undefined;

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

  // Extract FAQ pairs from content: lines starting with <strong>question?</strong> answer
  const faqPairs = (article?.content || []).reduce<{ question: string; answer: string }[]>((acc, p) => {
    const match = p.match(/^<strong>(.+?\?)<\/strong>\s*(.+)/);
    if (match && match[1] !== "Frequently Asked Questions") {
      acc.push({ question: match[1], answer: match[2].replace(/<[^>]+>/g, "") });
    }
    return acc;
  }, []);
  useFAQSchema(faqPairs);

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
      <SEOHead title={seoTitle} description={seoDescription} canonical={seoPath} ogImage={seoImage} type="article" />
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
            const categoryInlineImages = inlineImages[article.category] || inlineImages["For Planners"];
            const imgIndex1 = Math.floor(article.content.length * 0.3);
            const imgIndex2 = Math.floor(article.content.length * 0.75);

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

              // Insert first inline image at ~30%
              if (i === imgIndex1 && article.content.length > 4 && categoryInlineImages[0]) {
                elements.push(
                  <AnimatedSection key="inline-img-1">
                    <figure className="my-10 md:my-14 -mx-4 md:-mx-8">
                      <img
                        src={categoryInlineImages[0].src}
                        alt={categoryInlineImages[0].alt}
                        width={800}
                        height={533}
                        loading="lazy"
                        className="w-full h-auto"
                      />
                      <figcaption className="font-sans text-[11px] text-muted-foreground/50 tracking-wider mt-3 text-center uppercase">
                        White Rabbit · Private Event Entertainment
                      </figcaption>
                    </figure>
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

              // Insert second inline image at ~75%
              if (i === imgIndex2 && article.content.length > 5 && categoryInlineImages[1] && imgIndex2 !== inlineSignupIndex) {
                elements.push(
                  <AnimatedSection key="inline-img-2">
                    <figure className="my-10 md:my-14 -mx-4 md:-mx-8">
                      <img
                        src={categoryInlineImages[1].src}
                        alt={categoryInlineImages[1].alt}
                        width={800}
                        height={533}
                        loading="lazy"
                        className="w-full h-auto"
                      />
                      <figcaption className="font-sans text-[11px] text-muted-foreground/50 tracking-wider mt-3 text-center uppercase">
                        White Rabbit · Los Angeles
                      </figcaption>
                    </figure>
                  </AnimatedSection>
                );
              }

              // Insert decorative break every ~4 paragraphs (not first)
              if (i > 0 && i !== midIndex && i % 4 === 0) {
                elements.push(
                  <div key={`divider-${i}`} className="flex justify-center my-6 md:my-8">
                    <img src={threeStars} alt="" role="presentation" aria-hidden="true" width={120} height={48} className="h-12 w-auto opacity-60" />
                  </div>
                );
              }

              elements.push(
                <AnimatedSection key={i} delay={Math.min(i * 0.03, 0.15)}>
                  {renderParagraph(paragraph, i)}
                </AnimatedSection>
              );

              // Per-article inline image injection (supports multiple images)
              {const artImages = slug ? articleInlineImages[slug] : undefined;
              if (artImages) {
                artImages.filter(img => img.afterIndex === i).forEach((artImg, idx) => {
                  elements.push(
                    <AnimatedSection key={`article-inline-img-${i}-${idx}`}>
                      <figure className="my-10 md:my-14 -mx-4 md:-mx-8">
                        <img
                          src={artImg.src}
                          alt={artImg.alt}
                          width={800}
                          height={533}
                          loading="lazy"
                          className="w-full h-auto"
                        />
                        <figcaption className="font-sans text-[11px] text-muted-foreground/50 tracking-wider mt-3 text-center uppercase">
                          {artImg.caption || "White Rabbit · Event Setup"}
                        </figcaption>
                      </figure>
                    </AnimatedSection>
                  );
                });
              }}

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

      {/* Where We Perform */}
      <WhereWePerform articleIndex={blogArticles.findIndex((a) => a.slug === slug)} />

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
