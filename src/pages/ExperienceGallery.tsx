import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos`;

interface GalleryItem {
  key: string;
  source: "drive" | "upload";
  ref: string;
  src: string;
  name: string;
  mimeType: string;
  folder: string;
  width?: number;
  height?: number;
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
              const w = item.width && item.width > 0 ? item.width : 4;
              const h = item.height && item.height > 0 ? item.height : 5;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setLightbox(item)}
                  className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-forest-dark/5"
                  style={{ aspectRatio: `${w} / ${h}` }}
                  aria-label={`Open ${item.name}`}
                >
                  {isVideo ? (
                    <TileVideo src={item.src} />
                  ) : (
                    <img
                      src={item.src}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      width={w}
                      height={h}
                      className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.02]"
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
            className="absolute top-6 right-6 text-cream/80 hover:text-cream z-10"
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
              <LightboxVideo src={lightbox.src} />
            ) : (
              <img
                src={lightbox.src}
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

function LightboxVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.volume = 1;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      controls
      autoPlay
      playsInline
      className="max-h-[88vh] max-w-full"
    />
  );
}

export default ExperienceGallery;

