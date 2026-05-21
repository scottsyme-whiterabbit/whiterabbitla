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
    const { audience, format, articleTitle, articleExcerpt, adminPassword } = await req.json();

    if (adminPassword !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audienceContext = audience
      ? `The target audience is: ${audience}.`
      : "Write for a general luxury audience.";

    const articleContext = articleTitle
      ? `The ad promotes this article: "${articleTitle}". Excerpt: "${articleExcerpt || ""}".`
      : "Write general brand awareness copy for White Rabbit LA.";

    const formatContext = format
      ? `The ad format is: ${format}.`
      : "";

    const userPrompt = `Write ad copy for White Rabbit LA. ${audienceContext} ${articleContext} ${formatContext}

Return the copy using the generate_ad_copy tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You write ad copy for White Rabbit LA, a luxury close-up magician for corporate events, weddings, and private parties in LA. Brand voice is sophisticated, quiet, confident, hosted. Never stuffy, never salesy.

PRIME DIRECTIVE: The guest is the subject. The host is the reason it is possible. Write from that posture. Focus on the moment the room shares, not on the performer's skill.

ABSOLUTE BANS:
- Never use em dashes ( — or -- ). Use commas, periods, or colons.
- Never use exclamation points.
- Never use: elevate, transform, magical journey, enchanting, unforgettable, mesmerizing, unleash, world-class (as filler), wow factor.
- Never use vendor enthusiasm: thrilled, excited, amazing, incredible, can't wait.

You must respond using the generate_ad_copy tool.`,
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_ad_copy",
              description: "Return structured ad copy for White Rabbit LA",
              parameters: {
                type: "object",
                properties: {
                  headline: {
                    type: "string",
                    description: "Max 8 words, all uppercase, punchy and memorable",
                  },
                  subheadline: {
                    type: "string",
                    description: "Max 15 words, uppercase, supports the headline",
                  },
                  instagramCaption: {
                    type: "string",
                    description: "2-3 sentences plus 5 relevant hashtags for Instagram",
                  },
                  metaPrimary: {
                    type: "string",
                    description: "Primary text for Meta ads, max 125 characters",
                  },
                  metaHeadline: {
                    type: "string",
                    description: "Headline for Meta ads, max 40 characters",
                  },
                  metaDescription: {
                    type: "string",
                    description: "Description for Meta ads, max 30 characters",
                  },
                },
                required: ["headline", "subheadline", "instagramCaption", "metaPrimary", "metaHeadline", "metaDescription"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_ad_copy" } },
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
      return new Response(JSON.stringify({ error: "AI copy generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-ad-copy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
