import { useEffect, useRef } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import clip1 from "@/assets/triptych/triptych-1.mp4.asset.json";
import clip2 from "@/assets/triptych/triptych-2.mp4.asset.json";
import clip3 from "@/assets/triptych/triptych-3.mp4.asset.json";

const clips = [clip1.url, clip2.url, clip3.url];

function AutoplayVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
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
          {clips.map((src, i) => (
            <AnimatedSection key={src} delay={i * 0.12}>
              <div
                className={`relative aspect-[9/16] overflow-hidden bg-black ${
                  i > 0 ? "md:border-l md:border-accent/30" : ""
                }`}
              >
                <AutoplayVideo src={src} />
                {/* subtle vignette to anchor edges */}
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
