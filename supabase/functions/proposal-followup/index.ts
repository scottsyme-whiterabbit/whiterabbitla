// Proposal follow-up ladder.
// Three emails on a sent-but-unsigned proposal: day 2, day 5, day 7 (the day
// the seven-day hold lapses). Modelled on invoice-reminders.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/* ---------- assets (swap these when the files change) ---------- */
const LOGO_URL = "https://whiterabbitla.com/email-assets/wr-logo-stars.png";

/* ---------- brand ---------- */
const GROUND = "#283932";
const GOLD = "#C79A54";
const CREAM = "#F8F6F1";
const CREAM_SOFT = "#EDE9E1";
const SAND = "#DDCEB1";
const SAGE = "#7E9188";
const HEAD_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Montserrat', Helvetica, Arial, sans-serif";

const SITE_URL = "https://whiterabbitla.com";
const FROM = "Scott Syme <scott.syme@whiterabbitla.com>";
const REPLY_TO = "scott.syme@whiterabbitla.com";

const FOLLOWUP_OFFSETS = [2, 5, 7];
const MIN_HOURS_BETWEEN = 20;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const hoursSince = (ts: string | null) =>
  ts ? (Date.now() - new Date(ts).getTime()) / 36e5 : Infinity;

const daysSince = (ts: string | null) =>
  ts ? (Date.now() - new Date(ts).getTime()) / 864e5 : 0;

/** Lenient date parse. Returns null when unusable (free-text like "Sept 19 or 26"). */
const parseEventDate = (raw: string | null): Date | null => {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (/\bor\b|\//.test(cleaned) && !/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    if (/\bor\b/i.test(cleaned)) return null;
  }
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? `${cleaned}T12:00:00Z` : cleaned);
  return isFinite(d.getTime()) ? d : null;
};

const firstNameOf = (p: { first_name?: string | null }) =>
  (p.first_name || "there").trim().split(/\s+/)[0] || "there";

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      })
    : "";

/* ---------- key line + production block ---------- */
const keyLineFor = (eventType: string | null) => {
  const t = (eventType || "").toLowerCase();
  if (t.includes("wedding")) return "It feels like being let in on something.";
  if (t.includes("corporate") || t.includes("holiday"))
    return "Shared moments your guests talk about long after the evening ends.";
  return "Your guests do not watch the show, they become the show.";
};

const SHOW_RE = /(parlor|parlour|stage|show|theater|theatre|seated|speakeasy|drape)/i;

const offersShow = (tiers: unknown): boolean => {
  if (!Array.isArray(tiers) || tiers.length === 0) return false;
  const test = (t: any) =>
    SHOW_RE.test(`${t?.name || ""} ${Array.isArray(t?.items) ? t.items.join(" ") : ""}`);
  if (tiers.length === 1) return test(tiers[0]);
  const recommended = tiers.filter((t: any) => t?.recommended === true);
  if (recommended.length === 1) return test(recommended[0]);
  return false;
};

const PRODUCTION_BLOCK =
  "For your evening there is also the show itself, which I build in before your first guest arrives. The drapes, the lighting and the soundtrack all travel with me.";

/* ---------- email shell ---------- */
const p = (text: string) =>
  `<p style="margin:0 0 18px;font-family:${BODY_FONT};font-size:15px;line-height:1.75;color:${CREAM};">${text}</p>`;


const button = (url: string, label: string) =>
  `<div style="text-align:center;margin:30px 0 26px;"><a href="${url}" style="display:inline-block;background:${GOLD};color:${GROUND};text-decoration:none;padding:15px 32px;font-family:${BODY_FONT};font-size:12px;letter-spacing:.16em;text-transform:uppercase;">${esc(label)}</a></div>`;

const signature = () =>
  `<div style="margin:30px 0 0;font-family:${BODY_FONT};font-size:14px;line-height:1.7;color:${CREAM_SOFT};">
    Scott Syme<br/>
    Magician<br/>
    (424) 394-1850<br/>
    <a href="${SITE_URL}" style="color:${SAND};text-decoration:none;">whiterabbitla.com</a>
  </div>`;

const shell = (inner: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${GROUND};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${GROUND};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;background:${GROUND};">
        <tr><td style="padding:24px 40px 28px;text-align:center;">
          <img src="${LOGO_URL}" alt="White Rabbit LA" width="150" style="width:150px;max-width:60%;height:auto;display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:0 40px 36px;">${inner}</td></tr>
        <tr><td style="padding:0 40px 36px;text-align:center;">
          <div style="height:1px;background:${GOLD};opacity:.5;margin:0 0 16px;"></div>
          <div style="font-family:${BODY_FONT};font-size:11px;color:${SAGE};line-height:1.6;">
            White Rabbit LA &middot; Los Angeles, CA<br/>
            7393 W. Manchester Ave #209, Los Angeles, CA 90045
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

type Proposal = {
  id: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  recipient_email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  tiers: unknown;
  sent_at: string | null;
  followup_step: number;
  last_followup_at: string | null;
  followup_paused: boolean;
};

function buildEmail(prop: Proposal, step: 1 | 2 | 3) {
  const name = firstNameOf(prop);
  const nameE = esc(name);
  const url = `${SITE_URL}/proposal/${prop.slug}`;
  const eventDate = prop.event_date || "your date";

  if (step === 1) {
    const sentDate = fmtDate(prop.sent_at);
    const subject = `${name}, just wanted to make sure this found you`;
    const html = shell(
      photo(CLOSEUP_URL, "Close up magic") +
        p(`${nameE},`) +
        p(`I sent your proposal over on ${esc(sentDate)}. Just making sure it landed, since email has a way of burying things.`) +
        p("No rush on it. If anything in there needs adjusting, or you want to talk a detail through before you decide, call me anytime.") +
        button(url, "View your proposal") +
        signature(),
    );
    const text = `${name},

I sent your proposal over on ${sentDate}. Just making sure it landed, since email has a way of burying things.

No rush on it. If anything in there needs adjusting, or you want to talk a detail through before you decide, call me anytime.

View your proposal: ${url}

Scott Syme
Magician
(424) 394-1850
whiterabbitla.com`;
    return { subject, html, text };
  }

  if (step === 2) {
    const keyLine = keyLineFor(prop.event_type);
    const showBlock = offersShow(prop.tiers) ? p(PRODUCTION_BLOCK) : "";
    const subject = "What your guests will actually remember";
    const html = shell(
      photo(CLOSEUP_URL, "Close up magic") +
        p(`${nameE},`) +
        p("Nothing needed here. I wanted to tell you the part that does not fit in a proposal.") +
        p("The magic happens close. Inches away, in your guests' own hands. A card they are holding. A ring they just took off. Their own phone. Close enough that there is nowhere for it to hide.") +
        showBlock +
        p("You are the one building that evening. I am there to help your guests feel alive inside it.") +
        `<p style="margin:0 0 18px;font-family:${HEAD_FONT};font-style:italic;font-size:19px;line-height:1.6;color:${SAND};">${esc(keyLine)}</p>` +
        p("Whenever you are ready.") +
        signature(),
    );
    const text = `${name},

Nothing needed here. I wanted to tell you the part that does not fit in a proposal.

The magic happens close. Inches away, in your guests' own hands. A card they are holding. A ring they just took off. Their own phone. Close enough that there is nowhere for it to hide.
${offersShow(prop.tiers) ? `\n${PRODUCTION_BLOCK}\n` : ""}
You are the one building that evening. I am there to help your guests feel alive inside it.

${keyLine}

Whenever you are ready.

Scott Syme
Magician
(424) 394-1850
whiterabbitla.com`;
    return { subject, html, text };
  }

  const subject = `${name}, about ${eventDate}`;
  const html = shell(
    p(`${nameE},`) +
      p(`The hold on ${esc(eventDate)} comes off today.`) +
      p("Not a push. It just means the date is open again, and if someone asks for it I will not be able to turn them down on your behalf.") +
      p("If you want me to keep holding it, say the word.") +
      button(url, "View your proposal") +
      signature(),
  );
  const text = `${name},

The hold on ${eventDate} comes off today.

Not a push. It just means the date is open again, and if someone asks for it I will not be able to turn them down on your behalf.

If you want me to keep holding it, say the word.

View your proposal: ${url}

Scott Syme
Magician
(424) 394-1850
whiterabbitla.com`;
  return { subject, html, text };
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      text,
      reply_to: REPLY_TO,
      headers: {
        "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) console.error("Resend failed", res.status, await res.text().catch(() => ""));
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // CRON_SECRET was rotated to CRON_SECRET_V2; accept either.
    const acceptedCronSecrets = [
      Deno.env.get("CRON_SECRET"),
      Deno.env.get("CRON_SECRET_V2"),
    ].filter((s): s is string => !!s);
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "";
    const body = await req.json().catch(() => ({} as any));
    const provided = req.headers.get("x-cron-secret") || body?.cron_secret || "";
    const authorized =
      (!!provided && acceptedCronSecrets.includes(provided)) ||
      (adminPassword && body?.adminPassword === adminPassword);
    if (!authorized) return json({ error: "Unauthorized" }, 401);

    const dryRun = body?.dryRun === true;
    const results = { sent: 0, skipped: 0, errors: [] as string[], detail: [] as unknown[] };

    const { data, error } = await supabase
      .from("proposals")
      .select(
        "id, slug, first_name, last_name, recipient_email, event_type, event_date, venue, tiers, sent_at, followup_step, last_followup_at, followup_paused",
      )
      .not("sent_at", "is", null)
      .not("recipient_email", "is", null)
      .lt("followup_step", 3)
      .eq("followup_paused", false)
      .limit(500);
    if (error) return json({ error: error.message }, 500);

    const candidates = (data || []) as Proposal[];
    if (candidates.length === 0) return json({ success: true, dryRun, ...results });

    // Exclude anything already signed.
    const { data: signed } = await supabase
      .from("signed_agreements")
      .select("proposal_id")
      .in("proposal_id", candidates.map((c) => c.id));
    const signedIds = new Set((signed || []).map((s: any) => s.proposal_id));

    const emails = candidates
      .map((c) => (c.recipient_email || "").toLowerCase())
      .filter(Boolean);
    const [{ data: unsubs }, { data: suppressed }, { data: views }] = await Promise.all([
      supabase.from("email_unsubscribes").select("email").in("email", emails),
      supabase.from("email_suppression_list").select("email").in("email", emails),
      supabase
        .from("proposal_views")
        .select("proposal_id, viewed_at")
        .in("proposal_id", candidates.map((c) => c.id))
        .gte("viewed_at", new Date(Date.now() - 24 * 36e5).toISOString()),
    ]);
    const blocked = new Set(
      [...(unsubs || []), ...(suppressed || [])].map((r: any) => (r.email || "").toLowerCase()),
    );
    const recentlyViewed = new Set((views || []).map((v: any) => v.proposal_id));

    for (const prop of candidates) {
      try {
        const email = (prop.recipient_email || "").toLowerCase();
        if (signedIds.has(prop.id)) { results.skipped++; continue; }
        if (blocked.has(email)) { results.skipped++; continue; }
        if (recentlyViewed.has(prop.id)) { results.skipped++; continue; }
        if (hoursSince(prop.last_followup_at) < MIN_HOURS_BETWEEN) { results.skipped++; continue; }

        const eventDate = parseEventDate(prop.event_date);
        if (eventDate && eventDate.getTime() < Date.now()) { results.skipped++; continue; }

        const step = prop.followup_step || 0;
        const offset = FOLLOWUP_OFFSETS[step];
        if (offset === undefined) { results.skipped++; continue; }
        if (daysSince(prop.sent_at) < offset) { results.skipped++; continue; }

        const next = (step + 1) as 1 | 2 | 3;
        const { subject, html, text } = buildEmail(prop, next);

        if (dryRun) {
          results.sent++;
          results.detail.push({ id: prop.id, slug: prop.slug, step: next, subject });
          continue;
        }

        const ok = await sendEmail(email, subject, html, text);
        if (!ok) { results.errors.push(`send failed ${prop.id}`); continue; }
        await supabase
          .from("proposals")
          .update({ followup_step: next, last_followup_at: new Date().toISOString() })
          .eq("id", prop.id);
        results.sent++;
        results.detail.push({ id: prop.id, slug: prop.slug, step: next, subject });
      } catch (e) {
        results.errors.push(`${prop.id}: ${(e as Error).message}`);
      }
    }

    return json({ success: true, dryRun, ...results });
  } catch (e) {
    console.error("proposal-followup error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
