import { useState, useRef, useCallback } from "react";
import { blogArticles } from "@/data/blogArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";
import { toPng } from "html-to-image";
import wrSymbol from "@/assets/wr-symbol.png";
import wrLogo from "@/assets/wr-primary-logo.png";
import wrSecondaryLogo from "@/assets/wr-secondary-logo.png";

// Brand photos library
import heroDesert from "@/assets/hero-desert.jpg";
import scottDesert from "@/assets/scott-desert-sitting.jpg";
import aboutHero from "@/assets/about-hero-desert.jpg";
import experienceHero from "@/assets/experience-hero-desert.jpg";
import scottCouch from "@/assets/scott-couch.jpg";
import eventParlorStage from "@/assets/event-parlor-stage.jpg";
import eventPenthouse from "@/assets/event-penthouse-show.jpg";
import eventScottBW from "@/assets/event-scott-bw-stage.jpg";
import eventScottCards from "@/assets/event-scott-cards.jpg";
import eventScottPerforming from "@/assets/event-scott-performing.jpg";
import eventCrowdReaction from "@/assets/event-crowd-reaction.jpg";
import eventGroupPhoto from "@/assets/event-group-photo.jpg";
import eventCloseupCocktail from "@/assets/event-closeup-cocktail.jpg";
import eventParlorAudience from "@/assets/event-parlor-audience.jpg";
import eventSilhouette from "@/assets/event-silhouette.jpg";
import eventCardsEmerald from "@/assets/event-cards-emerald.jpg";
import eventCuMagic from "@/assets/event-cu-magic-reaction.jpg";
import eventGuestReaction from "@/assets/event-guest-reaction.jpg";
import cardsMotion from "@/assets/cards-motion-curtain.jpg";
import cardsFan from "@/assets/cards-fan-closeup.jpg";
import scottSyme from "@/assets/scott-syme-photo.jpg";
import experienceCloseup from "@/assets/experience-closeup.jpg";
import experienceCorporate from "@/assets/experience-corporate.jpg";
import experiencePrivate from "@/assets/experience-private.jpg";
import experienceParlor from "@/assets/experience-parlor.jpg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const brandPhotos = [
  { src: heroDesert, label: "Desert Hero" },
  { src: scottDesert, label: "Scott Desert Sitting" },
  { src: aboutHero, label: "About Hero" },
  { src: experienceHero, label: "Experience Hero" },
  { src: scottCouch, label: "Scott Couch" },
  { src: scottSyme, label: "Scott Portrait" },
  { src: eventParlorStage, label: "Parlor Stage" },
  { src: eventPenthouse, label: "Penthouse Show" },
  { src: eventScottBW, label: "Scott B&W Stage" },
  { src: eventScottCards, label: "Scott Cards" },
  { src: eventScottPerforming, label: "Scott Performing" },
  { src: eventCrowdReaction, label: "Crowd Reaction" },
  { src: eventGroupPhoto, label: "Group Photo" },
  { src: eventCloseupCocktail, label: "Closeup Cocktail" },
  { src: eventParlorAudience, label: "Parlor Audience" },
  { src: eventSilhouette, label: "Silhouette" },
  { src: eventCardsEmerald, label: "Cards Emerald" },
  { src: eventCuMagic, label: "Magic Reaction" },
  { src: eventGuestReaction, label: "Guest Reaction" },
  { src: cardsMotion, label: "Cards Motion" },
  { src: cardsFan, label: "Cards Fan" },
  { src: experienceCloseup, label: "Experience Close-Up" },
  { src: experienceCorporate, label: "Experience Corporate" },
  { src: experiencePrivate, label: "Experience Private" },
  { src: experienceParlor, label: "Experience Parlor" },
];

type AdFormat = "post" | "story" | "fb-ad" | "google-display";
type LogoPosition = "top-left" | "center-top";
type LogoStyle = "wordmark" | "rabbit";
type LogoColor = "original" | "white";
type ContentSource = "custom" | "article";

const formatDimensions: Record<AdFormat, { w: number; h: number; label: string; aspect: string }> = {
  post: { w: 1080, h: 1080, label: "Instagram Post", aspect: "1/1" },
  story: { w: 1080, h: 1920, label: "Instagram Story", aspect: "9/16" },
  "fb-ad": { w: 1200, h: 628, label: "Facebook Ad", aspect: "1200/628" },
  "google-display": { w: 1200, h: 628, label: "Google Display", aspect: "1200/628" },
};

const SocialGenerator = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [contentSource, setContentSource] = useState<ContentSource>("custom");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<number>(0);
  const [headline, setHeadline] = useState("EVER WONDER HOW\nEVENTS BECOME\nLEGENDARY?");
  const [subheadline, setSubheadline] = useState("DISCOVER CINEMATIC WONDER.");
  const [ctaText, setCtaText] = useState("BOOK LEGENDARY MAGIC");
  const [showCta, setShowCta] = useState(true);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-left");
  const [logoStyle, setLogoStyle] = useState<LogoStyle>("wordmark");
  const [logoColor, setLogoColor] = useState<LogoColor>("original");
  const [selectedFormat, setSelectedFormat] = useState<AdFormat>("story");
  const [overlayOpacity, setOverlayOpacity] = useState(40);
  const [logoScale, setLogoScale] = useState(100);
  const [fontScale, setFontScale] = useState(100);

  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [compositing, setCompositing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedArticle = blogArticles.find((a) => a.slug === selectedSlug);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "get_stats", adminPassword: password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        toast({ title: "Welcome back" });
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection failed", variant: "destructive" });
    }
  };

  // When article selected, populate fields
  const handleArticleSelect = (slug: string) => {
    setSelectedSlug(slug);
    const article = blogArticles.find((a) => a.slug === slug);
    if (article) {
      setHeadline(article.title.toUpperCase());
      setSubheadline(article.excerpt.split(".")[0].toUpperCase() + ".");
      setCtaText("READ MORE");
    }
  };

  const generateComposite = useCallback(async () => {
    if (!canvasRef.current) return;
    setCompositing(true);
    setFinalImage(null);
    // Allow render
    await new Promise((r) => setTimeout(r, 600));
    try {
      const dim = formatDimensions[selectedFormat];
      const dataUrl = await toPng(canvasRef.current, {
        width: dim.w,
        height: dim.h,
        pixelRatio: 1,
        cacheBust: true,
      });
      setFinalImage(dataUrl);
      toast({ title: "Ad ready", description: "Your branded image is ready to download." });
    } catch (err) {
      console.error("Composite error:", err);
      toast({ title: "Compositing failed", variant: "destructive" });
    } finally {
      setCompositing(false);
    }
  }, [selectedFormat]);

  const download = (dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `wr-${selectedFormat}-${Date.now()}.png`;
    a.click();
  };

  const dim = formatDimensions[selectedFormat];
  const photo = brandPhotos[selectedPhoto];

  // Brand colors
  const forestDark = "#223D34";
  const cream = "#F8F5F0";
  const gold = "#C8963E";
  const rose = "#C9A3A8";

  if (!authenticated) {
    return (
      <main id="main-content" className="pt-20 min-h-screen flex items-center justify-center">
        <div className="max-w-sm w-full px-6">
          <AnimatedSection>
            <div className="text-center mb-8">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Admin Access</p>
              <h1 className="font-serif text-3xl text-foreground">Ad Generator</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
              />
              <button type="submit" className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3 hover:bg-accent/80 transition-colors">
                Enter
              </button>
            </form>
          </AnimatedSection>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="pt-20">
      {/* Header */}
      <section className="bg-forest-dark py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Brand Toolkit</p>
            <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Ad Generator</h1>
            <p className="font-sans text-sm text-cream/60 max-w-lg mx-auto">
              Create on-brand ads using your real photos, typography, and brand identity. No AI backgrounds.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* LEFT: Controls */}
            <div className="space-y-8">
              {/* Content Source Toggle */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Content Source</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setContentSource("custom")}
                    className={`font-sans text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-colors ${contentSource === "custom" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-accent"}`}
                  >
                    Custom Text
                  </button>
                  <button
                    onClick={() => setContentSource("article")}
                    className={`font-sans text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-colors ${contentSource === "article" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-accent"}`}
                  >
                    From Article
                  </button>
                </div>
              </div>

              {/* Article selector */}
              {contentSource === "article" && (
                <div>
                  <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Select Article</label>
                  <select
                    value={selectedSlug}
                    onChange={(e) => handleArticleSelect(e.target.value)}
                    className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
                  >
                    <option value="">Choose an article...</option>
                    {blogArticles.map((a) => (
                      <option key={a.slug} value={a.slug}>{a.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Headline */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Headline</label>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border text-foreground font-serif text-lg px-4 py-3 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Subheadline */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Subheadline</label>
                <input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
                />
              </div>

              {/* CTA */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <label className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground">CTA Button</label>
                  <button
                    onClick={() => setShowCta(!showCta)}
                    className={`font-sans text-[10px] tracking-[0.15em] uppercase px-3 py-1 border transition-colors ${showCta ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground"}`}
                  >
                    {showCta ? "On" : "Off"}
                  </button>
                </div>
                {showCta && (
                  <input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
                  />
                )}
              </div>

              {/* Logo Style */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Logo Style</label>
                <div className="flex gap-2">
                  {([["wordmark", "Wordmark"], ["rabbit", "Rabbit Symbol"]] as [LogoStyle, string][]).map(([style, label]) => (
                    <button
                      key={style}
                      onClick={() => setLogoStyle(style)}
                      className={`font-sans text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-colors ${logoStyle === style ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-accent"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Color */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Logo Color</label>
                <div className="flex gap-2">
                  {([["original", "Original"], ["white", "White"]] as [LogoColor, string][]).map(([color, label]) => (
                    <button
                      key={color}
                      onClick={() => setLogoColor(color)}
                      className={`font-sans text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-colors ${logoColor === color ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-accent"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Position */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Logo Placement</label>
                <div className="flex gap-2">
                  {(["top-left", "center-top"] as LogoPosition[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setLogoPosition(pos)}
                      className={`font-sans text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-colors ${logoPosition === pos ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-accent"}`}
                    >
                      {pos === "top-left" ? "Top Left" : "Center Top"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Ad Format</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(formatDimensions) as AdFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => { setSelectedFormat(fmt); setFinalImage(null); }}
                      className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2.5 border transition-colors ${selectedFormat === fmt ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-accent"}`}
                    >
                      {formatDimensions[fmt].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay opacity */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
                  Overlay Darkness: {overlayOpacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              {/* Logo Size */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
                  Logo Size: {logoScale}%
                </label>
                <input
                  type="range"
                  min={30}
                  max={250}
                  value={logoScale}
                  onChange={(e) => setLogoScale(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              {/* Font Size */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
                  Font Size: {fontScale}%
                </label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              {/* Photo Library */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Background Photo</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {brandPhotos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(i)}
                      className={`aspect-square overflow-hidden border-2 transition-all ${selectedPhoto === i ? "border-accent scale-[0.95]" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={p.src} alt={p.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate */}
              <button
                onClick={generateComposite}
                disabled={compositing}
                className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {compositing ? "Compositing..." : "Generate Ad"}
              </button>
            </div>

            {/* RIGHT: Preview + Download */}
            <div>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
                Live Preview — {dim.label} ({dim.w}×{dim.h})
              </p>

              {/* Scaled preview */}
              <div
                className="border border-border overflow-hidden bg-muted/20 mx-auto"
                style={{
                  aspectRatio: dim.aspect,
                  maxWidth: selectedFormat === "story" ? "320px" : "100%",
                  maxHeight: "600px",
                }}
              >
                <div
                  style={{
                    width: dim.w,
                    height: dim.h,
                    transform: `scale(${selectedFormat === "story" ? 320 / dim.w : Math.min(1, 600 / dim.h)})`,
                    transformOrigin: "top left",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "'Ogg', Georgia, serif",
                  }}
                >
                  {/* Background photo */}
                  <img src={photo.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
                  {/* Forest green overlay */}
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${forestDark}${Math.round(overlayOpacity * 2.55).toString(16).padStart(2, "0")} 0%, ${forestDark}${Math.round(Math.min(overlayOpacity + 20, 90) * 2.55).toString(16).padStart(2, "0")} 100%)` }} />
                  {/* Content layout */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: selectedFormat === "story" ? "140px 60px 100px" : selectedFormat === "post" ? "60px" : "40px 50px" }}>
                    {/* Logo */}
                    <div style={{ display: "flex", justifyContent: logoPosition === "center-top" ? "center" : "flex-start" }}>
                      <img
                        src={logoStyle === "rabbit" ? wrSymbol : wrSecondaryLogo}
                        alt="White Rabbit"
                        style={{
                          height: (logoStyle === "rabbit"
                            ? (selectedFormat === "story" ? 70 : selectedFormat === "post" ? 60 : 45)
                            : (selectedFormat === "story" ? 55 : selectedFormat === "post" ? 45 : 35)) * logoScale / 100,
                          objectFit: "contain",
                          ...(logoColor === "white" ? { filter: "brightness(0) invert(1)" } : {}),
                        }}
                      />
                    </div>
                    {/* Text block */}
                    <div style={{ textAlign: "left" }}>
                      <h2 style={{
                        fontFamily: "'Ogg', Georgia, serif",
                        fontSize: (selectedFormat === "story" ? 64 : selectedFormat === "post" ? 56 : 42) * fontScale / 100,
                        fontWeight: 400,
                        lineHeight: 1.1,
                        color: cream,
                        margin: 0,
                        whiteSpace: "pre-line",
                        textTransform: "uppercase" as const,
                      }}>
                        {headline}
                      </h2>
                      {subheadline && (
                        <p style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: (selectedFormat === "story" ? 18 : selectedFormat === "post" ? 16 : 14) * fontScale / 100,
                          fontWeight: 500,
                          letterSpacing: "0.15em",
                          color: cream,
                          marginTop: selectedFormat === "story" ? 24 : 16,
                          textTransform: "uppercase" as const,
                        }}>
                          {subheadline}
                        </p>
                      )}
                    </div>
                    {/* CTA */}
                    <div>
                      {showCta && (
                        <div style={{
                          backgroundColor: gold,
                          color: forestDark,
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: (selectedFormat === "story" ? 18 : selectedFormat === "post" ? 16 : 13) * fontScale / 100,
                          fontWeight: 600,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase" as const,
                          textAlign: "center",
                          padding: selectedFormat === "story" ? "22px 40px" : "16px 32px",
                          borderRadius: 2,
                        }}>
                          {ctaText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Final export + download */}
              {finalImage && (
                <div className="mt-6 space-y-3">
                  <div className="border border-accent/30 overflow-hidden" style={{ aspectRatio: dim.aspect, maxWidth: selectedFormat === "story" ? "320px" : "100%", maxHeight: "500px", margin: "0 auto" }}>
                    <img src={finalImage} alt="Final ad" className="w-full h-full object-contain" />
                  </div>
                  <button
                    onClick={() => download(finalImage)}
                    className="w-full font-sans text-sm tracking-[0.2em] uppercase border border-accent text-accent px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Download {dim.label} ↓
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hidden full-res compositing canvas */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          ref={canvasRef}
          style={{
            width: dim.w,
            height: dim.h,
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Ogg', Georgia, serif",
          }}
        >
          <img src={photo.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} crossOrigin="anonymous" />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${forestDark}${Math.round(overlayOpacity * 2.55).toString(16).padStart(2, "0")} 0%, ${forestDark}${Math.round(Math.min(overlayOpacity + 20, 90) * 2.55).toString(16).padStart(2, "0")} 100%)` }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: selectedFormat === "story" ? "80px 60px 100px" : selectedFormat === "post" ? "60px" : "40px 50px" }}>
            <div style={{ display: "flex", justifyContent: logoPosition === "center-top" ? "center" : "flex-start" }}>
              <img
                src={logoStyle === "rabbit" ? wrSymbol : wrSecondaryLogo}
                alt="White Rabbit"
                style={{
                  height: (logoStyle === "rabbit"
                    ? (selectedFormat === "story" ? 70 : selectedFormat === "post" ? 60 : 45)
                    : (selectedFormat === "story" ? 55 : selectedFormat === "post" ? 45 : 35)) * logoScale / 100,
                  objectFit: "contain",
                  ...(logoColor === "white" ? { filter: "brightness(0) invert(1)" } : {}),
                }}
                crossOrigin="anonymous"
              />
            </div>
            <div style={{ textAlign: "left" }}>
              <h2 style={{
                fontFamily: "'Ogg', Georgia, serif",
                fontSize: (selectedFormat === "story" ? 64 : selectedFormat === "post" ? 56 : 42) * fontScale / 100,
                fontWeight: 400,
                lineHeight: 1.1,
                color: cream,
                margin: 0,
                whiteSpace: "pre-line",
                textTransform: "uppercase" as const,
              }}>
                {headline}
              </h2>
              {subheadline && (
                <p style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: (selectedFormat === "story" ? 18 : selectedFormat === "post" ? 16 : 14) * fontScale / 100,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  color: cream,
                  marginTop: selectedFormat === "story" ? 24 : 16,
                  textTransform: "uppercase" as const,
                }}>
                  {subheadline}
                </p>
              )}
            </div>
            <div>
              {showCta && (
                <div style={{
                  backgroundColor: gold,
                  color: forestDark,
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: (selectedFormat === "story" ? 18 : selectedFormat === "post" ? 16 : 13) * fontScale / 100,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  textAlign: "center",
                  padding: selectedFormat === "story" ? "22px 40px" : "16px 32px",
                  borderRadius: 2,
                }}>
                  {ctaText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SocialGenerator;
