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
    const aspectDesc = isStory ? "9:16 vertical (1080x1920)" : "1:1 square (1080x1080)";

    const categoryPrompts: Record<string, string> = {
      corporate: "a sleek corporate ballroom or penthouse event space with floor-to-ceiling windows overlooking a city skyline at dusk, polished dark wood conference tables, crystal glassware catching ambient light, dramatic uplighting in warm amber tones",
      wedding: "a romantic candlelit wedding reception setting with long wooden farm tables, hundreds of taper candles in brass holders, lush floral arrangements in deep burgundy and ivory, soft bokeh fairy lights strung overhead, vineyard or estate backdrop",
      private: "an intimate luxury lounge or private club setting with deep velvet seating in emerald or midnight blue, a marble bar with craft cocktails, warm Edison bulbs, cigar-lounge atmosphere with rich leather and dark walnut accents",
      brand: "a high-end brand activation space or gallery opening with sculptural lighting installations, sleek minimalist surfaces, dramatic shadows and spotlights, luxury product display aesthetics with clean lines and bold negative space",
    };

    const settingDescription = categoryPrompts[category?.toLowerCase()] || categoryPrompts[(excerpt || "").toLowerCase()] ||
      "an intimate luxury event space with warm ambient lighting, rich dark surfaces, elegant glassware, and cinematic shadow play";

    const prompt = `Generate a luxurious, atmospheric background image for an Instagram ${isStory ? "story" : "post"}.

The image should be ${aspectDesc} aspect ratio.

Requirements:
- This is ONLY a background image. Do NOT include any text, words, letters, logos, watermarks, or typography whatsoever.
- Do NOT include any people, faces, silhouettes, or human figures.
- Setting: ${settingDescription}
- Color palette: deep forest greens, warm golds and amber, rich cream highlights, touches of dusty rose. Overall tone is dark and moody, not bright or airy.
- Lighting: cinematic and editorial, inspired by Architectural Digest or Vanity Fair event photography. Warm candlelight, dramatic shadows, golden hour glow, subtle lens flare or bokeh.
- Textures: dark polished wood, velvet, marble, brass, crystal, silk, leather.
- Composition: abstract and ambient with clear negative space in the center for text overlay. Use depth of field to create layered foreground and background elements.
- Style: ultra high resolution, photographic quality, editorial luxury, NOT digitally illustrated or AI-looking.
- Mood: intimate, sophisticated, the hush before something extraordinary happens.
- NO text, NO words, NO letters, NO logos, NO people, NO faces anywhere in the image.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
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
