import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Plus, Trash2, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos`;
const IMG = (fileId: string) => `${FN}?action=image&fileId=${encodeURIComponent(fileId)}`;

export interface DriveFolder {
  id: string;
  folder_id: string;
  label: string;
  sort_order: number;
  is_gallery?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

/**
 * Renders a compact tab+grid picker over the user's Google Drive photo folders.
 * Calls onPick(fileId, name) when a thumbnail is clicked.
 *
 * Requires the user to be authenticated through the existing admin password
 * pattern — pass the password from localStorage.
 */
export function DrivePhotoBank({
  password,
  onPick,
  selectedFileIds = [],
  showManager = false,
  thumbClassName = "aspect-square overflow-hidden border-2 transition-all",
  selectedClassName = "border-gold ring-2 ring-gold/30",
  unselectedClassName = "border-transparent hover:border-forest-dark/40 opacity-90 hover:opacity-100",
}: {
  password: string;
  onPick: (fileId: string, name: string) => void;
  selectedFileIds?: string[];
  showManager?: boolean;
  thumbClassName?: string;
  selectedClassName?: string;
  unselectedClassName?: string;
}) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const headers = { "x-admin-password": password, "Content-Type": "application/json" };

  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const r = await fetch(`${FN}?action=folders`, { headers });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setFolders(j.folders || []);
      if (!activeFolder && j.folders?.[0]) setActiveFolder(j.folders[0].folder_id);
    } catch (e) {
      toast.error(`Drive folders: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadFiles = async (folderId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${FN}?action=list&folderId=${encodeURIComponent(folderId)}`, { headers });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setFiles(j.files || []);
    } catch (e) {
      toast.error(`Drive list: ${e instanceof Error ? e.message : "failed"}`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFolders(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (activeFolder) loadFiles(activeFolder); /* eslint-disable-next-line */ }, [activeFolder]);

  // ---------- folder manager ----------
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const addFolder = async () => {
    if (!newId.trim() || !newLabel.trim()) {
      toast.error("Folder ID/URL and label are required");
      return;
    }
    const r = await fetch(FN, {
      method: "POST",
      headers,
      body: JSON.stringify({ op: "add", folder_id: newId.trim(), label: newLabel.trim() }),
    });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error || "Add failed"); return; }
    setNewId(""); setNewLabel("");
    toast.success(`Added "${j.folder.label}"`);
    loadFolders();
  };
  const removeFolder = async (id: string, label: string) => {
    if (!confirm(`Remove "${label}" from the photo bank? (Drive files are not deleted.)`)) return;
    const r = await fetch(FN, { method: "POST", headers, body: JSON.stringify({ op: "remove", id }) });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error || "Remove failed"); return; }
    if (folders.find(f => f.id === id)?.folder_id === activeFolder) setActiveFolder(null);
    loadFolders();
  };
  const toggleGallery = async (id: string, next: boolean) => {
    const r = await fetch(FN, {
      method: "POST",
      headers,
      body: JSON.stringify({ op: "toggle_gallery", id, is_gallery: next }),
    });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error || "Update failed"); return; }
    toast.success(next ? "Added to public gallery" : "Removed from public gallery");
    loadFolders();
  };

  // ---------- per-folder item picker (gallery selection) ----------
  const [pickerFolder, setPickerFolder] = useState<DriveFolder | null>(null);
  const [pickerFiles, setPickerFiles] = useState<DriveFile[]>([]);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [pickerLoading, setPickerLoading] = useState(false);

  const openPicker = async (folder: DriveFolder) => {
    setPickerFolder(folder);
    setPickerFiles([]);
    setPickerSelected(new Set());
    setPickerLoading(true);
    try {
      const [filesRes, picksRes] = await Promise.all([
        fetch(`${FN}?action=list&includeVideos=1&folderId=${encodeURIComponent(folder.folder_id)}`, { headers }),
        fetch(`${FN}?action=picks&folderId=${encodeURIComponent(folder.folder_id)}`, { headers }),
      ]);
      const filesJ = await filesRes.json();
      const picksJ = await picksRes.json();
      if (!filesRes.ok) throw new Error(filesJ.error || "load failed");
      setPickerFiles(filesJ.files || []);
      setPickerSelected(new Set<string>(picksJ.file_ids || []));
    } catch (e) {
      toast.error(`Picker: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setPickerLoading(false);
    }
  };
  const togglePick = async (file: DriveFile) => {
    if (!pickerFolder) return;
    const willSelect = !pickerSelected.has(file.id);
    // optimistic
    const next = new Set(pickerSelected);
    willSelect ? next.add(file.id) : next.delete(file.id);
    setPickerSelected(next);
    const r = await fetch(FN, {
      method: "POST",
      headers,
      body: JSON.stringify({
        op: "pick_toggle",
        folder_id: pickerFolder.folder_id,
        file_id: file.id,
        file_name: file.name,
        mime_type: file.mimeType,
        selected: willSelect,
      }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      toast.error(j.error || "Update failed");
      // revert
      const rev = new Set(pickerSelected);
      setPickerSelected(rev);
    }
  };
  const clearPicks = async () => {
    if (!pickerFolder) return;
    if (!confirm("Clear all picks for this folder? The whole folder will then show on the gallery.")) return;
    const r = await fetch(FN, {
      method: "POST", headers,
      body: JSON.stringify({ op: "pick_clear", folder_id: pickerFolder.folder_id }),
    });
    if (!r.ok) { toast.error("Clear failed"); return; }
    setPickerSelected(new Set());
    toast.success("Cleared — whole folder will show.");
  };


  return (
    <div className="space-y-3">
      {/* Folder tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {loadingFolders && <Loader2 className="w-3 h-3 animate-spin opacity-60" />}
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFolder(f.folder_id)}
            className={`text-xs px-3 py-1 border transition-colors ${
              activeFolder === f.folder_id
                ? "bg-forest-dark text-cream border-forest-dark"
                : "bg-transparent text-forest-dark border-forest-dark/30 hover:border-forest-dark"
            }`}
          >
            {f.label}
          </button>
        ))}
        {folders.length === 0 && !loadingFolders && (
          <span className="text-xs text-forest-dark/50">No Drive folders configured yet — add one below.</span>
        )}
        <button
          type="button"
          onClick={() => activeFolder && loadFiles(activeFolder)}
          className="text-xs text-forest-dark/60 hover:text-forest-dark flex items-center gap-1 ml-auto"
          disabled={!activeFolder || loading}
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Files grid */}
      {activeFolder && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {loading && files.length === 0 && (
            <div className="col-span-full text-center text-xs text-forest-dark/50 py-6">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading from Drive…
            </div>
          )}
          {!loading && files.length === 0 && (
            <div className="col-span-full text-center text-xs text-forest-dark/50 py-6">
              No images in this folder.
            </div>
          )}
          {files.map((file) => {
            const selected = selectedFileIds.includes(file.id);
            const order = selected ? selectedFileIds.indexOf(file.id) + 1 : null;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => onPick(file.id, file.name)}
                title={file.name}
                className={`relative ${thumbClassName} ${selected ? selectedClassName : unselectedClassName}`}
              >
                <img src={IMG(file.id)} alt={file.name} loading="lazy" className="w-full h-full object-cover" />
                {selected && order !== null && (
                  <div className="absolute top-1 right-1 bg-gold text-forest-dark w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {order}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Folder manager */}
      {showManager && (
        <details className="border border-forest-dark/15 p-3 mt-3">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-forest-dark/70 hover:text-forest-dark">
            Manage Drive folders
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-forest-dark/60">
              Paste a Google Drive folder URL (or just the folder ID) and give it a label.
              The Lovable agent's connected Drive account must have access to it.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/…"
                className="flex-1 min-w-[260px] text-xs px-3 py-2 border border-forest-dark/20 bg-cream/50"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g. Ladies Luncheon)"
                className="text-xs px-3 py-2 border border-forest-dark/20 bg-cream/50"
              />
              <button
                type="button"
                onClick={addFolder}
                className="text-xs px-3 py-2 bg-forest-dark text-cream flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {folders.length > 0 && (
              <ul className="text-xs divide-y divide-forest-dark/10">
                {folders.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-1.5 gap-3">
                    <span className="min-w-0 flex-1 truncate"><strong>{f.label}</strong> <span className="text-forest-dark/40 ml-2 font-mono text-[10px]">{f.folder_id}</span></span>
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-forest-dark/60 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={!!f.is_gallery}
                        onChange={(e) => toggleGallery(f.id, e.target.checked)}
                        className="accent-forest-dark"
                      />
                      Public gallery
                    </label>
                    {f.is_gallery && (
                      <button
                        type="button"
                        onClick={() => openPicker(f)}
                        className="text-[10px] uppercase tracking-wider px-2 py-1 border border-forest-dark/30 hover:border-forest-dark flex items-center gap-1 whitespace-nowrap"
                        title="Choose specific items from this folder"
                      >
                        <ImageIcon className="w-3 h-3" /> Choose items
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFolder(f.id, f.label)}
                      className="text-red-600/80 hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}

      {/* Per-folder picker modal */}
      {pickerFolder && (
        <div className="fixed inset-0 z-[100] bg-forest-dark/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPickerFolder(null)}>
          <div className="bg-cream max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-forest-dark/15">
              <div>
                <div className="text-xs uppercase tracking-wider text-forest-dark/60">Gallery items</div>
                <div className="font-ogg text-xl text-forest-dark">{pickerFolder.label}</div>
                <div className="text-[11px] text-forest-dark/60 mt-0.5">
                  {pickerSelected.size === 0
                    ? "No picks yet — the entire folder will show on the gallery."
                    : `${pickerSelected.size} item${pickerSelected.size === 1 ? "" : "s"} will show on the gallery.`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pickerSelected.size > 0 && (
                  <button
                    type="button"
                    onClick={clearPicks}
                    className="text-xs px-3 py-1.5 border border-forest-dark/30 hover:border-forest-dark"
                  >
                    Clear picks
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPickerFolder(null)}
                  className="p-1.5 hover:bg-forest-dark/10"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {pickerLoading && (
                <div className="text-center text-xs text-forest-dark/60 py-10">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…
                </div>
              )}
              {!pickerLoading && pickerFiles.length === 0 && (
                <div className="text-center text-xs text-forest-dark/60 py-10">No media in this folder.</div>
              )}
              {!pickerLoading && pickerFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {pickerFiles.map((file) => {
                    const selected = pickerSelected.has(file.id);
                    const isVideo = file.mimeType?.startsWith("video/");
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => togglePick(file)}
                        title={file.name}
                        className={`relative aspect-square overflow-hidden border-2 transition-all ${
                          selected
                            ? "border-gold ring-2 ring-gold/30"
                            : "border-transparent hover:border-forest-dark/40 opacity-90 hover:opacity-100"
                        }`}
                      >
                        <img src={IMG(file.id)} alt={file.name} loading="lazy" className="w-full h-full object-cover bg-forest-dark/10" />
                        {isVideo && (
                          <div className="absolute bottom-1 left-1 bg-forest-dark/80 text-cream text-[9px] uppercase tracking-wider px-1.5 py-0.5">
                            Video
                          </div>
                        )}
                        {selected && (
                          <div className="absolute top-1 right-1 bg-gold text-forest-dark w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

