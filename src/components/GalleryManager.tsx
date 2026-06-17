import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Trash2, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos`;

interface GalleryItem {
  key: string;
  source: "drive" | "upload";
  ref: string;
  src: string;
  name: string;
  mimeType: string;
  folder: string;
}

/**
 * Admin manager for the public /experience/gallery page.
 * Lets the admin upload videos/images directly and re-order every item
 * (Drive picks + uploads) using up/down buttons. Ordering is stored in
 * `gallery_order` and does not affect inclusion.
 */
export function GalleryManager({ password }: { password: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const headers = { "x-admin-password": password, "Content-Type": "application/json" };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${FN}?action=gallery`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setItems(j.items || []);
    } catch (e) {
      toast.error(`Gallery: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const persistOrder = async (next: GalleryItem[]) => {
    const payload = next.map((it, idx) => ({ source: it.source, ref: it.ref, sort_order: idx }));
    const r = await fetch(FN, {
      method: "POST",
      headers,
      body: JSON.stringify({ op: "reorder", items: payload }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      toast.error(j.error || "Reorder failed");
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
    persistOrder(next);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // 1) ask for signed upload URL
        const urlRes = await fetch(FN, {
          method: "POST",
          headers,
          body: JSON.stringify({
            op: "upload_url",
            file_name: file.name,
            mime_type: file.type,
          }),
        });
        const urlJ = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlJ.error || "sign failed");

        // 2) PUT bytes to signed URL
        const up = await fetch(urlJ.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!up.ok) throw new Error(`upload ${up.status}`);

        // 3) register in DB
        const reg = await fetch(FN, {
          method: "POST",
          headers,
          body: JSON.stringify({
            op: "upload_register",
            path: urlJ.path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          }),
        });
        const regJ = await reg.json();
        if (!reg.ok) throw new Error(regJ.error || "register failed");
      }
      toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
      await load();
    } catch (e) {
      toast.error(`Upload: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeUpload = async (id: string) => {
    if (!confirm("Remove this uploaded file from the gallery?")) return;
    const r = await fetch(FN, {
      method: "POST",
      headers,
      body: JSON.stringify({ op: "upload_remove", id }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      toast.error(j.error || "Delete failed");
      return;
    }
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-4">
      {/* Upload box */}
      <div className="border border-dashed border-forest-dark/30 p-4 bg-cream/40">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs px-3 py-2 bg-forest-dark text-cream flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "Uploading…" : "Upload videos or photos"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,image/*"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <span className="text-[11px] text-forest-dark/60">
            Goes straight to the public gallery. Drag the arrows below to place it where you want.
          </span>
          <button
            type="button"
            onClick={load}
            className="ml-auto text-xs text-forest-dark/60 hover:text-forest-dark flex items-center gap-1"
            title="Refresh"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Ordered grid */}
      {loading && items.length === 0 && (
        <div className="text-xs text-forest-dark/60 py-6 text-center">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…
        </div>
      )}
      {!loading && items.length === 0 && (
        <div className="text-xs text-forest-dark/60 py-6 text-center">
          Nothing in the public gallery yet. Pick items from a Drive folder above or upload a video/photo.
        </div>
      )}
      {items.length > 0 && (
        <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, idx) => {
            const isVideo = item.mimeType.startsWith("video/");
            return (
              <li key={item.key} className="relative group border border-forest-dark/15 bg-forest-dark/5 overflow-hidden">
                <div className="aspect-square">
                  {isVideo ? (
                    <video src={item.src} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.src} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute top-1 left-1 bg-forest-dark/80 text-cream text-[10px] px-1.5 py-0.5">
                  #{idx + 1}
                </div>
                <div className="absolute top-1 right-1 bg-cream/90 text-forest-dark text-[9px] uppercase tracking-wider px-1.5 py-0.5">
                  {item.source === "upload" ? "Upload" : item.folder}
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-forest-dark/85 text-cream p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-cream/10 disabled:opacity-30" title="Move left/up">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="p-1 hover:bg-cream/10 disabled:opacity-30" title="Move right/down">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  {item.source === "upload" && (
                    <button type="button" onClick={() => removeUpload(item.ref)} className="p-1 hover:bg-red-500/30" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
