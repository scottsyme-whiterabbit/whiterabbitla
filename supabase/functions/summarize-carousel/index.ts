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
    const { articleTitle, articleExcerpt, articleBody, category, adminPassword } = await req.json();

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

    const userPrompt = `Distill this White Rabbit LA article into a 5-panel Instagram carousel.

TITLE: ${articleTitle || ""}
CATEGORY: ${category || ""}
EXCERPT: ${articleExcerpt || ""}
BODY:
${(articleBody || "").slice(0, 8000)}

Return the carousel using the build_carousel tool. Humanize the language — sound like a thoughtful host talking to one planner, not a brand. Keep each panel short enough to fit on a 1080x1350 slide.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You write Instagram carousels for White Rabbit LA, a luxury close-up magician for corporate events, weddings, and private parties. Voice is sophisticated, quiet, hosted. The guest is the subject; the host is the reason it's possible.

ABSOLUTE BANS:
- Never use em dashes ( — or -- ). Use commas, periods, colons.
- Never use exclamation points.
- Never use: elevate, transform, magical journey, enchanting, unforgettable, mesmerizing, unleash, world-class, wow factor.
- Never use vendor enthusiasm: thrilled, excited, amazing, incredible, can't wait.
- Never italicize. Never reference "Hand and the Eye."

You must respond using the build_carousel tool.`,
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_carousel",
              description: "Return 5-panel carousel copy for White Rabbit LA",
              parameters: {
                type: "object",
                properties: {
                  hook: { type: "string", description: "Panel 1. One sentence, max 18 words. A pattern interrupt or quiet observation that makes a planner stop scrolling." },
                  blindSpot: { type: "string", description: "Panel 2. One to two sentences, max 28 words. The thing most people in the category miss." },
                  reframe: { type: "string", description: "Panel 3. One quotable sentence, max 22 words. The shift in thinking the article offers." },
                  proof: { type: "string", description: "Panel 4. One to two sentences, max 32 words. Concrete evidence, example, or principle from the article." },
                  proofCred: { type: "string", description: "Optional short credibility line for Panel 4. Max 8 words. Can be empty." },
                  ctaQuestion: { type: "string", description: "Panel 5. One question, max 20 words. Invites a reply or click without sounding salesy." },
                },
                required: ["hook", "blindSpot", "reframe", "proof", "proofCred", "ctaQuestion"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_carousel" } },
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
      return new Response(JSON.stringify({ error: "Carousel summarization failed" }), {
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
    console.error("summarize-carousel error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
