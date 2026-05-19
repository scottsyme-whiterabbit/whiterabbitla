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
    const { action, adminPassword, ...payload } = await req.json();

    if (adminPassword !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "import_contacts": {
        const { contacts } = payload;
        if (!contacts?.length) {
          return new Response(JSON.stringify({ error: "No contacts provided" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Deduplicate within the batch (keep first occurrence)
        const seen = new Set<string>();
        const unique = contacts.filter((c: { email: string }) => {
          const email = c.email.toLowerCase().trim();
          if (seen.has(email)) return false;
          seen.add(email);
          return true;
        });

        // Upsert deduplicated contacts
        const { data, error } = await supabase
          .from("newsletter_contacts")
          .upsert(
            unique.map((c: { email: string; name?: string; company?: string; city?: string; source?: string; phone?: string; drip_campaign?: string }) => ({
              email: c.email.toLowerCase().trim(),
              name: c.name?.trim() || null,
              company: c.company?.trim() || null,
              city: c.city?.trim() || null,
              source: c.source || "csv",
              phone: c.phone?.trim() || null,
              drip_campaign: c.drip_campaign || "welcome",
              subscribed: true,
            })),
            { onConflict: "email" }
          )
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ imported: data?.length || 0, duplicatesSkipped: contacts.length - unique.length }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contacts_full": {
        const { data, error } = await supabase
          .from("newsletter_contacts")
          .select("id, email, name, company, city, source, subscribed, drip_campaign, drip_step, engagement_status, reply_detected, last_emailed_at, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ contacts: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contacts": {
        const { data, error } = await supabase
          .from("newsletter_contacts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ contacts: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_campaigns": {
        const { data, error } = await supabase
          .from("newsletter_campaigns")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ campaigns: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "save_campaign": {
        const { campaign } = payload;
        if (campaign.id) {
          const { data, error } = await supabase
            .from("newsletter_campaigns")
            .update({
              subject: campaign.subject,
              body_html: campaign.body_html,
              body_preview: campaign.body_preview,
              status: campaign.status || "draft",
              campaign_type: campaign.campaign_type || "broadcast",
              drip_step: campaign.drip_step,
            })
            .eq("id", campaign.id)
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ campaign: data }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const { data, error } = await supabase
            .from("newsletter_campaigns")
            .insert({
              subject: campaign.subject,
              body_html: campaign.body_html,
              body_preview: campaign.body_preview,
              status: "draft",
              campaign_type: campaign.campaign_type || "broadcast",
              drip_step: campaign.drip_step,
            })
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ campaign: data }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "delete_contact": {
        const { contactId } = payload;
        if (!contactId) {
          return new Response(JSON.stringify({ error: "contactId required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Delete related records first, then the contact
        await supabase.from("newsletter_clicks").delete().eq("contact_id", contactId);
        await supabase.from("newsletter_opens").delete().eq("contact_id", contactId);
        await supabase.from("newsletter_send_log").delete().eq("contact_id", contactId);
        await supabase.from("email_bounces").delete().eq("contact_id", contactId);
        const { error: delErr } = await supabase.from("newsletter_contacts").delete().eq("id", contactId);
        if (delErr) throw delErr;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_campaign": {
        const { campaignId } = payload;
        // Delete related opens that reference this campaign first
        await supabase.from("newsletter_opens").delete().eq("campaign_id", campaignId);
        const { error } = await supabase
          .from("newsletter_campaigns")
          .delete()
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contact_clicks": {
        const { contactId } = payload;
        if (!contactId) {
          return new Response(JSON.stringify({ error: "contactId required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: clicks, error: clicksErr } = await supabase
          .from("newsletter_clicks")
          .select("id, link_slug, drip_step, clicked_at")
          .eq("contact_id", contactId)
          .order("clicked_at", { ascending: false });
        if (clicksErr) throw clicksErr;

        const { data: opens, error: opensErr } = await supabase
          .from("newsletter_opens")
          .select("id, drip_step, opened_at, user_agent")
          .eq("contact_id", contactId)
          .order("opened_at", { ascending: false });
        if (opensErr) throw opensErr;

        return new Response(JSON.stringify({ clicks: clicks || [], opens: opens || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_send_log": {
        let allSends: { campaign_id: string; sent_at: string; contact_id: string }[] = [];
        let page = 0;
        const PAGE = 1000;
        while (true) {
          const { data: batch, error } = await supabase
            .from("newsletter_send_log")
            .select("campaign_id, sent_at, contact_id")
            .order("sent_at", { ascending: false })
            .range(page * PAGE, (page + 1) * PAGE - 1);
          if (error) throw error;
          if (!batch || batch.length === 0) break;
          allSends = allSends.concat(batch);
          if (batch.length < PAGE) break;
          page++;
          if (page > 50) break;
        }
        return new Response(JSON.stringify({ sends: allSends }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_opens_log": {
        let allOpens: { contact_id: string; opened_at: string; drip_step: number }[] = [];
        let page = 0;
        const PAGE = 1000;
        while (true) {
          const { data: batch, error } = await supabase
            .from("newsletter_opens")
            .select("contact_id, opened_at, drip_step")
            .order("opened_at", { ascending: false })
            .range(page * PAGE, (page + 1) * PAGE - 1);
          if (error) throw error;
          if (!batch || batch.length === 0) break;
          allOpens = allOpens.concat(batch);
          if (batch.length < PAGE) break;
          page++;
          if (page > 50) break;
        }
        return new Response(JSON.stringify({ opens: allOpens }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_clicks_log": {
        let allClicks: { contact_id: string; clicked_at: string; drip_step: number; link_slug: string }[] = [];
        let page = 0;
        const PAGE = 1000;
        while (true) {
          const { data: batch, error } = await supabase
            .from("newsletter_clicks")
            .select("contact_id, clicked_at, drip_step, link_slug")
            .order("clicked_at", { ascending: false })
            .range(page * PAGE, (page + 1) * PAGE - 1);
          if (error) throw error;
          if (!batch || batch.length === 0) break;
          allClicks = allClicks.concat(batch);
          if (batch.length < PAGE) break;
          page++;
          if (page > 50) break;
        }
        return new Response(JSON.stringify({ clicks: allClicks }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_opened_contact_ids": {
        const { data: opens, error: opensErr } = await supabase
          .from("newsletter_opens")
          .select("contact_id");
        if (opensErr) throw opensErr;
        const uniqueIds = [...new Set((opens || []).map((o: { contact_id: string }) => o.contact_id))];
        return new Response(JSON.stringify({ contactIds: uniqueIds }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_stats": {
        // Fetch all newsletter_contacts with pagination to bypass 1000-row default
        let allContacts: { drip_campaign: string; subscribed: boolean; engagement_status: string }[] = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        while (true) {
          const { data: batch } = await supabase
            .from("newsletter_contacts")
            .select("drip_campaign, subscribed, engagement_status")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          allContacts = allContacts.concat(batch);
          if (batch.length < PAGE_SIZE) break;
          page++;
        }

        const { count: campaignCount } = await supabase
          .from("newsletter_campaigns")
          .select("*", { count: "exact", head: true });

        // Fetch all send_log with pagination
        let allSends: { campaign_id: string }[] = [];
        page = 0;
        while (true) {
          const { data: batch } = await supabase
            .from("newsletter_send_log")
            .select("campaign_id")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          allSends = allSends.concat(batch);
          if (batch.length < PAGE_SIZE) break;
          page++;
        }

        const contacts = allContacts;
        const sends = allSends;

        const buildCampaignStats = (prefix: string) => {
          const cc = contacts.filter((c: { drip_campaign: string }) => c.drip_campaign.startsWith(prefix));
          const active = cc.filter((c: { subscribed: boolean }) => c.subscribed);
          return {
            subscribers: active.length,
            unsubscribed: cc.filter((c: { subscribed: boolean }) => !c.subscribed).length,
            emailsSent: sends.filter((s: { campaign_id: string }) => s.campaign_id.startsWith(prefix)).length,
            hot: active.filter((c: { engagement_status: string }) => c.engagement_status === "hot").length,
            warm: active.filter((c: { engagement_status: string }) => c.engagement_status === "warm").length,
          };
        };

        // Cold campaign stats from cold_email_campaigns table (paginated)
        let allColdData: { campaign_category: string; status: string }[] = [];
        page = 0;
        while (true) {
          const { data: batch } = await supabase
            .from("cold_email_campaigns")
            .select("campaign_category, status")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          allColdData = allColdData.concat(batch);
          if (batch.length < PAGE_SIZE) break;
          page++;
        }
        const coldContacts = allColdData;

        const buildColdStats = (category: string) => {
          const cc = coldContacts.filter((c: { campaign_category: string }) => c.campaign_category === category);
          return {
            total: cc.length,
            active: cc.filter((c: { status: string }) => c.status === "active").length,
            paused: cc.filter((c: { status: string }) => c.status === "paused").length,
            replied: cc.filter((c: { status: string }) => c.status === "replied").length,
            completed: cc.filter((c: { status: string }) => c.status === "completed").length,
          };
        };

        // Orphan lead table counts
        const [
          { count: consultationCount },
          { count: quizCount },
          { count: magnetCount },
        ] = await Promise.all([
          supabase.from("consultation_leads").select("*", { count: "exact", head: true }),
          supabase.from("discovery_quiz_leads").select("*", { count: "exact", head: true }),
          supabase.from("lead_magnet_signups").select("*", { count: "exact", head: true }),
        ]);

        const totalNewsletterContacts = contacts.length;
        const totalSendable = contacts.filter(
          (c: { subscribed: boolean; engagement_status: string }) =>
            c.subscribed && c.engagement_status !== "bounced"
        ).length;

        return new Response(JSON.stringify({
          subscribers: contacts.filter((c: { subscribed: boolean }) => c.subscribed).length,
          totalNewsletterContacts,
          totalSendable,
          campaigns: campaignCount || 0,
          emailsSent: sends.length,
          planner: buildCampaignStats("planner"),
          resident: buildCampaignStats("resident"),
          cold_corporate: buildColdStats("corporate_planner"),
          cold_wedding: buildColdStats("wedding_planner"),
          cold_club: buildColdStats("country_club"),
          cold_pr: buildColdStats("pr_agency"),
          cold_nonprofit: buildColdStats("nonprofit"),
          cold_talent: buildColdStats("talent"),
          cold_nightlife: buildColdStats("nightlife"),
          cold_spirits: buildColdStats("spirits"),
          cold_restaurant: buildColdStats("restaurant"),
          cold_charity_golf: buildColdStats("charity_golf"),
          orphan_leads: {
            consultation_leads: consultationCount || 0,
            discovery_quiz_leads: quizCount || 0,
            lead_magnet_signups: magnetCount || 0,
          },
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deals": {
        const { data, error } = await supabase
          .from("deals")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ deals: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_deal": {
        const { deal } = payload;
           const { data, error } = await supabase
          .from("deals")
          .insert({
            contact_email: deal.contact_email,
            contact_name: deal.contact_name || null,
            company: deal.company || null,
            phone: deal.phone || null,
            event_type: deal.event_type || null,
            event_date: deal.event_date || null,
            event_time: deal.event_time || null,
            location: deal.location || null,
            guest_count: deal.guest_count || null,
            deal_value: deal.deal_value || null,
            stage: deal.stage || "new",
            notes: deal.notes || null,
            next_follow_up: deal.next_follow_up || null,
            source: deal.source || null,
            lost_reason: deal.lost_reason || null,
          })
          .select()
          .single();
        if (error) throw error;

        // Also upsert into newsletter_contacts so pipeline leads are tracked
        await supabase
          .from("newsletter_contacts")
          .upsert(
            {
              email: deal.contact_email.toLowerCase().trim(),
              name: deal.contact_name || null,
              company: deal.company || null,
              source: "pipeline",
              drip_campaign: "welcome",
              drip_step: 0,
              subscribed: true,
            },
            { onConflict: "email", ignoreDuplicates: true }
          );

        return new Response(JSON.stringify({ deal: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_deal": {
        const { deal } = payload;
        const { data, error } = await supabase
          .from("deals")
          .update({
            contact_email: deal.contact_email,
            contact_name: deal.contact_name || null,
            company: deal.company || null,
            phone: deal.phone || null,
            event_type: deal.event_type || null,
            event_date: deal.event_date || null,
            event_time: deal.event_time || null,
            location: deal.location || null,
            guest_count: deal.guest_count || null,
            deal_value: deal.deal_value || null,
            stage: deal.stage || "new",
            notes: deal.notes || null,
            next_follow_up: deal.next_follow_up || null,
            source: deal.source || null,
            lost_reason: deal.lost_reason || null,
          })
          .eq("id", deal.id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ deal: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_deal_stage": {
        const { dealId, stage } = payload;
        const { error } = await supabase
          .from("deals")
          .update({ stage })
          .eq("id", dealId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_deal": {
        const { dealId } = payload;
        const { error } = await supabase
          .from("deals")
          .delete()
          .eq("id", dealId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "log_outreach": {
        const { entry } = payload;
        // Insert into outreach_log
        const { error: logErr } = await supabase
          .from("outreach_log")
          .insert({
            contact_email: entry.contact_email.toLowerCase().trim(),
            contact_name: entry.contact_name || null,
            action_type: entry.action_type || "call",
            notes: entry.notes || null,
            outcome: entry.outcome || null,
          });
        if (logErr) throw logErr;

        // Update deal if exists
        if (entry.deal_id) {
          const updates: Record<string, unknown> = {
            last_outreach_date: new Date().toISOString(),
            outreach_notes: entry.notes || null,
          };
          if (entry.outcome) updates.outreach_status = entry.outcome === "booked" ? "booked" : entry.outcome === "not_interested" ? "not_interested" : entry.outcome === "connected" ? "connected" : entry.outcome === "follow_up" ? "follow_up_scheduled" : "attempted";
          if (entry.follow_up_date) updates.next_follow_up = entry.follow_up_date;
          await supabase.from("deals").update(updates).eq("id", entry.deal_id);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_outreach_log": {
        const { email } = payload;
        let query = supabase.from("outreach_log").select("*").order("created_at", { ascending: false });
        if (email) query = query.eq("contact_email", email.toLowerCase().trim());
        else query = query.limit(500);
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ logs: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_action_list_data": {
        // Get deals, hot/warm contacts, and outreach logs in one call
        const [dealsRes, contactsRes, logsRes] = await Promise.all([
          supabase.from("deals").select("*").not("stage", "in", "(completed,lost)").order("created_at", { ascending: false }),
          supabase.from("newsletter_contacts").select("id, email, name, company, source, drip_campaign, drip_step, engagement_status, subscribed, created_at, phone").in("engagement_status", ["hot", "warm"]).eq("subscribed", true).order("created_at", { ascending: false }),
          supabase.from("outreach_log").select("*").order("created_at", { ascending: false }).limit(1000),
        ]);
        if (dealsRes.error) throw dealsRes.error;
        if (contactsRes.error) throw contactsRes.error;
        if (logsRes.error) throw logsRes.error;

        return new Response(JSON.stringify({
          deals: dealsRes.data || [],
          hotWarmContacts: contactsRes.data || [],
          outreachLogs: logsRes.data || [],
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════
      // COLD EMAIL CAMPAIGNS
      // ═══════════════════════════════════════════════

      case "get_cold_campaigns": {
        const { category } = payload;
        if (category === "spirits") {
          const { data, error } = await supabase
            .from("newsletter_contacts")
            .select("email, name, company, phone, created_at")
            .eq("drip_campaign", "cold_spirits");
          if (error) return new Response(JSON.stringify({ error: error.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
          const mapped = (data || []).map((c: { email: string; name: string | null; company: string | null; phone: string | null; created_at: string }) => ({
            email: c.email,
            name: c.name || null,
            company: c.company || null,
            phone: c.phone || null,
            campaign_category: "spirits",
            status: "active",
            current_step: 0,
            created_at: c.created_at,
          }));
          return new Response(JSON.stringify({ campaigns: mapped }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Default: get all campaigns from cold_email_campaigns + spirits from newsletter_contacts
        const [coldRes, spiritsRes] = await Promise.all([
          supabase.from("cold_email_campaigns").select("*").order("created_at", { ascending: false }),
          supabase.from("newsletter_contacts").select("email, name, company, phone, created_at, drip_step, subscribed").eq("drip_campaign", "cold_spirits"),
        ]);
        if (coldRes.error) throw coldRes.error;
        const spiritsData = (spiritsRes.data || []).map((c: { email: string; name: string | null; company: string | null; phone: string | null; created_at: string; drip_step: number; subscribed: boolean }) => ({
          email: c.email,
          name: c.name || null,
          company: c.company || null,
          phone: c.phone || null,
          campaign_category: "spirits",
          status: c.subscribed ? "active" : "paused",
          current_step: c.drip_step || 0,
          created_at: c.created_at,
        }));
        const allCampaigns = [...(coldRes.data || []), ...spiritsData];
        return new Response(JSON.stringify({ campaigns: allCampaigns }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_cold_campaign": {
        const { campaign } = payload;
        if (!campaign?.email) {
          return new Response(JSON.stringify({ error: "Email required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase
          .from("cold_email_campaigns")
          .insert({
            email: campaign.email.toLowerCase().trim(),
            name: campaign.name?.trim() || null,
            company: campaign.company?.trim() || null,
            phone: campaign.phone?.trim() || null,
            campaign_category: campaign.campaign_category,
            status: "active",
            current_step: 0,
          })
          .select()
          .single();
        if (error) {
          if (error.code === "23505") {
            const { data: existing } = await supabase
              .from("cold_email_campaigns")
              .select("campaign_category, status, name, company")
              .eq("email", campaign.email.toLowerCase().trim())
              .limit(5);
            const categories = (existing || []).map((e: { campaign_category: string; status: string }) => `${e.campaign_category} (${e.status})`).join(", ");
            return new Response(JSON.stringify({
              error: `Already in campaign: ${categories || "unknown"}`,
              existing,
            }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw error;
        }
        return new Response(JSON.stringify({ campaign: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_cold_campaign_status": {
        const { campaignId, status } = payload;
        const { error } = await supabase
          .from("cold_email_campaigns")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_update_drip_campaign": {
        const { emails, drip_campaign } = payload;
        if (!emails?.length || !drip_campaign) {
          return new Response(JSON.stringify({ error: "emails and drip_campaign required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const normalized = emails.map((e: string) => e.toLowerCase().trim());
        const { data: updated, error: bulkErr } = await supabase
          .from("newsletter_contacts")
          .update({ drip_campaign })
          .in("email", normalized)
          .select("id");
        if (bulkErr) throw bulkErr;
        return new Response(JSON.stringify({ updated: updated?.length || 0 }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_add_cold_campaigns": {
        const { emails, campaign_category } = payload;
        if (!emails?.length || !campaign_category) {
          return new Response(JSON.stringify({ error: "emails and campaign_category required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim());

        // Look up contacts to get name/company
        const { data: contactsLookup } = await supabase
          .from("newsletter_contacts")
          .select("email, name, company")
          .in("email", normalizedEmails);
        const contactMap = new Map((contactsLookup || []).map((c: { email: string; name: string | null; company: string | null }) => [c.email, c]));

        const rows = normalizedEmails.map((email: string) => {
          const contact = contactMap.get(email);
          return {
            email,
            name: contact?.name || null,
            company: contact?.company || null,
            campaign_category,
            status: "active",
            current_step: 0,
          };
        });

        const { data: enrolled, error: bulkColdErr } = await supabase
          .from("cold_email_campaigns")
          .upsert(rows, { onConflict: "email" })
          .select("id");
        if (bulkColdErr) throw bulkColdErr;
        return new Response(JSON.stringify({ enrolled: enrolled?.length || 0 }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_cold_campaign": {
        const { campaignId } = payload;
        const { error } = await supabase
          .from("cold_email_campaigns")
          .delete()
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "global_search": {
        const { query } = payload;
        if (!query || query.length < 2) {
          return new Response(JSON.stringify({ contacts: [], deals: [], cold: [] }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const q = `%${query.toLowerCase()}%`;
        const [contactsRes, dealsRes, coldRes] = await Promise.all([
          supabase.from("newsletter_contacts")
            .select("id, email, name, company, drip_campaign, engagement_status")
            .or(`email.ilike.${q},name.ilike.${q},company.ilike.${q}`)
            .limit(10),
          supabase.from("deals")
            .select("id, contact_email, contact_name, company, stage, event_type, source")
            .or(`contact_email.ilike.${q},contact_name.ilike.${q},company.ilike.${q}`)
            .limit(10),
          supabase.from("cold_email_campaigns")
            .select("id, email, name, company, campaign_category, status")
            .or(`email.ilike.${q},name.ilike.${q},company.ilike.${q}`)
            .limit(10),
        ]);
        return new Response(JSON.stringify({
          contacts: contactsRes.data || [],
          deals: dealsRes.data || [],
          cold: coldRes.data || [],
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_dashboard_summary": {
        const today = new Date().toISOString().split("T")[0];
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [dealsRes, recentInquiries, recentQuiz, recentConsultations,
               bouncesTotal, bounces30d, unsubsTotal, unsubs30d, totalContacts, totalSent] = await Promise.all([
          supabase.from("deals")
            .select("id, next_follow_up, source, stage")
            .not("stage", "in", "(lost,completed)"),
          supabase.from("contact_inquiries")
            .select("id, name, email, event_type, created_at")
            .gte("created_at", last24h)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("discovery_quiz_leads")
            .select("id, name, email, recommendation, created_at")
            .gte("created_at", last24h)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("consultation_leads")
            .select("id, name, email, event_type, created_at")
            .gte("created_at", last24h)
            .order("created_at", { ascending: false })
            .limit(10),
          // Email health: total bounces
          supabase.from("email_bounces").select("id", { count: "exact", head: true }),
          // Bounces in last 30 days
          supabase.from("email_bounces").select("id", { count: "exact", head: true }).gte("created_at", last30d),
          // Total unsubscribed contacts
          supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).eq("subscribed", false),
          // Unsubscribed in last 30 days (approximation: updated_at recent + unsubscribed)
          supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).eq("subscribed", false).gte("updated_at", last30d),
          // Total contacts for rate calc
          supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }),
          // Total sent for bounce rate
          supabase.from("newsletter_send_log").select("id", { count: "exact", head: true }),
        ]);

        const deals = dealsRes.data || [];
        const dueToday = deals.filter(d => d.next_follow_up === today).length;
        const overdue = deals.filter(d => d.next_follow_up && d.next_follow_up < today).length;

        // Source attribution from ALL deals (including completed)
        const { data: allDeals } = await supabase.from("deals").select("source, stage");
        const sourceCounts: Record<string, number> = {};
        (allDeals || []).forEach(d => {
          const src = d.source || "Unknown";
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });

        return new Response(JSON.stringify({
          dueToday,
          overdue,
          recentInquiries: recentInquiries.data?.length || 0,
          recentQuiz: recentQuiz.data?.length || 0,
          recentConsultations: recentConsultations.data?.length || 0,
          recentInquiriesList: recentInquiries.data || [],
          recentQuizList: recentQuiz.data || [],
          recentConsultationsList: recentConsultations.data || [],
          sourceCounts,
          emailHealth: {
            bouncesTotal: bouncesTotal.count || 0,
            bounces30d: bounces30d.count || 0,
            unsubsTotal: unsubsTotal.count || 0,
            unsubs30d: unsubs30d.count || 0,
            totalContacts: totalContacts.count || 0,
            totalSent: totalSent.count || 0,
          },
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_lead_attribution": {
        const [dealsRes, inquiriesRes, consultationsRes, quizRes, closedRes] = await Promise.all([
          supabase.from("deals").select("id, source, stage, deal_value, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("contact_inquiries").select("id, source, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("consultation_leads").select("id, source, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("discovery_quiz_leads").select("id, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("deals").select("id, contact_name, contact_email, company, event_type, event_date, deal_value, source, location, notes, created_at").eq("stage", "completed").order("event_date", { ascending: false }).limit(200),
        ]);
        return new Response(JSON.stringify({
          deals: dealsRes.data || [],
          inquiries: inquiriesRes.data || [],
          consultations: consultationsRes.data || [],
          quizLeads: quizRes.data || [],
          closedDeals: closedRes.data || [],
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "log_closed_deal": {
        const { contact_name, contact_email, company, event_type, event_date, deal_value, source, location, notes } = payload;
        if (!contact_name || !source) {
          return new Response(JSON.stringify({ error: "Name and source are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase.from("deals").insert({
          contact_name: contact_name as string,
          contact_email: (contact_email as string) || `${(contact_name as string).toLowerCase().replace(/\s+/g, '.')}@manual.entry`,
          company: company as string || null,
          event_type: event_type as string || null,
          event_date: event_date as string || null,
          deal_value: deal_value ? Number(deal_value) : null,
          source: source as string,
          location: location as string || null,
          notes: notes as string || null,
          stage: "completed",
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ deal: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_nurture_campaigns": {
        const { category } = payload;
        let query = supabase
          .from("cold_email_campaigns")
          .select("id, email, name, company, phone, campaign_category, status, nurture_step, nurture_status, nurture_started_at, nurture_last_sent_at, created_at")
          .eq("status", "completed");
        if (category) {
          query = query.eq("campaign_category", category);
        }
        const { data, error } = await query.order("nurture_last_sent_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        return new Response(JSON.stringify({ campaigns: data || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "mark_cold_reply": {
        const { email: replyEmail } = payload;
        if (!replyEmail) {
          return new Response(JSON.stringify({ error: "email required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: coldReplyContact } = await supabase
          .from("cold_email_campaigns")
          .select("id, email, name, company, campaign_category, status, current_step")
          .eq("email", (replyEmail as string).toLowerCase())
          .maybeSingle();

        if (!coldReplyContact) {
          return new Response(JSON.stringify({ error: "Cold contact not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (coldReplyContact.status === "active") {
          const { error: updateErr } = await supabase
            .from("cold_email_campaigns")
            .update({ status: "replied", updated_at: new Date().toISOString() })
            .eq("id", coldReplyContact.id);
          if (updateErr) throw updateErr;

          const { error: dealErr } = await supabase.from("deals").insert({
            contact_name: coldReplyContact.name,
            contact_email: coldReplyContact.email,
            company: coldReplyContact.company,
            source: "cold_outreach",
            stage: "new",
            notes: `Cold contact replied to drip email step ${coldReplyContact.current_step} campaign ${coldReplyContact.campaign_category}.`,
          });
          if (dealErr) throw dealErr;

          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "White Rabbit System <scott.syme@whiterabbitla.com>",
                to: ["scott.syme@whiterabbitla.com"],
                subject: `💬 Cold Lead Replied: ${coldReplyContact.email}`,
                html: `<p>A cold outreach contact replied!</p>
<p><strong>Name:</strong> ${coldReplyContact.name || "Unknown"}</p>
<p><strong>Email:</strong> ${coldReplyContact.email}</p>
<p><strong>Company:</strong> ${coldReplyContact.company || "Unknown"}</p>
<p><strong>Campaign:</strong> ${coldReplyContact.campaign_category}</p>
<p><strong>Step:</strong> ${coldReplyContact.current_step}</p>
<p><strong>Follow up immediately!</strong></p>`,
              }),
            });
          }
        } else {
          const { error: updateErr2 } = await supabase
            .from("cold_email_campaigns")
            .update({ status: "replied", updated_at: new Date().toISOString() })
            .eq("id", coldReplyContact.id);
          if (updateErr2) throw updateErr2;
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_nurture_status": {
        const { campaignId, nurture_status } = payload;
        const { error } = await supabase
          .from("cold_email_campaigns")
          .update({ nurture_status, updated_at: new Date().toISOString() })
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deal_inbox": {
        // Hot list: deals with recent inbound replies OR hot_signal, sorted by latest activity
        const { data: deals } = await supabase
          .from("deals")
          .select("id, contact_name, contact_email, company, stage, event_type, event_date, last_inbound_at, hot_signal, hot_reason, gmail_thread_id, calendar_event_id, deal_value, source")
          .order("last_inbound_at", { ascending: false, nullsFirst: false })
          .limit(200);
        return new Response(JSON.stringify({ deals: deals || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deal_threads": {
        const { deal_id } = payload;
        const { data: threads } = await supabase
          .from("deal_email_threads")
          .select("*")
          .eq("deal_id", deal_id)
          .order("last_message_at", { ascending: false });
        const { data: messages } = await supabase
          .from("deal_email_messages")
          .select("*")
          .eq("deal_id", deal_id)
          .order("sent_at", { ascending: true });
        const { data: activity } = await supabase
          .from("deal_activity")
          .select("*")
          .eq("deal_id", deal_id)
          .order("occurred_at", { ascending: false })
          .limit(50);
        return new Response(JSON.stringify({ threads: threads || [], messages: messages || [], activity: activity || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "trigger_gmail_sync": {
        const { deal_id } = payload;
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ adminPassword, deal_id }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "trigger_calendar_sync": {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ adminPassword }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_availability": {
        const { date } = payload;
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ date }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_gmail_reply": {
        const { deal_id, to, subject, body_text, gmail_thread_id } = payload;
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ adminPassword, deal_id, to, subject, body_text, gmail_thread_id }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("newsletter-admin error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
