// Drafts a proposal from a pasted inquiry email/notes using Lovable AI Gateway.
// Returns: { first_name, last_name, recipient_email, event_type, event_date,
//            venue, letter_intro, intro_paragraph }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const pw = req.headers.get("x-admin-password") || "";
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return json({ error: "Unauthorized" }, 401);
  if (!LOVABLE_API_KEY) return json({ error: "AI gateway not configured" }, 500);

  try {
    const { inquiry_text } = await req.json();
    if (!inquiry_text || typeof inquiry_text !== "string") {
      return json({ error: "Missing inquiry_text" }, 400);
    }

    const systemPrompt = `You are Scott Syme — luxury close-up magician at White Rabbit LA, Los Angeles. You are drafting the opening of a personalized proposal for a potential client based on the inquiry text they sent.

Your tone: warm, hosted, sophisticated, never salesy. Never use AI clichés like "elevate", "transform", "unforgettable", "delve". Speak like a thoughtful host. Avoid corporate jargon.

POSITIONING — "the hand and the eye":
White Rabbit is positioned as the quiet craft of "the hand and the eye" — the art of close, human moments where a sleight happens an inch from someone's face and the whole room leans in. It's not stage spectacle; it's intimate, hosted, and deeply personal. Reference this craft naturally when it fits — never as a slogan, never forced.

"YOUR NIGHT" PARAGRAPH — write for OUTCOME, not features:
The intro_paragraph should focus on what the night will MEAN to them and their guests, not the mechanics of what you do. Speak to:
- the moments guests will still be talking about weeks later
- a story they'll retell for years
- the way a room of strangers becomes a room that feels connected — community, warmth, shared wonder
- the host (the client) being remembered for giving people something rare
- guests leaving genuinely changed by the evening, not just entertained
Keep it sensory and specific to their event, but anchored in outcome and memory — not a description of tricks or a setlist.

Extract structured fields AND write a short personalized opening.

Respond ONLY with valid JSON, no prose, matching exactly:
{
  "first_name": string,
  "last_name": string,
  "recipient_email": string,
  "event_type": one of ["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party"],
  "event_date": string (human readable like "June 14, 2026" — empty if unknown),
  "venue": string (empty if unknown),
  "letter_intro": string (1–3 sentences, warm opening referencing something specific from their inquiry — e.g. "Thank you for the kind note — what you described for your daughter's wedding sounds beautiful." DO NOT include their name as a salutation, that comes separately. You may gently nod to the craft of the hand and the eye when it fits.),
  "intro_paragraph": string (3–5 sentences describing the night you'd build for them — written for OUTCOME and memory per the guidance above. Specific to their event. Sensory, hosted, never generic, never a list of services.)
}

If a field is unknown leave it as an empty string. Never invent dates, venues, or emails.`;

    const userPrompt = `Inquiry text:\n\n${inquiry_text.slice(0, 4000)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limit — try again in a moment" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return json({ error: `AI error: ${t.slice(0, 300)}` }, 500);
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to salvage from a code-fenced response
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Sanitize
    const allowed = ["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party"];
    if (!allowed.includes(parsed.event_type)) parsed.event_type = "Private Event";
    const out = {
      first_name: String(parsed.first_name || "").trim(),
      last_name: String(parsed.last_name || "").trim(),
      recipient_email: String(parsed.recipient_email || "").trim(),
      event_type: parsed.event_type,
      event_date: String(parsed.event_date || "").trim(),
      venue: String(parsed.venue || "").trim(),
      letter_intro: String(parsed.letter_intro || "").trim(),
      intro_paragraph: String(parsed.intro_paragraph || "").trim(),
    };

    return json({ draft: out });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
