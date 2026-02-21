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
    const { subjectLine, adminPassword } = await req.json();

    if (adminPassword !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subjectLine?.trim()) {
      return new Response(JSON.stringify({ error: "Subject line required" }), {
        status: 400,
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an email marketing expert specializing in high-end event entertainment and luxury services. Score email subject lines for open rate potential.

You must respond using the score_subject_line tool.

Consider these factors:
- Curiosity & intrigue (does it make you NEED to open?)
- Personalization potential
- Length (under 50 chars ideal, under 60 acceptable)
- Spam trigger words (avoid!)
- Emotional resonance
- Urgency without being pushy
- Relevance to event planners and luxury clients

The audience is high-end event planners, corporate executives, and luxury apartment community managers.`,
          },
          {
            role: "user",
            content: `Score this email subject line: "${subjectLine}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_subject_line",
              description: "Return a score and analysis for an email subject line",
              parameters: {
                type: "object",
                properties: {
                  score: {
                    type: "number",
                    description: "Score from 1-100 where 100 is perfect",
                  },
                  grade: {
                    type: "string",
                    enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
                    description: "Letter grade",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 specific strengths",
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 specific weaknesses or areas to improve",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 alternative subject line suggestions that would score higher",
                  },
                  spamRisk: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Spam filter risk level",
                  },
                },
                required: ["score", "grade", "strengths", "weaknesses", "suggestions", "spamRisk"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_subject_line" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI scoring failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("score-subject error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
