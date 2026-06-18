import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Loader2, Volume2, VolumeX, X } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useJsonLd } from "@/hooks/useSchemaOrg";
import heroVideo from "@/assets/triptych/hero-triptych.mp4.asset.json";
import heroPoster from "@/assets/triptych/hero-triptych-poster.jpg.asset.json";

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos`;
const BOOK_CALL_URL = "https://calendar.app.google/9DnGRoMUWaMDvvpt9";

interface GalleryItem {
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
  width?: number;
  height?: number;
}

// Responsive sizes — matches the columns-2 → columns-6 grid breakpoints
const TILE_SIZES =
  "(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw";


const ExperienceGallery = () => {
  usePageMeta({
    title: "Gallery | White Rabbit LA",
    description:
      "A look inside White Rabbit LA — photos and films from private salons, luxury weddings, and corporate events.",
    path: "/experience/gallery",
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

  const schemaItems = useMemo(
    () =>
      items.slice(0, 24).map((item, index) => ({
        "@type": item.mimeType.startsWith("video/") ? "VideoObject" : "ImageObject",
        position: index + 1,
        name: cleanMediaName(item.name),
        caption: `${cleanMediaName(item.name)} from ${item.folder} by White Rabbit LA`,
        contentUrl: item.src,
        thumbnailUrl: item.src,
        encodingFormat: item.mimeType,
        ...(item.width && item.height
          ? { width: item.width, height: item.height }
          : {}),
      })),
    [items],
  );

  useJsonLd("gallery-schema", [
    {
      "@type": "CollectionPage",
      name: "White Rabbit LA Gallery",
      description:
        "Photos and films from White Rabbit LA private salons, luxury weddings, and corporate events.",
      url: "https://whiterabbitla.com/experience/gallery",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: schemaItems,
      },
    },
  ]);

  const lightboxIsVideo = useMemo(
    () => (lightbox ? lightbox.mimeType.startsWith("video/") : false),
    [lightbox],
  );

  const openLightbox = (item: GalleryItem) => {
    if (!item.mimeType.startsWith("video/")) {
      setLightbox(item);
      return;
    }

    // On mobile, playback has to be started inside the original tap handler.
    flushSync(() => setLightbox(item));
    const video = document.querySelector<HTMLVideoElement>("[data-gallery-lightbox-video]");
    if (!video) return;
    video.muted = true;
    video.currentTime = 0;
    video.play().catch(() => {});
  };

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

        <HeroReel />



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
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-2 sm:gap-2.5 [column-fill:_balance]">
            {items.map((item, index) => {
              const isVideo = item.mimeType.startsWith("video/");
              const w = item.width && item.width > 0 ? item.width : 4;
              const h = item.height && item.height > 0 ? item.height : 5;
              // First ~12 tiles are above/near the fold — load eagerly with high priority
              const eager = index < 12;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => openLightbox(item)}
                  className="group relative mb-2 sm:mb-2.5 block w-full break-inside-avoid overflow-hidden bg-forest-dark/5 ring-1 ring-forest-dark/5 hover:ring-forest-dark/20 hover:shadow-[0_10px_30px_-12px_rgba(34,61,52,0.35)] transition-all duration-500"
                  style={{
                    aspectRatio: `${w} / ${h}`,
                    // Tiny blurred thumbnail as background — paints instantly,
                    // eliminates blank gray boxes while the full image loads.
                    backgroundImage: item.blur ? `url(${item.blur})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: undefined,
                  }}
                  aria-label={`Open ${item.name}`}
                >
                  {isVideo ? (
                    <TileVideo src={item.src} poster={item.poster} />
                  ) : (
                    <BlurImg
                      src={item.thumb || item.src}
                      srcSet={item.srcset}
                      sizes={item.srcset ? TILE_SIZES : undefined}
                      alt={`${cleanMediaName(item.name)} from ${item.folder} by White Rabbit LA`}
                      eager={eager}
                      width={w}
                      height={h}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-dark/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {isVideo && (
                    <div className="absolute bottom-1.5 right-1.5 bg-forest-dark/70 text-cream text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5">
                      Film
                    </div>
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
              <LightboxVideo src={lightbox.src} poster={lightbox.poster || lightbox.thumb || lightbox.blur} />
            ) : (
              <img
                src={lightbox.src}
                alt={`${cleanMediaName(lightbox.name)} from ${lightbox.folder} by White Rabbit LA`}
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
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Mobile browsers block autoplay with sound. Start muted so playback
    // always begins; user can tap the unmute button (or native controls)
    // to hear audio. This keeps the click gesture chain intact.
    v.muted = true;
    v.currentTime = 0;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) {
      v.volume = 1;
      v.play().catch(() => {});
    }
    setMuted(next);
  };
  return (
    <div className="relative max-h-[88vh] max-w-full" onClick={(e) => e.stopPropagation()}>
      <video
        ref={ref}
        src={src}
        controls
        autoPlay
        muted
        playsInline
        preload="auto"
        className="max-h-[88vh] max-w-full"
      />
      {muted && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute top-3 right-3 flex items-center gap-2 bg-forest-dark/80 hover:bg-forest-dark text-cream backdrop-blur-sm px-3 py-2 text-[10px] uppercase tracking-[0.2em]"
          aria-label="Unmute video"
        >
          <VolumeX className="w-4 h-4" /> <span>Tap for sound</span>
        </button>
      )}
    </div>
  );
}

/**
 * Tile video: always paints a poster still frame instantly (never a blank
 * gray box), then warms up and plays the muted loop once near the viewport.
 * Pauses when scrolled away to keep the grid smooth.
 */
function TileVideo({ src, poster }: { src: string; poster?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Phase 1: when near viewport, mount the <video> so metadata can preload
    const warm = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          warm.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    warm.observe(el);
    // Phase 2: play/pause based on actual visibility
    const play = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    play.observe(el);
    return () => {
      warm.disconnect();
      play.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      {poster && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover block"
        />
      )}
      {ready && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 w-full h-full object-cover block transition-opacity duration-500 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

/**
 * Image tile that fades in over a CSS blur-up background placeholder
 * (set on the parent button) once the full image decodes. Eager-loaded
 * for above-the-fold tiles; lazy + low-priority for the rest.
 */
function BlurImg({
  src,
  srcSet,
  sizes,
  alt,
  eager,
  width,
  height,
}: {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  eager: boolean;
  width: number;
  height: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "low"}
      decoding="async"
      width={width}
      height={height}
      onLoad={() => setLoaded(true)}
      className={`w-full h-full object-cover block transition-all duration-700 group-hover:scale-[1.04] ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

/**
 * Hero reel: full-width autoplaying, muted, looping film with a poster so it
 * never paints blank. Includes an unobtrusive mute toggle and a single
 * primary CTA below linking to the booking calendar.
 */
function HeroReel() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) {
      v.volume = 1;
      v.play().catch(() => {});
    }
    setMuted(next);
  };

  return (
    <div className="mb-12">
      <div className="relative overflow-hidden ring-1 ring-forest-dark/10 shadow-[0_30px_80px_-30px_rgba(34,61,52,0.45)] bg-forest-dark">
        <video
          ref={ref}
          src={heroVideo.url}
          poster={heroPoster.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-auto block aspect-video object-cover"
        />
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute reel" : "Mute reel"}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-forest-dark/70 hover:bg-forest-dark/90 text-cream backdrop-blur-sm px-3 py-2 transition-colors duration-300 text-[10px] uppercase tracking-[0.2em]"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{muted ? "Unmute" : "Mute"}</span>
        </button>
      </div>

      <div className="flex justify-center mt-8">
        <a
          href={BOOK_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-forest-dark text-cream hover:bg-forest-dark/90 border border-gold/60 hover:border-gold transition-colors duration-300 px-8 py-4 font-ogg text-base tracking-wide"
        >
          Book a 15-minute conversation
        </a>
      </div>
    </div>
  );
}

function cleanMediaName(name: string) {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "White Rabbit LA event moment";
}

export default ExperienceGallery;

