import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, category, format } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isStory = format === "story";
    const aspectDesc = isStory ? "9:16 vertical story (1080x1920)" : "1:1 square post (1080x1080)";

    const STORAGE_BASE = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets";
    const symbolUrl = `${STORAGE_BASE}/wr-symbol.png`;
    const primaryLogoUrl = `${STORAGE_BASE}/wr-primary-logo.png`;

    const prompt = `Create a luxurious, editorial-style Instagram ${isStory ? "story" : "post"} image for a high-end magic entertainment brand called "White Rabbit" by Scott Syme in Los Angeles.

The image should be ${aspectDesc} aspect ratio.

Article title: "${title}"
Article excerpt: "${excerpt}"
Category: ${category}

I am providing you with two brand logos:
1. The first image is the White Rabbit SYMBOL (a rabbit silhouette). Place this prominently on the image.
2. The second image is the White Rabbit PRIMARY LOGO (wordmark with three stars above it). Place this at the top or bottom of the image as the brand identifier.

CRITICAL: You MUST incorporate BOTH of the provided logo images exactly as they appear (do not redraw or approximate them). Place them cleanly on the design.

Design requirements:
- Deep forest green (#2D4A3E) and cream/ivory color palette with dusty rose (#c8a0a0) accents
- Elegant serif typography for the headline
- The title text "${title}" should be prominently displayed on the image
- Include "whiterabbitla.com" subtly at the bottom
- Sophisticated, moody, cinematic aesthetic (think luxury hotel lobby meets editorial magazine)
- ${isStory ? "Vertical layout with text centered, generous spacing" : "Square layout, balanced composition"}
- No clip art, no cartoonish elements, no cheesy magic imagery
- Ultra high resolution, photographic quality background with text overlay`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: symbolUrl } },
            { type: "image_url", image_url: { url: primaryLogoUrl } },
          ],
        }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image generated", raw: data.choices?.[0]?.message?.content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-social error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
