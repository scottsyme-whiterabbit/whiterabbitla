// Admin CRUD for email_drafts: list, update (edit subject/body), approve, dismiss, send.
// Sending re-uses the gmail-send function so threading + deal_activity logging still work.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function logAction(row: { action_type: string; contact_email?: string | null; contact_name?: string | null; deal_id?: string | null; draft_id?: string | null; subject?: string | null; summary?: string | null; metadata?: any }) {
  try {
    await supabase.from("action_log").insert({
      action_type: row.action_type,
      contact_email: row.contact_email || null,
      contact_name: row.contact_name || null,
      deal_id: row.deal_id || null,
      draft_id: row.draft_id || null,
      subject: row.subject || null,
      summary: row.summary || null,
      metadata: row.metadata || {},
    });
  } catch (e) {
    console.warn("action_log insert failed", e);
  }
}

// After a successful AI-bot send, update "last contacted" fields across all
// places the Action List reads from, so Last Contact and outreach status reflect it.
async function markContactedAfterSend(draft: any, messageId: string | null) {
  const email = (draft.contact_email || "").toLowerCase();
  const nowIso = new Date().toISOString();
  if (!email) return;
  try {
    // Deals: by deal_id if known, else by contact_email
    const dealPatch = { last_outreach_date: nowIso, outreach_status: "attempted" } as any;
    if (draft.deal_id) {
      await supabase.from("deals").update(dealPatch).eq("id", draft.deal_id);
    } else {
      await supabase.from("deals").update(dealPatch).ilike("contact_email", email);
    }
  } catch (e) { console.warn("deals last_outreach_date update failed", e); }
  try {
    await supabase.from("newsletter_contacts").update({ last_emailed_at: nowIso }).ilike("email", email);
  } catch (e) { console.warn("newsletter_contacts last_emailed_at update failed", e); }
  try {
    await supabase.from("cold_email_campaigns").update({ last_email_sent_at: nowIso }).ilike("email", email);
  } catch (e) { console.warn("cold_email_campaigns last_email_sent_at update failed", e); }
  try {
    await supabase.from("outreach_log").insert({
      contact_email: email,
      contact_name: draft.contact_name || null,
      action_type: "email",
      outcome: "sent",
      notes: `AI bot sent: ${draft.subject || "(no subject)"}${messageId ? ` [${messageId}]` : ""}`,
    });
  } catch (e) { console.warn("outreach_log insert failed", e); }
}

async function sendViaGmail(draft: any, adminPassword: string) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({
      adminPassword,
      deal_id: draft.deal_id || undefined,
      to: draft.contact_email,
      subject: draft.subject,
      body_text: draft.body,
      gmail_thread_id: draft.gmail_thread_id || undefined,
      in_reply_to: draft.in_reply_to || undefined,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `Gmail send ${r.status}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    if (body.adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { action } = body;

    if (action === "list") {
      const status = body.status || ["draft", "approved"];
      const statuses = Array.isArray(status) ? status : [status];
      const { data, error } = await supabase
        .from("email_drafts")
        .select("*")
        .in("status", statuses)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return new Response(JSON.stringify({ drafts: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      const { id, subject, body: text, user_hint } = body;
      const patch: any = { updated_at: new Date().toISOString() };
      if (subject !== undefined) patch.subject = subject;
      if (text !== undefined) patch.body = text;
      if (user_hint !== undefined) patch.user_hint = user_hint;
      const { data, error } = await supabase.from("email_drafts").update(patch).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      await logAction({ action_type: "draft_edited", contact_email: data?.contact_email, contact_name: data?.contact_name, deal_id: data?.deal_id, draft_id: id, subject: data?.subject, summary: `Edited draft to ${data?.contact_email}`, metadata: { fields: Object.keys(patch).filter(k => k !== "updated_at") } });
      return new Response(JSON.stringify({ draft: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "approve" || action === "dismiss") {
      const { id } = body;
      const patch: any = action === "approve"
        ? { status: "approved" }
        : { status: "dismissed", dismissed_at: new Date().toISOString() };
      const { data, error } = await supabase.from("email_drafts").update(patch).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      // If approving one variant, dismiss its siblings in the same generation
      if (action === "approve" && data?.generation_id) {
        await supabase.from("email_drafts")
          .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
          .eq("generation_id", data.generation_id)
          .neq("id", id)
          .in("status", ["draft"]);
      }
      await logAction({
        action_type: action === "approve" ? "draft_approved" : "draft_dismissed",
        contact_email: data?.contact_email, contact_name: data?.contact_name, deal_id: data?.deal_id, draft_id: id, subject: data?.subject,
        summary: action === "approve" ? `Approved draft to ${data?.contact_email}` : `Dismissed draft to ${data?.contact_email}`,
      });
      return new Response(JSON.stringify({ draft: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send") {
      const { id } = body;
      const { data: draft, error } = await supabase.from("email_drafts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!draft) throw new Error("Draft not found");
      if (draft.status === "sent") throw new Error("Already sent");
      const result = await sendViaGmail(draft, body.adminPassword);
      const { data: updated } = await supabase.from("email_drafts").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_message_id: result.message_id || null,
      }).eq("id", id).select("*").maybeSingle();
      // Auto-dismiss sibling variants
      if (draft.generation_id) {
        await supabase.from("email_drafts")
          .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
          .eq("generation_id", draft.generation_id)
          .neq("id", id)
          .in("status", ["draft", "approved"]);
      }
      await logAction({ action_type: "email_sent", contact_email: draft.contact_email, contact_name: draft.contact_name, deal_id: draft.deal_id, draft_id: id, subject: draft.subject, summary: `Sent email to ${draft.contact_email}`, metadata: { message_id: result.message_id || null, gmail_thread_id: draft.gmail_thread_id || null } });
      await markContactedAfterSend(draft, result.message_id || null);
      return new Response(JSON.stringify({ draft: updated, send_result: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send_batch") {
      const { ids } = body as { ids: string[] };
      const results: any[] = [];
      for (const id of ids) {
        try {
          const { data: draft } = await supabase.from("email_drafts").select("*").eq("id", id).maybeSingle();
          if (!draft || draft.status === "sent") { results.push({ id, ok: false, error: "not sendable" }); continue; }
          const r = await sendViaGmail(draft, body.adminPassword);
          await supabase.from("email_drafts").update({ status: "sent", sent_at: new Date().toISOString(), sent_message_id: r.message_id || null }).eq("id", id);
          if (draft.generation_id) {
            await supabase.from("email_drafts").update({ status: "dismissed", dismissed_at: new Date().toISOString() })
              .eq("generation_id", draft.generation_id).neq("id", id).in("status", ["draft", "approved"]);
          }
          await logAction({ action_type: "email_sent", contact_email: draft.contact_email, contact_name: draft.contact_name, deal_id: draft.deal_id, draft_id: id, subject: draft.subject, summary: `Sent email to ${draft.contact_email}`, metadata: { batch: true, message_id: r.message_id || null } });
          await markContactedAfterSend(draft, r.message_id || null);
          results.push({ id, ok: true, message_id: r.message_id });
        } catch (e) {
          results.push({ id, ok: false, error: String(e?.message || e) });
        }
      }
      return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Read activity log
    if (action === "log_list") {
      const limit = Math.min(Number(body.limit) || 100, 500);
      const filterType = body.action_type;
      const filterEmail = body.contact_email;
      let q = supabase.from("action_log").select("*").order("occurred_at", { ascending: false }).limit(limit);
      if (filterType) q = q.eq("action_type", filterType);
      if (filterEmail) q = q.eq("contact_email", filterEmail);
      const { data, error } = await q;
      if (error) throw error;
      return new Response(JSON.stringify({ entries: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("drafts-admin error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
