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
            unique.map((c: { email: string; name?: string; company?: string; city?: string; source?: string }) => ({
              email: c.email.toLowerCase().trim(),
              name: c.name?.trim() || null,
              company: c.company?.trim() || null,
              city: c.city?.trim() || null,
              source: c.source || "csv",
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
        const { error: delErr } = await supabase.from("newsletter_contacts").delete().eq("id", contactId);
        if (delErr) throw delErr;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_campaign": {
        const { campaignId } = payload;
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
        const { data: sends, error: sendsErr } = await supabase
          .from("newsletter_send_log")
          .select("campaign_id, sent_at, contact_id")
          .order("sent_at", { ascending: false })
          .limit(2000);
        if (sendsErr) throw sendsErr;
        return new Response(JSON.stringify({ sends: sends || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_opens_log": {
        const { data: opensData, error: opensErr2 } = await supabase
          .from("newsletter_opens")
          .select("contact_id, opened_at, drip_step")
          .order("opened_at", { ascending: false })
          .limit(2000);
        if (opensErr2) throw opensErr2;
        return new Response(JSON.stringify({ opens: opensData || [] }), {
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
        const { data: contactData } = await supabase
          .from("newsletter_contacts")
          .select("drip_campaign, subscribed, engagement_status");

        const { count: campaignCount } = await supabase
          .from("newsletter_campaigns")
          .select("*", { count: "exact", head: true });

        const { data: sendData } = await supabase
          .from("newsletter_send_log")
          .select("campaign_id");

        const contacts = contactData || [];
        const sends = sendData || [];

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

        return new Response(JSON.stringify({
          subscribers: contacts.filter((c: { subscribed: boolean }) => c.subscribed).length,
          campaigns: campaignCount || 0,
          emailsSent: sends.length,
          planner: buildCampaignStats("planner"),
          resident: buildCampaignStats("resident"),
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
