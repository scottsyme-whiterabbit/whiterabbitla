import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://whiterabbitla.com";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get("cid");
    const step = url.searchParams.get("step");
    const redirect = url.searchParams.get("r");

    if (!redirect) {
      return new Response("Missing redirect", { status: 400 });
    }

    // Decode the redirect URL
    const redirectUrl = decodeURIComponent(redirect);

    // Log the click asynchronously (don't block the redirect)
    if (contactId && step) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Extract link slug from the redirect URL
      const linkSlug = redirectUrl.replace(SITE_URL, "").replace(/^\//, "");

      // Insert click record
      await supabase.from("newsletter_clicks").insert({
        contact_id: contactId,
        drip_step: parseInt(step),
        link_slug: linkSlug,
      });

      // Update engagement status to "warm" if currently "new"
      await supabase
        .from("newsletter_contacts")
        .update({ engagement_status: "warm" })
        .eq("id", contactId)
        .eq("engagement_status", "new");
    }

    // Redirect to the actual destination
    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  } catch (error) {
    console.error("track-click error:", error);
    // On error, still try to redirect if possible
    const url = new URL(req.url);
    const redirect = url.searchParams.get("r");
    if (redirect) {
      return new Response(null, {
        status: 302,
        headers: { Location: decodeURIComponent(redirect) },
      });
    }
    return new Response("Error", { status: 500 });
  }
});
