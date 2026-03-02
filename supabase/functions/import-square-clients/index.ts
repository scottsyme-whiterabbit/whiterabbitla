import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const clients = [
  { name: "Josh Taft", email: "josh.taft@gmail.com", company: null, event_type: "Private Party", notes: "OLA Mens Group Show" },
  { name: "John Schroder", email: "john.schroeder@pillartopost.com", company: null, event_type: "Private Party", notes: "Client Appreciation Party" },
  { name: "Alex Reilly", email: "areilly@gravitasclub.com", company: "Gravitas Beverly Hills", event_type: "Private Party", notes: "Gravitas Beverly Hills Birthday" },
  { name: "Geoffrey Frid", email: "gfrid92@aol.com", company: null, event_type: "Private Party", notes: "Beverlee's Birthday" },
  { name: "Barry Katzman", email: "bkatzman14@gmail.com", company: null, event_type: "Private Party", notes: "Birthday Party Magic Monte Coleman" },
  { name: "Kodiak Pictures", email: "thomas@kodiakpictures.com", company: "Kodiak Pictures", event_type: "Corporate", notes: "Kodiak Pictures Holiday Party" },
  { name: "Acacia Diaz", email: "acacia.diaz@tixr.com", company: "Tixr", event_type: "Corporate", notes: "Holiday Party" },
  { name: "Heather Scherbert", email: "heather.scherbert@gmail.com", company: null, event_type: "Private Party", notes: "Holiday Party" },
  { name: "Jeff Klonoff", email: "jklonoff@gmail.com", company: null, event_type: "Private Party", notes: "Friendsgiving Event" },
  { name: "Anna Okhovat", email: "anna@okhovatlawfirm.com", company: null, event_type: "Corporate", notes: "Okhovat Law Firm Holiday Party" },
  { name: "Grace Gaysasai", email: "grace@compositioncap.com", company: "Composition Capital", event_type: "Corporate", notes: "Holiday Party For Composition Capital" },
  { name: "Lindsey Ostrovsky", email: "lindsey@shannonwarnerevents.com", company: "Shannon Warner Events", event_type: "Corporate", notes: "Brittany Broski's Royal Court Season 3 Premiere" },
  { name: "Jonny Zara", email: "deathletterguitars@gmail.com", company: null, event_type: "Private Party", notes: "House Magic" },
  { name: "Spinoso Management", email: "spinoso@avidbill.com", company: "Ovation Hollywood", event_type: "Corporate", notes: "Ovation Hollywood Halloween Event" },
  { name: "Michael Royer", email: "michael@royerlawgrp.com", company: null, event_type: "Private Party", notes: "Holiday Party Magic" },
  { name: "Katherine Lehr", email: "klehr@blace.com", company: "BLACE", event_type: "Corporate", notes: "Morgan Stanley Event" },
  { name: "Sydney Null", email: "avenidacarrolltonlc@greystar.com", company: "Avenida Carrollton", event_type: "Corporate", notes: "Magic for Avenida Carrollton" },
  { name: "Lennard Macaranas", email: "unkieleroy@gmail.com", company: null, event_type: "Private Party", notes: "Prom Magic at Level" },
  { name: "Jerrin Bawa", email: "jerrin.bawa@gmail.com", company: null, event_type: "Wedding", notes: "Close Up Magic Wedding Magic" },
  { name: "Ana A", email: "agbayaniana@gmail.com", company: null, event_type: "Private Party", notes: "Birthday Magic" },
  { name: "Max Gore", email: "maxgore1@gmail.com", company: null, event_type: "Private Party", notes: "Lucian's Seventh Birthday Magic Show" },
  { name: "Kevin Robbins", email: "kdrobbins@yahoo.com", company: null, event_type: "Private Party", notes: "Kevin's Birthday-Gravitas Beverly Hills" },
  { name: "Rae Rockwell", email: "hello@raerockwellstudio.com", company: "Rae Rockwell Studio", event_type: "Corporate", notes: "Rivian Corporate Magic Event" },
  { name: "Cody Miller", email: "cody.miller@sunbit.com", company: "Sunbit", event_type: "Corporate", notes: "Sunbit Corporate Event Magic" },
  { name: "Jessica Arnold", email: "jessica@burlingamecc.org", company: "Burlingame Country Club", event_type: "Corporate", notes: "Father-Daughter Dinner Dance Magic" },
  { name: "Nida Lakhia", email: "nidalakhia@gmail.com", company: null, event_type: "Private Party", notes: "1st Magic Birthday" },
  { name: "Remy Bobo", email: "rbobo@blink49.com", company: null, event_type: "Corporate", notes: "Malibu Company Magic Event" },
  { name: "Lisa Walkowicz", email: "lwalkowicz@dopplerdrives.com", company: "AMCI Global", event_type: "Corporate", notes: "Doppler Automotive Event" },
  { name: "Alexander Dunne", email: "info@alexkazam.com", company: null, event_type: "Corporate", notes: "Corporate Private Magic Event" },
  { name: "Anila Tai", email: "tai.anila@gmail.com", company: null, event_type: "Private Party", notes: "80th Magic Birthday" },
  { name: "Linda Selfo", email: "linda.selfo@bozzuto.com", company: "Bozzuto / Anara Santa Monica", event_type: "Corporate", notes: "White Rabbit Entertainment (combined with Anara Santa Monica - $2750 total, update manually)" },
  { name: "Lisa Fogarty", email: "lmentevents@gmail.com", company: null, event_type: "Private Party", notes: "Costa Mesa Magic + Holiday Party" },
  { name: "Ingrid Manuel", email: "acevedostturnoverservicesinc@gmail.com", company: null, event_type: "Private Party", notes: "White Rabbit Entertainment" },
  { name: "Kim Mulier", email: "kim.mulier@genre.com", company: "GenRE", event_type: "Corporate", notes: "CAIP Golf Tournament" },
  { name: "Shelyn Nguyen", email: "vivi.nguyen123@gmail.com", company: null, event_type: "Private Party", notes: "Birthday Magic" },
  { name: "Kelly Saenz", email: "ksaenz@fosterall.org", company: "Foster All", event_type: "Corporate", notes: "Magic For Fosterall Gala" },
  { name: "Sarah Pereira", email: "srp15cc@gmail.com", company: null, event_type: "Private Party", notes: "Welcome Party & Cocktail Hour Magic" },
  { name: "Weston Manville", email: "wes.manville@gmail.com", company: "The Bachelors Organization", event_type: "Corporate", notes: "Bachelors Ball" },
  { name: "Binoj", email: "mynameisbinoj@gmail.com", company: null, event_type: "Private Party", notes: "Magic at Binoj's Birthday" },
  { name: "Rachel Haberman", email: "rachel@elitmg.com", company: null, event_type: "Private Party", notes: "White Rabbit Magic" },
  { name: "Marianna Olesijuk", email: "marianna@sterlingengagements.com", company: "Sterling Engagements Inc.", event_type: "Corporate", notes: "Hollywood Corporate Magic Event" },
  { name: "Tracie Royster", email: "tracielroyster@gmail.com", company: null, event_type: "Corporate", notes: "Strolling Magic for Corporate Party" },
  { name: "Houston Hospitality", email: "billing@houstonhospitalityla.com", company: "Black Rabbit Rose", event_type: "Corporate", notes: "Strolling Magic At Black Rabbit Rose" },
  { name: "Taylor Reagan", email: "taylor.reagan@pistoladenim.com", company: "Pistola Denim", event_type: "Corporate", notes: "Pistola Denim Holiday Party" },
  { name: "Nilufar Etemad", email: "nilufar.etemad@sentral.com", company: "Figueroa Eight", event_type: "Corporate", notes: "Party Magic Walk Around" },
  { name: "Living at NoHo", email: "linda.selfo@greystar.com", company: "Living At NoHo", event_type: "Corporate", notes: "Live At NoHo White Rabbit Event" },
  { name: "Tim Colbert", email: "timothy.colbert@epiqglobal.com", company: null, event_type: "Private Party", notes: "White Rabbit Holiday Brunch Magic" },
  { name: "Katie Cazorla", email: "katie@katiecazorla.com", company: "The Kookaburra Lounge", event_type: "Private Party", notes: "Halloween Party Magic Performances" },
  { name: "Kevin Mealia", email: "kevin.mealia@transamerica.com", company: "Transamerica", event_type: "Corporate", notes: "Corporate Event" },
  { name: "Yolanda Loza", email: "yloza3022@gmail.com", company: "Oak And Fig", event_type: "Private Party", notes: "Circa Magic Show" },
  { name: "Dionne Henry", email: "dionne.henry@associa.us", company: "Brookfield Ontario Ranch HOA", event_type: "Corporate", notes: "HOA Events" },
  { name: "Shoreline Gateway", email: "shorelinegateway@greystar.com", company: "Shoreline Gateway", event_type: "Corporate", notes: "White Rabbit Magic & Cocktail Experience" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminPassword } = await req.json();
    if (adminPassword !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get existing deal emails to skip duplicates
    const { data: existingDeals } = await supabase
      .from("deals")
      .select("contact_email")
      .eq("stage", "completed");

    const existingEmails = new Set(
      (existingDeals || []).map((d: { contact_email: string }) => d.contact_email.toLowerCase())
    );

    let imported = 0;
    let skipped = 0;
    const skippedNames: string[] = [];

    for (const c of clients) {
      const email = c.email.toLowerCase().trim();

      if (existingEmails.has(email)) {
        skipped++;
        skippedNames.push(c.name);
        continue;
      }

      // Insert deal
      const { error: dealErr } = await supabase.from("deals").insert({
        contact_email: email,
        contact_name: c.name,
        company: c.company,
        event_type: c.event_type,
        stage: "completed",
        deal_value: 0,
        source: "Square Import",
        post_show_step: 2,
        post_show_started_at: thirtyDaysAgo,
        notes: c.notes,
      });

      if (dealErr) {
        console.error(`Failed to insert deal for ${c.name}:`, dealErr);
        continue;
      }

      // Upsert into newsletter_contacts
      await supabase.from("newsletter_contacts").upsert(
        {
          email,
          name: c.name,
          company: c.company,
          source: "square_import",
          drip_campaign: "welcome",
          drip_step: 0,
          subscribed: true,
        },
        { onConflict: "email", ignoreDuplicates: true }
      );

      imported++;
      existingEmails.add(email); // prevent dupes within batch
    }

    return new Response(
      JSON.stringify({ imported, skipped, skippedNames }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
