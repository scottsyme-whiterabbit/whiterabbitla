import { useRef, useEffect } from "react";
import AnimatedSection from "@/components/AnimatedSection";

const clips = [
  { src: "/videos/highlight-1.mov", aspect: "aspect-[9/16]" },
  { src: "/videos/highlight-2.mov", aspect: "aspect-[9/16]" },
  { src: "/videos/highlight-3.mov", aspect: "aspect-[9/16]" },
  { src: "/videos/highlight-4.mov", aspect: "aspect-[9/16]" },
  { src: "/videos/highlight-5.mov", aspect: "aspect-[9/16]" },
  { src: "/videos/highlight-6.mov", aspect: "aspect-[9/16]" },
];

function AutoplayVideo({ src, className }: { src: string; className?: string }) {
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
      preload="none"
      className={className}
    />
  );
}

const VideoReelGrid = () => {
  return (
    <section className="py-16 bg-forest-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection>
          <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">
            In Action
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-cream mb-12 text-center">
            Moments That Stay
          </h2>
        </AnimatedSection>

        {/* Desktop: 3-column grid showing all 6 */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          {clips.map((clip, i) => (
            <AnimatedSection key={clip.src} delay={i * 0.1}>
              <div className="aspect-[9/16] overflow-hidden rounded-sm">
                <AutoplayVideo
                  src={clip.src}
                  className="w-full h-full object-cover"
                />
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Mobile: 2-column grid showing first 4 */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {clips.slice(0, 4).map((clip, i) => (
            <AnimatedSection key={clip.src} delay={i * 0.08}>
              <div className="aspect-[9/16] overflow-hidden rounded-sm">
                <AutoplayVideo
                  src={clip.src}
                  className="w-full h-full object-cover"
                />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoReelGrid;
