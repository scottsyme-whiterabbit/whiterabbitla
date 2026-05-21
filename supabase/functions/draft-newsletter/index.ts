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
    const { topic, campaignType, dripStep, adminPassword } = await req.json();

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

    const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
    const currentYear = new Date().getFullYear();

    const dripContext = campaignType === "drip" ? `
This is drip email #${dripStep} of 3 in a welcome sequence:
- Email 1: Warm welcome, introduce Scott Syme and White Rabbit, mention what makes the experience different
- Email 2: Share a compelling client story or behind-the-scenes look, build desire
- Email 3: Seasonal urgency + clear CTA to book, mention limited availability
Write the email for step ${dripStep}.` : "";

    const systemPrompt = `You are the brand copywriter for White Rabbit, a luxury magic and entertainment experience by Scott Syme in Los Angeles.

BRAND VOICE: Elevated hospitality tone. Quiet, confident, alive. Never cheesy, never salesy. Think the hush of a five-star lobby meets genuine warmth.

PRIME DIRECTIVE: The guest is the subject. The host is the reason the evening is possible. Scott is in service of both. Write from that posture, never as a vendor pitching.

ABSOLUTE BANS (will be rejected):
- NEVER use em dashes ( — or -- ). Use commas, periods, colons, or parentheses instead.
- NEVER use exclamation points anywhere.
- NEVER use the words: elevate, transform, magical journey, enchanting, unforgettable, mesmerizing, delve, unleash, world-class (as filler).
- NEVER use vendor enthusiasm: thrilled, excited to, so excited, can't wait, amazing, incredible.
- NEVER open with: "Thank you so much for reaching out", "Just checking in", "Hope this finds you well", "I hope you are well".

ABOUT THE BUSINESS:
- Scott Syme is the magician and creative force behind White Rabbit
- Member of the Magic Castle® in Hollywood, consultant for America's Got Talent and Disney Channel
- Clients include Netflix, Disney, Rolls Royce, Morgan Stanley, Paramount, Lionsgate, YouTube, Hyatt, Rivian, Olivia Rodrigo, Taittinger
- Specializes in close-up magic, parlor shows, and fully produced private events
- Known for transforming any room into something cinematic and intimate through curated lighting, signature soundtrack, and world-class hospitality
- Based in Los Angeles, available nationwide

CONTACT: events@whiterabbitla.com | 424 394 1850 | whiterabbitla.com

${dripContext}

Write the email in this JSON format:
{
  "subject": "subject line (under 50 chars, intriguing, no clickbait)",
  "preview": "preview text (under 90 chars)",
  "body_html": "full HTML email body using the White Rabbit email template style"
}

The HTML should use this styling:
- Background: #2D4A3E
- Inner card: #1e352c
- Font: Georgia, serif
- Text color: rgba(245,240,232,0.8)
- Accent/CTA color: #c8a0a0
- Include the logo: <img src="https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-symbol.png" alt="White Rabbit" style="width:60px;height:auto;margin:0 auto 20px;" />
- CTA button linking to https://whiterabbitla.com/contact
- Footer: "White Rabbit · Los Angeles" with physical address "7393 W. Manchester Ave #209, Los Angeles, CA 90045" and unsubscribe placeholder: {{UNSUBSCRIBE_LINK}}
- Keep it concise: 3-4 short paragraphs max
- Current month/year for seasonal context: ${currentMonth} ${currentYear}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: topic || `Write a newsletter email for ${currentMonth} ${currentYear}. Include recent highlights, a seasonal booking nudge, and a personal touch from Scott.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI draft failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draft = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(draft), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("draft-newsletter error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
