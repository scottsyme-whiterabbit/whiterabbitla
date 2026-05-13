// Google Drive photo bank for Proposals + Ad Generator (admin-only).
// Actions:
//   GET  ?action=folders                          → list configured folders
//   GET  ?action=list&folderId=<id>               → list image files in folder
//   GET  ?action=image&fileId=<id>                → stream file binary (public, used by <img src>)
//   POST { op:"add", folder_id, label }           → add folder (admin token)
//   POST { op:"remove", id }                      → remove folder (admin token)
//   POST { op:"reorder", items:[{id,sort_order}]} → reorder (admin token)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? "";
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

function gwHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
    ...extra,
  };
}

function isAdmin(req: Request) {
  const t = req.headers.get("x-admin-password") ?? "";
  return ADMIN_PASSWORD.length > 0 && t === ADMIN_PASSWORD;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
      return json({ error: "Google Drive not configured" }, 500);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ---------- public-ish read endpoints (admin-only via token for write,
    // but reads are needed by <img> tag so stream is permissive) ----------
    if (req.method === "GET" && action === "image") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) return json({ error: "fileId required" }, 400);
      const r = await fetch(`${GATEWAY}/files/${encodeURIComponent(fileId)}?alt=media`, {
        headers: gwHeaders(),
      });
      if (!r.ok) return json({ error: `drive ${r.status}` }, r.status);
      const ct = r.headers.get("content-type") ?? "image/jpeg";
      return new Response(r.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": ct,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Admin-only beyond this point
    if (!isAdmin(req)) return json({ error: "unauthorized" }, 401);

    if (req.method === "GET" && action === "folders") {
      const { data, error } = await sb
        .from("drive_photo_folders")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ folders: data ?? [] });
    }

    if (req.method === "GET" && action === "list") {
      const folderId = url.searchParams.get("folderId");
      if (!folderId) return json({ error: "folderId required" }, 400);
      const q = encodeURIComponent(
        `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
      );
      const fields = encodeURIComponent("files(id,name,mimeType,thumbnailLink,modifiedTime)");
      const r = await fetch(
        `${GATEWAY}/files?q=${q}&fields=${fields}&pageSize=200&orderBy=modifiedTime desc`,
        { headers: gwHeaders() },
      );
      const body = await r.json();
      if (!r.ok) return json({ error: body }, r.status);
      return json({ files: body.files ?? [] });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const op = body?.op;
      if (op === "add") {
        const folder_id = String(body.folder_id ?? "").trim();
        const label = String(body.label ?? "").trim();
        if (!folder_id || !label) return json({ error: "folder_id and label required" }, 400);
        // Try to extract from a pasted Drive URL
        const m = folder_id.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        const finalId = m ? m[1] : folder_id;
        const { data, error } = await sb
          .from("drive_photo_folders")
          .insert({ folder_id: finalId, label, sort_order: 0 })
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ folder: data });
      }
      if (op === "remove") {
        const id = String(body.id ?? "");
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await sb.from("drive_photo_folders").delete().eq("id", id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
      return json({ error: "unknown op" }, 400);
    }

    return json({ error: "not found" }, 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
