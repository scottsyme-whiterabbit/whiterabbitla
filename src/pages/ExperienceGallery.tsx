import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, X } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos`;
const MEDIA = (fileId: string) => `${FN}?action=image&fileId=${encodeURIComponent(fileId)}`;

interface GalleryItem {
  id: string;
  name: string;
  mimeType: string;
  folder: string;
}

const ExperienceGallery = () => {
  usePageMeta({
    title: "Gallery | White Rabbit LA",
    description:
      "A look inside White Rabbit LA — photos and films from private salons, luxury weddings, and corporate events.",
  });

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${FN}?action=gallery`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        if (!cancelled) setItems(j.items || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasItems = items.length > 0;

  const lightboxIsVideo = useMemo(
    () => (lightbox ? lightbox.mimeType.startsWith("video/") : false),
    [lightbox],
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <main className="min-h-screen bg-cream text-forest-dark pt-44 pb-24">
      <section className="max-w-7xl mx-auto px-6 lg:px-12">
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-forest-dark/60 mb-3">
            Gallery
          </p>
          <h1 className="font-ogg text-4xl md:text-6xl mb-5">Moments, captured.</h1>
          <p className="max-w-2xl mx-auto text-forest-dark/70 leading-relaxed">
            A small archive of the rooms we've been invited into — private salons,
            weddings, and brand evenings where wonder was the point of the night.
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-24 text-forest-dark/50">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading gallery…
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-24 text-forest-dark/60 text-sm">
            We couldn't load the gallery right now. Please refresh in a moment.
          </div>
        )}

        {!loading && !error && !hasItems && (
          <div className="text-center py-24 text-forest-dark/60 text-sm">
            Gallery coming soon.
          </div>
        )}

        {hasItems && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {items.map((item) => {
              const isVideo = item.mimeType.startsWith("video/");
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightbox(item)}
                  className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-forest-dark/5"
                  aria-label={`Open ${item.name}`}
                >
                  {isVideo ? (
                    <div className="relative">
                      <video
                        src={MEDIA(item.id)}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-auto block"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-forest-dark/20 group-hover:bg-forest-dark/30 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-cream/90 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-forest-dark fill-forest-dark ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={MEDIA(item.id)}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-forest-dark/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-cream/80 hover:text-cream"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>
          <div
            className="max-w-6xl max-h-[88vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxIsVideo ? (
              <video
                src={MEDIA(lightbox.id)}
                controls
                autoPlay
                playsInline
                className="max-h-[88vh] max-w-full"
              />
            ) : (
              <img
                src={MEDIA(lightbox.id)}
                alt={lightbox.name}
                className="max-h-[88vh] max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default ExperienceGallery;
