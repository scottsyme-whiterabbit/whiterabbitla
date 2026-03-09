import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
  0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

serve(async (req) => {
  const url = new URL(req.url);
  const contactId = url.searchParams.get("cid");
  const step = parseInt(url.searchParams.get("step") || "0", 10);
  const campaignId = url.searchParams.get("cam") || null;
  const userAgent = req.headers.get("user-agent") || null;

  if (contactId) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Insert open record
      await supabase.from("newsletter_opens").insert({
        contact_id: contactId,
        drip_step: step,
        campaign_id: campaignId,
        user_agent: userAgent,
      });

      // Count total opens for this contact
      const { count: openCount } = await supabase
        .from("newsletter_opens")
        .select("*", { count: "exact", head: true })
        .eq("contact_id", contactId);

      const totalOpens = openCount || 1;

      // Status escalation based on opens
      if (totalOpens >= 5) {
        // 5+ opens: escalate to hot (from new or warm)
        await supabase
          .from("newsletter_contacts")
          .update({ engagement_status: "hot" })
          .eq("id", contactId)
          .in("engagement_status", ["new", "warm"]);
      } else if (totalOpens >= 3) {
        // 3+ opens: escalate to warm (from new only)
        await supabase
          .from("newsletter_contacts")
          .update({ engagement_status: "warm" })
          .eq("id", contactId)
          .in("engagement_status", ["new"]);
      }
    } catch (e) {
      console.error("track-open error:", e);
    }
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});
