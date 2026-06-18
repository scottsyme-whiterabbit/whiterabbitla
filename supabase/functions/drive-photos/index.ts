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
      const len = r.headers.get("content-length");
      const headers: Record<string, string> = {
        ...corsHeaders,
        "Content-Type": ct,
        // fileId is immutable; cache aggressively at the edge + browser
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
        "ETag": `"${fileId}"`,
      };
      if (len) headers["Content-Length"] = len;
      return new Response(r.body, { headers });
    }

    // Public: stream a previously-uploaded gallery file from private storage
    if (req.method === "GET" && action === "upload") {
      const path = url.searchParams.get("path");
      if (!path) return json({ error: "path required" }, 400);
      const { data: blob, error } = await sb.storage.from("gallery-uploads").download(path);
      if (error || !blob) return json({ error: error?.message ?? "not found" }, 404);
      const ct = blob.type || "application/octet-stream";
      return new Response(blob.stream(), {
        headers: {
          ...corsHeaders,
          "Content-Type": ct,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "ETag": `"${path}"`,
        },
      });
    }

    // Public: aggregated gallery feed — drive picks + uploads, merged by sort_order
    if (req.method === "GET" && action === "gallery") {
      const { data: gFolders, error: gErr } = await sb
        .from("drive_photo_folders")
        .select("folder_id,label,sort_order")
        .eq("is_gallery", true)
        .order("sort_order", { ascending: true });
      if (gErr) return json({ error: gErr.message }, 500);

      type Item = {
        key: string;
        source: "drive" | "upload";
        ref: string;
        src: string;
        thumb?: string;
        srcset?: string;
        blur?: string;
        poster?: string;
        name: string;
        mimeType: string;
        folder: string;
        sort_order: number;
        created_at: string;
        width?: number;
        height?: number;
      };
      const items: Item[] = [];
      const selfBase = `${SUPABASE_URL}/functions/v1/drive-photos`;

      const { data: allPicks } = await sb
        .from("drive_gallery_picks")
        .select("folder_id,file_id,created_at");
      const pickByFolder = new Map<string, Set<string>>();
      for (const p of allPicks ?? []) {
        if (!pickByFolder.has(p.folder_id)) pickByFolder.set(p.folder_id, new Set());
        pickByFolder.get(p.folder_id)!.add(p.file_id);
      }

      const { data: orderRows } = await sb
        .from("gallery_order")
        .select("source,ref,sort_order");
      const orderIndex = new Map<string, number>();
      for (const o of orderRows ?? []) {
        orderIndex.set(`${o.source}:${o.ref}`, o.sort_order ?? 0);
      }

      // Rewrite Drive thumbnailLink (=sNNN) to any width — served from Google CDN.
      // Append `-rw` to request WebP encoding (smaller payload than JPEG).
      const sizedThumb = (link: string, size: number, webp = true) =>
        link.replace(/=s\d+(-[a-z0-9]+)?$/i, `=s${size}${webp ? "-rw" : ""}`);

      for (const f of gFolders ?? []) {
        const pickSet = pickByFolder.get(f.folder_id) ?? new Set<string>();
        const q = encodeURIComponent(
          `'${f.folder_id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`,
        );
        const fields = encodeURIComponent(
          "files(id,name,mimeType,modifiedTime,thumbnailLink,imageMediaMetadata(width,height),videoMediaMetadata(width,height))",
        );
        const r = await fetch(
          `${GATEWAY}/files?q=${q}&fields=${fields}&pageSize=200&orderBy=modifiedTime desc`,
          { headers: gwHeaders() },
        );
        const body = await r.json();
        if (r.ok && Array.isArray(body.files)) {
          for (const file of body.files) {
            if (!pickSet.has(file.id)) continue;
            const meta = file.imageMediaMetadata ?? file.videoMediaMetadata ?? {};
            const isVideo = String(file.mimeType ?? "").startsWith("video/");
            const link: string | undefined = file.thumbnailLink;
            const thumb = link ? sizedThumb(link, 640) : undefined;
            const srcset = link
              ? [320, 480, 640, 960, 1280, 1600]
                  .map((s) => `${sizedThumb(link, s)} ${s}w`)
                  .join(", ")
              : undefined;
            items.push({
              key: `drive:${file.id}`,
              source: "drive",
              ref: file.id,
              // Images: Google CDN sized variant (fast, parallel, cached).
              // Videos: must stream through our proxy.
              src: isVideo
                ? `${selfBase}?action=image&fileId=${encodeURIComponent(file.id)}`
                : (link ? sizedThumb(link, 1600) : `${selfBase}?action=image&fileId=${encodeURIComponent(file.id)}`),
              thumb,
              srcset: isVideo ? undefined : srcset,
              poster: isVideo && link ? sizedThumb(link, 960) : undefined,
              name: file.name,
              mimeType: file.mimeType,
              folder: f.label,
              sort_order: orderIndex.get(`drive:${file.id}`) ?? 1000000,
              created_at: file.modifiedTime ?? "",
              width: meta.width ? Number(meta.width) : undefined,
              height: meta.height ? Number(meta.height) : undefined,
            });
          }
        }
      }

      const { data: uploads } = await sb
        .from("gallery_uploads")
        .select("id,storage_path,file_name,mime_type,sort_order,created_at");
      for (const u of uploads ?? []) {
        items.push({
          key: `upload:${u.id}`,
          source: "upload",
          ref: u.id,
          src: `${selfBase}?action=upload&path=${encodeURIComponent(u.storage_path)}`,
          name: u.file_name ?? "upload",
          mimeType: u.mime_type ?? "application/octet-stream",
          folder: "Uploads",
          sort_order: orderIndex.get(`upload:${u.id}`) ?? 1000000,
          created_at: u.created_at ?? "",
        });
      }


      items.sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return (b.created_at || "").localeCompare(a.created_at || "");
      });

      return new Response(JSON.stringify({ items }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
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
      const includeVideos = url.searchParams.get("includeVideos") === "1";
      const typeClause = includeVideos
        ? "(mimeType contains 'image/' or mimeType contains 'video/')"
        : "mimeType contains 'image/'";
      const q = encodeURIComponent(
        `'${folderId}' in parents and ${typeClause} and trashed=false`,
      );
      const fields = encodeURIComponent("files(id,name,mimeType,thumbnailLink,modifiedTime)");
      const r = await fetch(
        `${GATEWAY}/files?q=${q}&fields=${fields}&pageSize=500&orderBy=modifiedTime desc`,
        { headers: gwHeaders() },
      );
      const body = await r.json();
      if (!r.ok) return json({ error: body }, r.status);
      return new Response(JSON.stringify({ files: body.files ?? [] }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=120",
        },
      });
    }

    if (req.method === "GET" && action === "picks") {
      const folderId = url.searchParams.get("folderId");
      if (!folderId) return json({ error: "folderId required" }, 400);
      const { data, error } = await sb
        .from("drive_gallery_picks")
        .select("file_id")
        .eq("folder_id", folderId);
      if (error) return json({ error: error.message }, 500);
      return json({ file_ids: (data ?? []).map((d) => d.file_id) });
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
      if (op === "toggle_gallery") {
        const id = String(body.id ?? "");
        const is_gallery = Boolean(body.is_gallery);
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await sb
          .from("drive_photo_folders")
          .update({ is_gallery })
          .eq("id", id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true, is_gallery });
      }
      if (op === "pick_toggle") {
        const folder_id = String(body.folder_id ?? "");
        const file_id = String(body.file_id ?? "");
        const file_name = body.file_name ? String(body.file_name) : null;
        const mime_type = body.mime_type ? String(body.mime_type) : null;
        const selected = Boolean(body.selected);
        if (!folder_id || !file_id) return json({ error: "folder_id and file_id required" }, 400);
        if (selected) {
          const { error } = await sb
            .from("drive_gallery_picks")
            .upsert({ folder_id, file_id, file_name, mime_type }, { onConflict: "folder_id,file_id" });
          if (error) return json({ error: error.message }, 500);
        } else {
          const { error } = await sb
            .from("drive_gallery_picks")
            .delete()
            .eq("folder_id", folder_id)
            .eq("file_id", file_id);
          if (error) return json({ error: error.message }, 500);
        }
        return json({ ok: true, selected });
      }
      if (op === "pick_clear") {
        const folder_id = String(body.folder_id ?? "");
        if (!folder_id) return json({ error: "folder_id required" }, 400);
        const { error } = await sb.from("drive_gallery_picks").delete().eq("folder_id", folder_id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
      if (op === "upload_url") {
        const file_name = String(body.file_name ?? "").trim();
        const mime_type = String(body.mime_type ?? "").trim();
        if (!file_name) return json({ error: "file_name required" }, 400);
        const ext = file_name.includes(".") ? file_name.split(".").pop() : "bin";
        const safe = file_name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
        const path = `${crypto.randomUUID()}-${safe}`;
        const { data, error } = await sb.storage
          .from("gallery-uploads")
          .createSignedUploadUrl(path);
        if (error || !data) return json({ error: error?.message ?? "sign failed" }, 500);
        return json({ path, token: data.token, signedUrl: data.signedUrl, mime_type });
      }
      if (op === "upload_register") {
        const storage_path = String(body.path ?? "").trim();
        const file_name = String(body.file_name ?? "").trim() || null;
        const mime_type = String(body.mime_type ?? "").trim() || null;
        const size_bytes = Number(body.size_bytes ?? 0) || null;
        if (!storage_path) return json({ error: "path required" }, 400);
        // Place at end: max(sort_order)+1
        const { data: maxRow } = await sb
          .from("gallery_uploads")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        const sort_order = (maxRow?.sort_order ?? 0) + 1;
        const { data, error } = await sb
          .from("gallery_uploads")
          .insert({ storage_path, file_name, mime_type, size_bytes, sort_order })
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ upload: data });
      }
      if (op === "upload_remove") {
        const id = String(body.id ?? "");
        if (!id) return json({ error: "id required" }, 400);
        const { data: row } = await sb
          .from("gallery_uploads")
          .select("storage_path")
          .eq("id", id)
          .maybeSingle();
        if (row?.storage_path) {
          await sb.storage.from("gallery-uploads").remove([row.storage_path]);
        }
        const { error } = await sb.from("gallery_uploads").delete().eq("id", id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
      if (op === "reorder") {
        const items = Array.isArray(body.items) ? body.items : [];
        const rows = items
          .map((it: { source?: string; ref?: string; sort_order?: number }) => ({
            source: String(it.source ?? ""),
            ref: String(it.ref ?? ""),
            sort_order: Number(it.sort_order ?? 0),
            updated_at: new Date().toISOString(),
          }))
          .filter((r: { source: string; ref: string }) => r.source && r.ref);
        if (rows.length > 0) {
          const { error } = await sb
            .from("gallery_order")
            .upsert(rows, { onConflict: "source,ref" });
          if (error) return json({ error: error.message }, 500);
        }
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
