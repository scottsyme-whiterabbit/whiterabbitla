import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { name, email, source, persona, recommendation } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert into newsletter_contacts
    const { data: existing } = await supabase
      .from("newsletter_contacts")
      .select("id, drip_step")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      // Already enrolled, skip
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert new contact
    const { data: contact, error: insertErr } = await supabase
      .from("newsletter_contacts")
      .insert({
        email: email.toLowerCase().trim(),
        name: name || null,
        source: source || "quiz",
        subscribed: true,
        drip_step: 0,
        drip_started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to enroll contact" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create deal in pipeline for quiz leads
    try {
      await supabase.from("deals").insert({
        contact_email: email.toLowerCase().trim(),
        contact_name: name || null,
        event_type: "other",
        stage: "new",
        source: "quiz",
        notes: recommendation ? `Quiz result: ${recommendation}` : null,
      });
    } catch (dealErr) {
      console.error("Deal creation failed (non-blocking):", dealErr);
    }

    // Generate + send first drip email
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.warn("Missing API keys for drip email, contact enrolled but email not sent");
      return new Response(JSON.stringify({ success: true, enrolled: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
    const currentYear = new Date().getFullYear();

    const systemPrompt = `You are the brand copywriter for White Rabbit, a luxury magic and entertainment experience by Scott Syme in Los Angeles.

BRAND VOICE: Elevated hospitality tone. High-class, fun, alive. Never cheesy, never salesy. Think the hush of a five-star lobby meets genuine warmth. NEVER use em-dashes. Use commas, periods, and colons instead.

ABOUT THE BUSINESS:
- Scott Syme is the magician and creative force behind White Rabbit
- Member of the Magic Castle® in Hollywood, consultant for America's Got Talent and Disney Channel
- Clients include Netflix, Disney, Rolls Royce, Morgan Stanley, Paramount, Lionsgate, YouTube, Hyatt, Rivian, Olivia Rodrigo, Taittinger
- Specializes in close-up magic, parlor shows, and fully produced private events
- Based in Los Angeles, available nationwide

CONTEXT: This person just completed a discovery quiz on the website.
${persona ? `Their persona result: "${persona}"` : ""}
${recommendation ? `Their recommended experience: "${recommendation}"` : ""}
Their name: ${name || "Unknown"}

This is drip email #1 of 3 in a welcome sequence:
- Email 1 (THIS ONE): Warm, personal welcome. Thank them for taking the quiz. Reference their result if available. Introduce Scott and what makes White Rabbit different. Keep it conversational and intriguing.
- DO NOT hard-sell. The goal is to build curiosity and connection.

Write the email in this JSON format:
{
  "subject": "subject line (under 50 chars, personal, intriguing)",
  "body_html": "full HTML email body"
}

HTML styling:
- Background: #2D4A3E
- Inner card: #1e352c with border-radius: 8px, max-width: 560px, centered
- Font: Georgia, serif
- Text color: rgba(245,240,232,0.8), line-height: 1.8
- Accent color: #c8a0a0
- Logo at top: <img src="https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-symbol.png" alt="White Rabbit" style="width:50px;height:auto;margin:0 auto 24px;display:block;" />
- Soft CTA linking to https://whiterabbitla.com/experience (not a hard sell button, just a text link)
- Footer: "White Rabbit · Los Angeles" with physical address "7393 W. Manchester Ave #209, Los Angeles, CA 90045" in small text, with "Unsubscribe" linking to {{UNSUBSCRIBE_LINK}}
- Keep it 3-4 short paragraphs. Warm, not long.
- Current date context: ${currentMonth} ${currentYear}`;

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
          { role: "user", content: "Write the welcome drip email #1." },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error("AI draft failed:", aiRes.status);
      return new Response(JSON.stringify({ success: true, enrolled: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Could not parse AI email draft");
      return new Response(JSON.stringify({ success: true, enrolled: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draft = JSON.parse(jsonMatch[0]);

    // Personalize
    const html = draft.body_html
      .replace(/\{\{NAME\}\}/g, name ? (name.includes(" and ") || name.trim().toLowerCase().endsWith("team") ? name : name.split(" ")[0]) : "there")")
      .replace(
        /\{\{UNSUBSCRIBE_LINK\}\}/g,
        `https://whiterabbitla.com/unsubscribe?email=${encodeURIComponent(email)}`
      );

    // Send via Resend
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: [email.toLowerCase().trim()],
        subject: draft.subject,
        html,
      }),
    });

    if (sendRes.ok) {
      // Update contact drip step
      await supabase
        .from("newsletter_contacts")
        .update({
          drip_step: 1,
          last_emailed_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
    } else {
      const errData = await sendRes.json();
      console.error("Resend error:", errData);
    }

    // Send notification email to Scott for every new quiz lead
    const notifyHtml = `
      <h2>New Discovery Quiz Lead</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name || "Not provided"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Source</td><td style="padding:8px;border-bottom:1px solid #eee;">${source || "quiz"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Persona</td><td style="padding:8px;border-bottom:1px solid #eee;">${persona || "N/A"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Recommendation</td><td style="padding:8px;border-bottom:1px solid #eee;">${recommendation || "N/A"}</td></tr>
      </table>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: ["scott.syme@whiterabbitla.com"],
        subject: `Discovery Quiz Lead: ${name || email}`,
        html: notifyHtml,
        reply_to: email,
      }),
    });

    return new Response(JSON.stringify({ success: true, enrolled: true, emailSent: sendRes.ok }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("enroll-drip error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
