import { useEffect, useRef, useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import clip1 from "@/assets/triptych/triptych-1.mp4.asset.json";
import clip1sd from "@/assets/triptych/triptych-1-480.mp4.asset.json";
import clip2 from "@/assets/triptych/triptych-2.mp4.asset.json";
import clip2sd from "@/assets/triptych/triptych-2-480.mp4.asset.json";
import clip3 from "@/assets/triptych/triptych-3.mp4.asset.json";
import clip3sd from "@/assets/triptych/triptych-3-480.mp4.asset.json";
import poster1 from "@/assets/triptych/triptych-1-poster.jpg.asset.json";
import poster2 from "@/assets/triptych/triptych-2-poster.jpg.asset.json";
import poster3 from "@/assets/triptych/triptych-3-poster.jpg.asset.json";

const clips = [
  { hd: clip1.url, sd: clip1sd.url, poster: poster1.url },
  { hd: clip2.url, sd: clip2sd.url, poster: poster2.url },
  { hd: clip3.url, sd: clip3sd.url, poster: poster3.url },
];

function LazyAutoplayVideo({ hd, sd, poster }: { hd: string; sd: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Phase 1: attach sources when within ~800px of viewport (warm-up + metadata preload)
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const warm = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          warm.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    warm.observe(video);
    return () => warm.disconnect();
  }, []);

  // Phase 2: play/pause when actually visible
  useEffect(() => {
    const video = ref.current;
    if (!video || !shouldLoad) return;
    // Kick the loader so the first frame is ready before it scrolls into view
    try { video.load(); } catch {}
    const play = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    play.observe(video);
    return () => play.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      width={1080}
      height={1920}
      className="w-full h-full object-cover"
    >
      {shouldLoad && (
        <>
          {/* Mobile / narrow viewports get the ~1MB 480p cut */}
          <source src={sd} type="video/mp4" media="(max-width: 767px)" />
          {/* Desktop gets the 720p cut */}
          <source src={hd} type="video/mp4" />
        </>
      )}
    </video>
  );
}

const VerticalTriptych = () => {
  return (
    <section className="py-20 lg:py-28 bg-forest-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection>
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
            In the Room
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream text-center mb-3">
            Moments, Unscripted
          </h2>
          <div className="mx-auto w-16 h-px bg-accent/60 mb-14" />
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-0 gap-6">
          {clips.map((clip, i) => (
            <AnimatedSection key={clip.hd} delay={i * 0.12}>
              <div
                className={`relative aspect-[9/16] overflow-hidden bg-black ${
                  i > 0 ? "md:border-l md:border-accent/30" : ""
                }`}
              >
                <LazyAutoplayVideo hd={clip.hd} sd={clip.sd} poster={clip.poster} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest-dark/40" />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VerticalTriptych;
