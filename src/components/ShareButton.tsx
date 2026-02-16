import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = "https://whiterabbitla.com";

interface ShareButtonProps {
  /** The slug used to find the static share page in /share/{slug}.html */
  shareSlug: string;
}

// Map of OG images available at stable public URLs (exported for other components)
const OG_IMAGES: Record<string, string> = {
  "Magic Destinations": `${BASE_URL}/og/magic-destinations.jpg`,
  "For Planners": `${BASE_URL}/og/corporate.jpg`,
  "Private Events": `${BASE_URL}/og/private.jpg`,
  "Corporate Events": `${BASE_URL}/og/corporate.jpg`,
  "Behind the Craft": `${BASE_URL}/og/behind-the-craft.jpg`,
  "Event Planning": `${BASE_URL}/og/corporate.jpg`,
  "Corporate": `${BASE_URL}/og/corporate.jpg`,
  "Weddings": `${BASE_URL}/og/private.jpg`,
  about: `${BASE_URL}/og/about.jpg`,
  experience: `${BASE_URL}/og/experience.jpg`,
  contact: `${BASE_URL}/og/contact.jpg`,
  reviews: `${BASE_URL}/og/reviews.jpg`,
  default: `${BASE_URL}/og-image.jpg`,
};

export function getOgImage(category?: string): string {
  if (category && OG_IMAGES[category]) return OG_IMAGES[category];
  return OG_IMAGES.default;
}

export default function ShareButton({ shareSlug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const shareUrl = `${BASE_URL}/share/${shareSlug}.html`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it in a text — the preview will show the correct title and photo." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy share link"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
