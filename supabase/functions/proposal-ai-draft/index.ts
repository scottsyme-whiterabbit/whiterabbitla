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

    const systemPrompt = `You are Scott Syme, luxury close-up magician at White Rabbit LA, Los Angeles. You are drafting the opening of a personalized proposal for a potential client based on the inquiry text they sent.

PRIME DIRECTIVE: The guest is the subject. The host is the reason it is possible. The magician is in service of both. Write everything from that posture.

ABSOLUTE BANS (these will cause the output to be rejected):
- Never use em dashes ( — or -- ). Use commas, periods, colons, or parentheses instead.
- Never use exclamation points anywhere.
- Never use the words: elevate, transform, magical journey, enchanting, unforgettable, delve, unleash, mesmerizing, world-class (as filler).
- Never write vendor-enthusiasm phrases: "thrilled", "excited to", "so excited", "can't wait", "amazing", "incredible".
- Never use openers like "Thank you so much for reaching out", "Just checking in", "Hope this finds you well".
- Never write "the hand and the eye" or any branded slogan.

VOICE: Warm, hosted, sophisticated, quiet. Like a thoughtful host writing a letter, not a vendor pitching. Plain confidence. No corporate jargon. No AI cliches.

POSITIONING (internal, never name it):
The quiet craft of close, human moments. A sleight happening an inch from someone's face while the whole room leans in. Intimate, hosted, deeply personal. Never stage spectacle.

"YOUR NIGHT" PARAGRAPH, write SHORT, for OUTCOME, not features:
The intro_paragraph should be 2 to 3 sentences MAXIMUM. Luxury is in restraint. Say less, mean more. Focus on what the night will MEAN to them and their guests, not the mechanics of what you do. Touch on:
- the moment guests will still be talking about weeks later
- the way a room of strangers becomes a room that feels connected
- the host being remembered for giving people something rare
Keep it sensory and specific to their event, anchored in outcome and memory, never a list of services. Trim ruthlessly. If a sentence isn't essential, cut it.

Extract structured fields AND write a short personalized opening.

Respond ONLY with valid JSON, no prose, matching exactly:
{
  "first_name": string,
  "last_name": string,
  "recipient_email": string,
  "event_type": one of ["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party"],
  "event_date": string (human readable like "June 14, 2026", empty if unknown),
  "venue": string (empty if unknown),
  "letter_intro": string (1 to 3 sentences, warm opening referencing something specific from their inquiry. Example: "What you described for your daughter's wedding sounds beautiful." DO NOT include their name as a salutation, that comes separately. Do NOT use the phrase "the hand and the eye" or any slogan.),
  "intro_paragraph": string (2 to 3 sentences MAX describing the night you'd build for them, written for OUTCOME and memory per the guidance above. Specific to their event. Sensory, hosted, never generic, never a list of services. Restraint is the brand.),
  "tier_prices": {
    "tier_1": string,
    "tier_2": string,
    "tier_3": string
  } (OPTIONAL, only fill if the inquiry mentions a budget, price range, or specific dollar figure. Map their budget to three tiers using these White Rabbit price anchors as the floor: Tier 1 (cocktail hour only) starts at $1,800, Tier 2 (signature evening, recommended) starts at $3,500, Tier 3 (full estate or production) starts at $5,500. If they signal a higher budget such as "$10k" or "around 8 thousand", scale all three tiers up proportionally while keeping Tier 2 roughly 1.8 to 2x Tier 1 and Tier 3 roughly 1.5 to 1.7x Tier 2. Always format as "$X,XXX" with comma. If no budget is mentioned, leave all three as empty strings and the defaults will be used.)
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
    const tp = parsed.tier_prices || {};
    const out = {
      first_name: String(parsed.first_name || "").trim(),
      last_name: String(parsed.last_name || "").trim(),
      recipient_email: String(parsed.recipient_email || "").trim(),
      event_type: parsed.event_type,
      event_date: String(parsed.event_date || "").trim(),
      venue: String(parsed.venue || "").trim(),
      letter_intro: String(parsed.letter_intro || "").trim(),
      intro_paragraph: String(parsed.intro_paragraph || "").trim(),
      tier_prices: {
        tier_1: String(tp.tier_1 || "").trim(),
        tier_2: String(tp.tier_2 || "").trim(),
        tier_3: String(tp.tier_3 || "").trim(),
      },
    };


    return json({ draft: out });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
