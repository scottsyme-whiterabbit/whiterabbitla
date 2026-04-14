import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = "wrm-k8T4xZqL9vN2pR7wJ5sY0mB3dF6g";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: check query param or Authorization header
  const url = new URL(req.url);
  const keyParam = url.searchParams.get("key") || "";
  const authHeader = req.headers.get("Authorization") || "";
  const bearerKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (keyParam !== API_KEY && bearerKey !== API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const segment = url.searchParams.get("segment") || "all";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. Get contacts for this segment
    let contactQuery = supabase
      .from("cold_email_campaigns")
      .select("id, email, name, company, status, current_step, campaign_category");

    if (segment !== "all") {
      contactQuery = contactQuery.eq("campaign_category", segment);
    }

    const { data: contacts, error: cErr } = await contactQuery;
    if (cErr) throw cErr;
    const allContacts = contacts || [];

    const activeContacts = allContacts.filter((c) => c.status === "active");
    const completedContacts = allContacts.filter((c) => c.status === "completed");

    // Step distribution
    const stepDist: Record<string, number> = { step_0: 0, step_1: 0, step_2: 0, step_3: 0, completed: completedContacts.length };
    for (const c of activeContacts) {
      const key = `step_${c.current_step}`;
      if (key in stepDist) stepDist[key]++;
    }

    // 2. 7-day metrics from related tables
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const contactEmails = allContacts.map((c) => c.email.toLowerCase());
    const contactIds = new Set<string>();

    // Look up newsletter_contacts ids for these emails (for opens/clicks)
    if (contactEmails.length > 0) {
      // Batch in groups of 100
      for (let i = 0; i < contactEmails.length; i += 100) {
        const batch = contactEmails.slice(i, i + 100);
        const { data: nc } = await supabase
          .from("newsletter_contacts")
          .select("id, email")
          .in("email", batch);
        if (nc) nc.forEach((r) => contactIds.add(r.id));
      }
    }

    const contactIdArr = Array.from(contactIds);

    // Opens in last 7d
    let openCount = 0;
    if (contactIdArr.length > 0) {
      for (let i = 0; i < contactIdArr.length; i += 100) {
        const batch = contactIdArr.slice(i, i + 100);
        const { count } = await supabase
          .from("newsletter_opens")
          .select("*", { count: "exact", head: true })
          .in("contact_id", batch)
          .gte("opened_at", sevenDaysAgo);
        openCount += count || 0;
      }
    }

    // Clicks in last 7d
    let clickCount = 0;
    if (contactIdArr.length > 0) {
      for (let i = 0; i < contactIdArr.length; i += 100) {
        const batch = contactIdArr.slice(i, i + 100);
        const { count } = await supabase
          .from("newsletter_clicks")
          .select("*", { count: "exact", head: true })
          .in("contact_id", batch)
          .gte("clicked_at", sevenDaysAgo);
        clickCount += count || 0;
      }
    }

    // Bounces in last 7d
    let bounceCount = 0;
    if (contactEmails.length > 0) {
      for (let i = 0; i < contactEmails.length; i += 100) {
        const batch = contactEmails.slice(i, i + 100);
        const { count } = await supabase
          .from("email_bounces")
          .select("*", { count: "exact", head: true })
          .in("email", batch)
          .gte("created_at", sevenDaysAgo);
        bounceCount += count || 0;
      }
    }

    // Replied contacts (status = 'replied') 
    const repliedContacts = allContacts.filter((c) => c.status === "replied");
    const recentReplies = repliedContacts.map((c) => ({
      contact_name: c.name || "Unknown",
      company: c.company || "Unknown",
      segment: c.campaign_category,
    }));

    // Unsubscribed
    const unsubCount = allContacts.filter((c) => c.status === "unsubscribed").length;

    // Estimate sent = active + completed + replied + bounced + unsubscribed (everyone who got at least one email)
    const sentEstimate = allContacts.filter((c) => c.status !== "paused" && c.current_step > 0).length;
    const deliveredEstimate = Math.max(0, sentEstimate - bounceCount);

    // 3. Alerts
    const alerts: string[] = [];
    if (sentEstimate > 0) {
      const bounceRate = bounceCount / sentEstimate;
      if (bounceRate > 0.05) alerts.push(`High bounce rate: ${(bounceRate * 100).toFixed(1)}%`);
      const openRate = sentEstimate > 0 ? openCount / sentEstimate : 0;
      if (openRate < 0.25 && sentEstimate >= 10) alerts.push(`Low open rate: ${(openRate * 100).toFixed(1)}%`);
    }

    // Spam complaints
    let complaintCount = 0;
    if (contactEmails.length > 0) {
      for (let i = 0; i < contactEmails.length; i += 100) {
        const batch = contactEmails.slice(i, i + 100);
        const { count } = await supabase
          .from("email_bounces")
          .select("*", { count: "exact", head: true })
          .in("email", batch)
          .eq("bounce_type", "complained");
        complaintCount += count || 0;
      }
    }
    if (complaintCount > 0) alerts.push(`Spam complaints detected: ${complaintCount}`);

    if (sentEstimate >= 30 && repliedContacts.length === 0) {
      alerts.push("Zero replies after 30+ sends");
    }

    const response = {
      segment,
      generated_at: new Date().toISOString(),
      total_contacts: allContacts.length,
      active_contacts: activeContacts.length,
      step_distribution: stepDist,
      metrics_7d: {
        sent: sentEstimate,
        delivered: deliveredEstimate,
        bounced: bounceCount,
        opened: openCount,
        clicked: clickCount,
        replied: repliedContacts.length,
        unsubscribed: unsubCount,
      },
      recent_replies: recentReplies,
      alerts,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("campaign-metrics error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
