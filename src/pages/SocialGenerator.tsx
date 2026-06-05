import { useState, useRef, useCallback } from "react";
import { blogArticles } from "@/data/blogArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";
import { toPng } from "html-to-image";
import wrSymbol from "@/assets/wr-symbol.png";
import { DrivePhotoBank } from "@/components/DrivePhotoBank";
import wrLogo from "@/assets/wr-primary-logo.png";
import wrSecondaryLogo from "@/assets/wr-secondary-logo.png";
import CarouselGenerator from "@/components/CarouselGenerator";

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
import ladiesGreeting from "@/assets/events/ladies-luncheon-greeting.jpg";
import ladiesCardRibbon from "@/assets/events/ladies-luncheon-card-ribbon.jpg";
import ladiesCurtainHosts from "@/assets/events/ladies-luncheon-curtain-hosts.jpg";
import ladiesRoomWide from "@/assets/events/ladies-luncheon-room-wide.jpg";
import ladiesReaction from "@/assets/events/ladies-luncheon-reaction.jpg";
import ladiesLaughter from "@/assets/events/ladies-luncheon-laughter.jpg";
import ladiesDeckRibbon from "@/assets/events/ladies-luncheon-deck-ribbon.jpg";
import ladiesRibbonCurtain from "@/assets/events/ladies-luncheon-ribbon-curtain.jpg";
import ladiesRibbonReveal from "@/assets/events/ladies-luncheon-ribbon-reveal.jpg";
import ladiesScottPointing from "@/assets/events/ladies-luncheon-scott-pointing.jpg";
import ladies1566 from "@/assets/events/ladies-luncheon-1566.jpg";
import ladies1568 from "@/assets/events/ladies-luncheon-1568.jpg";
import ladies1570 from "@/assets/events/ladies-luncheon-1570.jpg";
import ladies1573 from "@/assets/events/ladies-luncheon-1573.jpg";
import ladies1576 from "@/assets/events/ladies-luncheon-1576.jpg";
import ladies1581 from "@/assets/events/ladies-luncheon-1581.jpg";
import ladies1607 from "@/assets/events/ladies-luncheon-1607.jpg";
import ladies1608 from "@/assets/events/ladies-luncheon-1608.jpg";
import ladies1628 from "@/assets/events/ladies-luncheon-1628.jpg";
import ladies1647 from "@/assets/events/ladies-luncheon-1647.jpg";

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
  { src: ladiesRoomWide, label: "Luncheon Room Wide" },
  { src: ladiesGreeting, label: "Luncheon Greeting" },
  { src: ladiesCurtainHosts, label: "Luncheon Curtain Hosts" },
  { src: ladiesReaction, label: "Luncheon Reaction" },
  { src: ladiesLaughter, label: "Luncheon Laughter" },
  { src: ladiesRibbonReveal, label: "Luncheon Ribbon Reveal" },
  { src: ladiesRibbonCurtain, label: "Luncheon Ribbon Curtain" },
  { src: ladiesDeckRibbon, label: "Luncheon Deck on Ribbon" },
  { src: ladiesCardRibbon, label: "Luncheon Card & Ribbon" },
  { src: ladiesScottPointing, label: "Luncheon Scott Performing" },
  { src: ladies1566, label: "Luncheon Table Address" },
  { src: ladies1568, label: "Luncheon Hosts Group" },
  { src: ladies1570, label: "Luncheon Hosts Welcome" },
  { src: ladies1573, label: "Luncheon Hosts Smiling" },
  { src: ladies1576, label: "Luncheon Hosts Lineup" },
  { src: ladies1581, label: "Luncheon Hosts Closeup" },
  { src: ladies1607, label: "Luncheon Room Tables" },
  { src: ladies1608, label: "Luncheon Scott Stage" },
  { src: ladies1628, label: "Luncheon Scott Notepad" },
  { src: ladies1647, label: "Luncheon Sharpie Reveal" },
];

type AdFormat = "post" | "story" | "fb-ad" | "google-display";
type LogoPosition = "top-left" | "center-top";
type LogoStyle = "wordmark" | "rabbit";
type LogoColor = "original" | "white";
type ContentSource = "custom" | "article";
type AudienceKey = "" | "corporate" | "wedding" | "private" | "brand";
type MetaCTA = "Learn More" | "Book Now" | "Sign Up" | "Contact Us";

const formatDimensions: Record<AdFormat, { w: number; h: number; label: string; aspect: string }> = {
  post: { w: 1080, h: 1080, label: "Instagram Post", aspect: "1/1" },
  story: { w: 1080, h: 1920, label: "Instagram Story", aspect: "9/16" },
  "fb-ad": { w: 1200, h: 628, label: "Facebook Ad", aspect: "1200/628" },
  "google-display": { w: 1200, h: 628, label: "Google Display", aspect: "1200/628" },
};

// ── AUDIENCE PRESETS ──
interface PresetVariant {
  headline: string;
  subheadline: string;
  cta: string;
  metaPrimary: string;
  metaHeadline: string;
  metaDescription: string;
  metaCta: MetaCTA;
}

const AUDIENCE_PRESETS: Record<Exclude<AudienceKey, "">, { label: string; variants: PresetVariant[] }> = {
  corporate: {
    label: "Corporate Event Planners",
    variants: [
      { headline: "YOUR GUESTS WON'T PUT THEIR PHONES DOWN. GOOD.", subheadline: "Luxury close-up magic for corporate events", cta: "CHECK AVAILABILITY", metaPrimary: "The entertainment guests actually talk about the next day. Close-up magic for corporate dinners and galas.", metaHeadline: "Corporate Magic Entertainment", metaDescription: "Trusted by Fortune 500s", metaCta: "Learn More" },
      { headline: "WHAT MORGAN STANLEY BOOKED FOR THEIR DINNER", subheadline: "The entertainment detail that changes everything", cta: "LEARN MORE", metaPrimary: "When Morgan Stanley needed unforgettable entertainment, they chose close-up magic. See why leading companies trust us.", metaHeadline: "Luxury Event Entertainment", metaDescription: "Fortune 500 approved", metaCta: "Learn More" },
      { headline: "THE ENTERTAINMENT GUESTS ACTUALLY REMEMBER", subheadline: "Close-up magic trusted by Fortune 500 companies", cta: "BOOK A CALL", metaPrimary: "Skip the generic entertainment. Close-up magic creates the kind of moments your guests will bring up for years.", metaHeadline: "Unforgettable Event Magic", metaDescription: "Book your corporate event", metaCta: "Contact Us" },
    ],
  },
  wedding: {
    label: "Wedding Planners",
    variants: [
      { headline: "THE DETAIL YOUR WEDDING GUESTS WON'T STOP TALKING ABOUT", subheadline: "Close-up magic for cocktail hour", cta: "BOOK YOUR DATE", metaPrimary: "The one cocktail hour detail that turns strangers into friends and gets everyone talking. Close-up magic for weddings.", metaHeadline: "Wedding Cocktail Hour Magic", metaDescription: "Book your wedding date", metaCta: "Book Now" },
      { headline: "COCKTAIL HOUR DOESN'T HAVE TO BE AWKWARD", subheadline: "Turn strangers into friends in 90 seconds", cta: "SEE HOW", metaPrimary: "No more awkward mingling. Close-up magic breaks the ice instantly and gets every table laughing together.", metaHeadline: "Ice-Breaking Wedding Magic", metaDescription: "See how it works", metaCta: "Learn More" },
      { headline: "WHAT 200+ COUPLES WISH THEY KNEW SOONER", subheadline: "The wedding entertainment beyond the DJ", cta: "CHECK DATES", metaPrimary: "200+ couples say the same thing: 'We wish we'd booked the magician sooner.' Don't miss your date.", metaHeadline: "Wedding Entertainment Secret", metaDescription: "Check available dates", metaCta: "Book Now" },
    ],
  },
  private: {
    label: "Private Party Hosts",
    variants: [
      { headline: "MAKE YOUR NEXT PARTY LEGENDARY", subheadline: "Intimate magic for private celebrations", cta: "BOOK NOW", metaPrimary: "Elevate your next dinner party or celebration with intimate close-up magic that makes every guest feel like the star.", metaHeadline: "Private Party Magic", metaDescription: "Make it legendary", metaCta: "Book Now" },
      { headline: "THE HOST'S SECRET WEAPON", subheadline: "Close-up magic that makes every guest feel special", cta: "GET THE GUIDE", metaPrimary: "The best hosts know: great entertainment is the secret to an unforgettable evening. Discover close-up magic.", metaHeadline: "Secret to Great Parties", metaDescription: "Get the host's guide", metaCta: "Learn More" },
      { headline: "NOT YOUR AVERAGE ENTERTAINMENT", subheadline: "Luxury magic for discerning hosts", cta: "CHECK AVAILABILITY", metaPrimary: "Forget the photo booth. Luxury close-up magic creates genuine moments of wonder for your most important guests.", metaHeadline: "Luxury Private Entertainment", metaDescription: "Check availability now", metaCta: "Contact Us" },
    ],
  },
  brand: {
    label: "Brand / PR",
    variants: [
      { headline: "CREATE MOMENTS PEOPLE CAN'T HELP BUT SHARE", subheadline: "Experiential magic for brand activations", cta: "BOOK A CALL", metaPrimary: "Magic creates the kind of organic, shareable moments that no photo wall can match. Experiential entertainment for brands.", metaHeadline: "Brand Activation Magic", metaDescription: "Create shareable moments", metaCta: "Contact Us" },
      { headline: "YOUR NEXT ACTIVATION NEEDS A PATTERN INTERRUPT", subheadline: "Magic that generates organic social content", cta: "LEARN MORE", metaPrimary: "Stop blending in at events. A pattern interrupt creates the organic social content your brand actually needs.", metaHeadline: "Experiential Brand Magic", metaDescription: "Stand out at events", metaCta: "Learn More" },
      { headline: "WHAT YOUTUBE AND ROLLS ROYCE ALREADY KNOW", subheadline: "Entertainment that markets itself", cta: "SEE HOW", metaPrimary: "YouTube. Rolls Royce. Netflix. The world's best brands use magic to create moments that market themselves.", metaHeadline: "Entertainment That Sells", metaDescription: "See how top brands do it", metaCta: "Learn More" },
    ],
  },
};

// ── SAVED AD LIBRARY TYPE ──
interface SavedAd {
  id: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  audience: AudienceKey;
  format: AdFormat;
  photoIndex: number;
  logoStyle: LogoStyle;
  logoColor: LogoColor;
  logoPosition: LogoPosition;
  overlayOpacity: number;
  logoScale: number;
  fontScale: number;
  showCta: boolean;
  thumbnail: string;
  savedAt: string;
}

function loadLibrary(): SavedAd[] {
  try {
    return JSON.parse(localStorage.getItem("wr-ad-library") || "[]");
  } catch {
    return [];
  }
}

const SocialGenerator = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [contentSource, setContentSource] = useState<ContentSource>("custom");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<number>(0);
  const [customPhotos, setCustomPhotos] = useState<{ src: string; label: string }[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
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

  // New state
  const [selectedAudience, setSelectedAudience] = useState<AudienceKey>("");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [metaPrimary, setMetaPrimary] = useState("");
  const [metaHeadline, setMetaHeadline] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaCta, setMetaCta] = useState<MetaCTA>("Learn More");
  const [savedAds, setSavedAds] = useState<SavedAd[]>(loadLibrary);
  const [batchExporting, setBatchExporting] = useState(false);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [generatingAICopy, setGeneratingAICopy] = useState(false);
  const [instagramCaption, setInstagramCaption] = useState("");
  const [mode, setMode] = useState<"story" | "carousel">("story");

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

  const handleArticleSelect = (slug: string) => {
    setSelectedSlug(slug);
    const article = blogArticles.find((a) => a.slug === slug);
    if (article) {
      setHeadline(article.title.toUpperCase());
      setSubheadline(article.excerpt.split(".")[0].toUpperCase() + ".");
      setCtaText("READ MORE");
    }
  };

  // ── AUDIENCE PRESET HANDLER ──
  const handleAudienceSelect = (key: AudienceKey) => {
    setSelectedAudience(key);
    setSelectedVariant(0);
    if (key && AUDIENCE_PRESETS[key]) {
      applyVariant(key, 0);
    }
  };

  const applyVariant = (audience: Exclude<AudienceKey, "">, idx: number) => {
    const v = AUDIENCE_PRESETS[audience].variants[idx];
    setSelectedVariant(idx);
    setHeadline(v.headline);
    setSubheadline(v.subheadline);
    setCtaText(v.cta);
    setShowCta(true);
    setMetaPrimary(v.metaPrimary);
    setMetaHeadline(v.metaHeadline);
    setMetaDescription(v.metaDescription);
    setMetaCta(v.metaCta);
  };

  // ── COMPOSITE GENERATION ──
  const generateForFormat = useCallback(async (fmt: AdFormat): Promise<string | null> => {
    if (!canvasRef.current) return null;
    const dim = formatDimensions[fmt];
    // Temporarily update the canvas dimensions inline
    const canvas = canvasRef.current;
    const origW = canvas.style.width;
    const origH = canvas.style.height;
    canvas.style.width = dim.w + "px";
    canvas.style.height = dim.h + "px";
    await new Promise((r) => setTimeout(r, 400));
    try {
      const dataUrl = await toPng(canvas, { width: dim.w, height: dim.h, pixelRatio: 1, cacheBust: true });
      return dataUrl;
    } catch {
      return null;
    } finally {
      canvas.style.width = origW;
      canvas.style.height = origH;
    }
  }, []);

  const generateComposite = useCallback(async () => {
    if (!canvasRef.current) return;
    setCompositing(true);
    setFinalImage(null);
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

  const download = (dataUrl: string, formatLabel?: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `wr-${formatLabel || selectedFormat}-${Date.now()}.png`;
    a.click();
  };

  // ── BATCH EXPORT ──
  const handleBatchExport = useCallback(async () => {
    if (!canvasRef.current) return;
    setBatchExporting(true);
    const formats: AdFormat[] = ["post", "story", "fb-ad", "google-display"];
    for (const fmt of formats) {
      const savedFmt = selectedFormat;
      setSelectedFormat(fmt);
      await new Promise((r) => setTimeout(r, 800));
      try {
        const dim = formatDimensions[fmt];
        const dataUrl = await toPng(canvasRef.current, { width: dim.w, height: dim.h, pixelRatio: 1, cacheBust: true });
        download(dataUrl, fmt);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Batch export ${fmt} failed:`, err);
      }
    }
    setBatchExporting(false);
    toast({ title: "Batch export complete", description: "All 4 formats downloaded." });
  }, [selectedFormat]);

  // ── GENERATE ALL 3 VARIANTS ──
  const handleGenerateAllVariants = useCallback(async () => {
    if (!selectedAudience || !canvasRef.current) return;
    setGeneratingVariants(true);
    const presets = AUDIENCE_PRESETS[selectedAudience];
    for (let i = 0; i < presets.variants.length; i++) {
      applyVariant(selectedAudience, i);
      await new Promise((r) => setTimeout(r, 800));
      try {
        const dim = formatDimensions[selectedFormat];
        const dataUrl = await toPng(canvasRef.current, { width: dim.w, height: dim.h, pixelRatio: 1, cacheBust: true });
        download(dataUrl, `${selectedFormat}-v${i + 1}`);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Variant ${i + 1} failed:`, err);
      }
    }
    setGeneratingVariants(false);
    toast({ title: "All 3 variants exported" });
  }, [selectedAudience, selectedFormat]);

  // ── SAVE TO LIBRARY ──
  const handleSaveToLibrary = () => {
    const newAd: SavedAd = {
      id: Date.now().toString(),
      headline,
      subheadline,
      ctaText,
      audience: selectedAudience,
      format: selectedFormat,
      photoIndex: selectedPhoto,
      logoStyle,
      logoColor,
      logoPosition,
      overlayOpacity,
      logoScale,
      fontScale,
      showCta,
      thumbnail: finalImage || "",
      savedAt: new Date().toLocaleDateString(),
    };
    const updated = [newAd, ...savedAds];
    setSavedAds(updated);
    localStorage.setItem("wr-ad-library", JSON.stringify(updated));
    toast({ title: "Saved to library" });
  };

  const handleLoadFromLibrary = (ad: SavedAd) => {
    setHeadline(ad.headline);
    setSubheadline(ad.subheadline);
    setCtaText(ad.ctaText);
    setSelectedAudience(ad.audience);
    setSelectedFormat(ad.format);
    setSelectedPhoto(ad.photoIndex);
    setLogoStyle(ad.logoStyle);
    setLogoColor(ad.logoColor);
    setLogoPosition(ad.logoPosition);
    setOverlayOpacity(ad.overlayOpacity);
    setLogoScale(ad.logoScale);
    setFontScale(ad.fontScale);
    setShowCta(ad.showCta);
    setFinalImage(null);
    toast({ title: "Ad loaded from library" });
  };

  const handleDeleteFromLibrary = (id: string) => {
    const updated = savedAds.filter((a) => a.id !== id);
    setSavedAds(updated);
    localStorage.setItem("wr-ad-library", JSON.stringify(updated));
    toast({ title: "Removed from library" });
  };

  // ── COPY META CAPTION ──
  const handleCopyMeta = () => {
    const text = `Primary Text: ${metaPrimary}\nHeadline: ${metaHeadline}\nDescription: ${metaDescription}\nCTA: ${metaCta}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // ── GENERATE AI COPY ──
  const handleGenerateAICopy = async () => {
    setGeneratingAICopy(true);
    try {
      const audienceLabel = selectedAudience ? AUDIENCE_PRESETS[selectedAudience]?.label || selectedAudience : "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-ad-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          audience: audienceLabel,
          format: formatDimensions[selectedFormat].label,
          articleTitle: selectedArticle?.title || "",
          articleExcerpt: selectedArticle?.excerpt || "",
          adminPassword: password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast({ title: err.error || "AI copy generation failed", variant: "destructive" });
        return;
      }
      const data = await res.json();
      if (data.headline) setHeadline(data.headline);
      if (data.subheadline) setSubheadline(data.subheadline);
      if (data.instagramCaption) setInstagramCaption(data.instagramCaption);
      if (data.metaPrimary) setMetaPrimary(data.metaPrimary.slice(0, 125));
      if (data.metaHeadline) setMetaHeadline(data.metaHeadline.slice(0, 40));
      if (data.metaDescription) setMetaDescription(data.metaDescription.slice(0, 30));
      toast({ title: "AI copy generated", description: "All fields populated." });
    } catch (err) {
      console.error("AI copy error:", err);
      toast({ title: "Connection failed", variant: "destructive" });
    } finally {
      setGeneratingAICopy(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(instagramCaption);
    toast({ title: "Caption copied" });
  };

  const dim = formatDimensions[selectedFormat];
  const allPhotos = [...brandPhotos, ...customPhotos];
  const photo = allPhotos[selectedPhoto] || brandPhotos[0];


  // Brand colors
  const forestDark = "#223D34";
  const cream = "#F8F5F0";
  const gold = "#C8963E";
  const rose = "#C9A3A8";

  // Shared render function for the ad canvas
  const renderAdContent = (isExport: boolean) => (
    <>
      <img src={photo.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} {...(isExport ? { crossOrigin: "anonymous" } : {})} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${forestDark}${Math.round(overlayOpacity * 2.55).toString(16).padStart(2, "0")} 0%, ${forestDark}${Math.round(Math.min(overlayOpacity + 20, 90) * 2.55).toString(16).padStart(2, "0")} 100%)` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: selectedFormat === "story" ? "140px 60px 100px" : selectedFormat === "post" ? "60px" : "40px 50px" }}>
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
            {...(isExport ? { crossOrigin: "anonymous" } : {})}
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
    </>
  );

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

  const activePreset = selectedAudience ? AUDIENCE_PRESETS[selectedAudience] : null;

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

      {/* Mode toggle */}
      <section className="py-8 border-b border-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex justify-center gap-3">
            {(["story", "carousel"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`font-sans text-xs tracking-[0.25em] uppercase px-8 py-3 border transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-accent"
                }`}
              >
                {m === "story" ? "Story Mode" : "Carousel Mode"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {mode === "carousel" && <CarouselGenerator />}

      {mode === "story" && (
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

              {/* ── 1. AUDIENCE PRESET TEMPLATES ── */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Audience Preset</label>
                <select
                  value={selectedAudience}
                  onChange={(e) => handleAudienceSelect(e.target.value as AudienceKey)}
                  className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
                >
                  <option value="">No preset (custom)</option>
                  <option value="corporate">Corporate Event Planners</option>
                  <option value="wedding">Wedding Planners</option>
                  <option value="private">Private Party Hosts</option>
                  <option value="brand">Brand / PR</option>
                </select>
              </div>

              {/* ── 3. A/B COPY VARIANT CARDS ── */}
              {activePreset && (
                <div>
                  <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Copy Variants</label>
                  <div className="space-y-2">
                    {activePreset.variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => applyVariant(selectedAudience as Exclude<AudienceKey, "">, i)}
                        className={`w-full text-left p-4 border transition-colors ${selectedVariant === i ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}
                      >
                        <p className="font-serif text-sm text-foreground leading-tight mb-1">{v.headline}</p>
                        <p className="font-sans text-xs text-muted-foreground">{v.subheadline}</p>
                        <span className="inline-block mt-2 font-sans text-[10px] tracking-[0.15em] uppercase text-accent">{v.cta}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateAllVariants}
                    disabled={generatingVariants}
                    className="w-full mt-3 font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent px-6 py-3 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  >
                    {generatingVariants ? "Generating..." : "Generate All 3 Variants"}
                  </button>
                </div>
              )}

              {/* ── GENERATE AI COPY BUTTON ── */}
              <div>
                <button
                  onClick={handleGenerateAICopy}
                  disabled={generatingAICopy}
                  className="w-full font-sans text-xs tracking-[0.2em] uppercase px-6 py-3 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#C8963E", color: "#223D34", border: "1px solid #C8963E" }}
                >
                  {generatingAICopy ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "16px" }}>✦</span>
                      Generate AI Copy
                    </>
                  )}
                </button>
              </div>

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
                  {/* Upload button */}
                  <button
                    onClick={() => uploadInputRef.current?.click()}
                    className="aspect-square overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-accent/60 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground/50 hover:text-accent"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <span className="text-[9px] tracking-wider uppercase">Upload</span>
                  </button>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          setCustomPhotos((prev) => {
                            const next = [...prev, { src: dataUrl, label: file.name.replace(/\.[^.]+$/, "") }];
                            setSelectedPhoto(brandPhotos.length + next.length - 1);
                            return next;
                          });
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                  {allPhotos.map((p, i) => (
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

              {/* Google Drive photo bank */}
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">From Google Drive</label>
                <DrivePhotoBank
                  password={password}
                  showManager
                  selectedFileIds={customPhotos
                    .filter((p) => p.src.includes("/drive-photos?action=image&fileId="))
                    .map((p) => decodeURIComponent(p.src.split("fileId=")[1] || ""))}
                  onPick={(fileId, name) => {
                    const src = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos?action=image&fileId=${encodeURIComponent(fileId)}`;
                    setCustomPhotos((prev) => {
                      // toggle: remove if already present
                      const existingIdx = prev.findIndex((p) => p.src === src);
                      if (existingIdx >= 0) {
                        const next = prev.filter((_, i) => i !== existingIdx);
                        return next;
                      }
                      const next = [...prev, { src, label: name }];
                      setSelectedPhoto(brandPhotos.length + next.length - 1);
                      return next;
                    });
                  }}
                />
              </div>

              {/* Generate */}
              <button
                onClick={generateComposite}
                disabled={compositing}
                className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {compositing ? "Compositing..." : "Generate Ad"}
              </button>

              {/* ── 2. BATCH EXPORT ── */}
              <button
                onClick={handleBatchExport}
                disabled={batchExporting}
                className="w-full font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              >
                {batchExporting ? "Exporting..." : "Batch Export All Formats"}
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
                  {renderAdContent(false)}
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
                  {/* ── 5. SAVE TO LIBRARY ── */}
                  <button
                    onClick={handleSaveToLibrary}
                    className="w-full font-sans text-xs tracking-[0.2em] uppercase border border-muted-foreground/30 text-muted-foreground px-8 py-3 hover:border-accent hover:text-accent transition-colors"
                  >
                    Save to Library
                  </button>
                </div>
              )}

              {/* ── 4. META AD CAPTION GENERATOR ── */}
              <div className="mt-10 border border-border p-6 space-y-4">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-1">Meta Ad Caption</p>
                <div>
                  <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Primary Text <span className="text-muted-foreground/50">({metaPrimary.length}/125)</span>
                  </label>
                  <textarea
                    value={metaPrimary}
                    onChange={(e) => setMetaPrimary(e.target.value.slice(0, 125))}
                    rows={2}
                    maxLength={125}
                    className="w-full bg-background border border-border text-foreground font-sans text-sm px-3 py-2 focus:outline-none focus:border-accent resize-none"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Headline <span className="text-muted-foreground/50">({metaHeadline.length}/40)</span>
                  </label>
                  <input
                    value={metaHeadline}
                    onChange={(e) => setMetaHeadline(e.target.value.slice(0, 40))}
                    maxLength={40}
                    className="w-full bg-background border border-border text-foreground font-sans text-sm px-3 py-2 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Description <span className="text-muted-foreground/50">({metaDescription.length}/30)</span>
                  </label>
                  <input
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value.slice(0, 30))}
                    maxLength={30}
                    className="w-full bg-background border border-border text-foreground font-sans text-sm px-3 py-2 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">CTA</label>
                  <select
                    value={metaCta}
                    onChange={(e) => setMetaCta(e.target.value as MetaCTA)}
                    className="w-full bg-background border border-border text-foreground font-sans text-sm px-3 py-2 focus:outline-none focus:border-accent"
                  >
                    <option>Learn More</option>
                    <option>Book Now</option>
                    <option>Sign Up</option>
                    <option>Contact Us</option>
                  </select>
                </div>
                <button
                  onClick={handleCopyMeta}
                  className="w-full font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent px-6 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Copy All
                </button>
              </div>

              {/* ── INSTAGRAM CAPTION ── */}
              <div className="mt-6 border border-border p-6 space-y-4">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-1">Instagram Caption</p>
                <textarea
                  value={instagramCaption}
                  onChange={(e) => setInstagramCaption(e.target.value)}
                  rows={4}
                  placeholder="Generate AI copy to populate this field..."
                  className="w-full bg-background border border-border text-foreground font-sans text-sm px-3 py-2 focus:outline-none focus:border-accent resize-none"
                />
                <button
                  onClick={handleCopyCaption}
                  disabled={!instagramCaption}
                  className="w-full font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent px-6 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                >
                  Copy Caption
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SAVED AD LIBRARY ── */}
      {savedAds.length > 0 && (
        <section className="py-12 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-6">Saved Ad Library ({savedAds.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedAds.map((ad) => (
                <div key={ad.id} className="border border-border group hover:border-accent/50 transition-colors">
                  {ad.thumbnail ? (
                    <div className="aspect-square overflow-hidden bg-muted/20 cursor-pointer" onClick={() => handleLoadFromLibrary(ad)}>
                      <img src={ad.thumbnail} alt={ad.headline} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted/20 flex items-center justify-center cursor-pointer" onClick={() => handleLoadFromLibrary(ad)}>
                      <span className="font-sans text-xs text-muted-foreground">No preview</span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-serif text-xs text-foreground leading-tight line-clamp-2 mb-1">{ad.headline}</p>
                    <p className="font-sans text-[10px] text-muted-foreground">
                      {ad.audience ? AUDIENCE_PRESETS[ad.audience]?.label || "Custom" : "Custom"} · {ad.savedAt}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleLoadFromLibrary(ad)}
                        className="font-sans text-[10px] tracking-[0.1em] uppercase text-accent hover:underline"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteFromLibrary(ad.id)}
                        className="font-sans text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
          {renderAdContent(true)}
        </div>
      </div>
    </main>
  );
};

export default SocialGenerator;
