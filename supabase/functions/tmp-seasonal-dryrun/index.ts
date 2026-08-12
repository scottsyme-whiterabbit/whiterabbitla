import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const res = await fetch(
    "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/seasonal-campaign-process",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-import-token": Deno.env.get("EXTERNAL_IMPORT_TOKEN") ?? "",
      },
      body: JSON.stringify({ dry_run: true }),
    },
  );
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
});
