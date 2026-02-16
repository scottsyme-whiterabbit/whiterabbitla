import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE_URL = "https://whiterabbitla.com";

interface ShareButtonProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

// Map of OG images available at stable public URLs
const OG_IMAGES: Record<string, string> = {
  "Magic Destinations": `${BASE_URL}/og/magic-destinations.jpg`,
  "For Planners": `${BASE_URL}/og/corporate.jpg`,
  "Private Events": `${BASE_URL}/og/private.jpg`,
  "Corporate Events": `${BASE_URL}/og/corporate.jpg`,
  "Behind the Craft": `${BASE_URL}/og/behind-the-craft.jpg`,
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

export default function ShareButton({ title, description, path, ogImage }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const targetUrl = `${BASE_URL}${path}`;
    const image = ogImage || OG_IMAGES.default;

    const shareUrl = `${SUPABASE_URL}/functions/v1/og-share?url=${encodeURIComponent(targetUrl)}&t=${encodeURIComponent(title)}&d=${encodeURIComponent(description)}&i=${encodeURIComponent(image)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied", description: "Share it via text — the preview will show the correct title and photo." });
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
