import { useState, useRef, useCallback } from "react";
import { blogArticles } from "@/data/blogArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";
import { toPng } from "html-to-image";
import wrSymbol from "@/assets/wr-symbol.png";
import wrLogo from "@/assets/wr-primary-logo.png";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Format = "post" | "story";

const SocialGenerator = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [generating, setGenerating] = useState<Format | null>(null);
  const [postBg, setPostBg] = useState<string | null>(null);
  const [storyBg, setStoryBg] = useState<string | null>(null);
  const [postFinal, setPostFinal] = useState<string | null>(null);
  const [storyFinal, setStoryFinal] = useState<string | null>(null);

  const postRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  const selectedArticle = blogArticles.find((a) => a.slug === selectedSlug);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: "get_stats", adminPassword: password }),
      });
      if (res.ok) {
        setStoredPassword(password);
        setAuthenticated(true);
        toast({ title: "Welcome back" });
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection failed", variant: "destructive" });
    }
  };

  const compositeImage = useCallback(async (ref: React.RefObject<HTMLDivElement>, format: Format) => {
    if (!ref.current) return;
    // Wait for background image to render
    await new Promise((r) => setTimeout(r, 500));
    try {
      const dataUrl = await toPng(ref.current, {
        width: format === "post" ? 1080 : 1080,
        height: format === "post" ? 1080 : 1920,
        pixelRatio: 1,
        cacheBust: true,
      });
      if (format === "post") setPostFinal(dataUrl);
      else setStoryFinal(dataUrl);
      toast({ title: "Image ready", description: "Your branded image is ready to download." });
    } catch (err) {
      console.error("Composite error:", err);
      toast({ title: "Compositing failed", variant: "destructive" });
    }
  }, []);

  const generate = async (format: Format) => {
    if (!selectedArticle) return;
    setGenerating(format);
    if (format === "post") { setPostBg(null); setPostFinal(null); }
    else { setStoryBg(null); setStoryFinal(null); }

    try {
      const { data, error } = await supabase.functions.invoke("generate-social", {
        body: {
          title: selectedArticle.title,
          excerpt: selectedArticle.excerpt,
          category: selectedArticle.category,
          format,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (format === "post") setPostBg(data.image);
      else setStoryBg(data.image);

      // Composite after state update
      setTimeout(() => {
        compositeImage(format === "post" ? postRef : storyRef, format);
      }, 800);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Generation failed", description: e.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const download = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  // Compositing template components
  const PostTemplate = ({ bg }: { bg: string }) => (
    <div
      ref={postRef}
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Ogg', Georgia, serif",
      }}
    >
      {/* Background */}
      <img src={bg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} crossOrigin="anonymous" />
      {/* Dark overlay for text legibility */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(30,53,44,0.4) 0%, rgba(30,53,44,0.75) 50%, rgba(30,53,44,0.9) 100%)" }} />
      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80 }}>
        {/* Top: Logo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img src={wrLogo} alt="White Rabbit" style={{ height: 70, objectFit: "contain" }} crossOrigin="anonymous" />
        </div>
        {/* Center: Title */}
        <div style={{ textAlign: "center", padding: "0 20px" }}>
          <p style={{
            fontFamily: "'OggText-Book', sans-serif",
            fontSize: 16,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "#c8a0a0",
            marginBottom: 24,
          }}>
            {selectedArticle?.category}
          </p>
          <h2 style={{
            fontFamily: "'Ogg', Georgia, serif",
            fontSize: selectedArticle && selectedArticle.title.length > 60 ? 42 : 52,
            fontWeight: 400,
            fontStyle: "normal",
            lineHeight: 1.2,
            color: "#f5f0e8",
            margin: 0,
          }}>
            {selectedArticle?.title}
          </h2>
        </div>
        {/* Bottom: Symbol + URL */}
        <div style={{ textAlign: "center" }}>
          <img src={wrSymbol} alt="" style={{ height: 40, objectFit: "contain", marginBottom: 16, opacity: 0.7 }} crossOrigin="anonymous" />
          <p style={{
            fontFamily: "'OggText-Book', sans-serif",
            fontSize: 13,
            letterSpacing: "0.25em",
            textTransform: "uppercase" as const,
            color: "rgba(245,240,232,0.5)",
            margin: 0,
          }}>
            whiterabbitla.com
          </p>
        </div>
      </div>
    </div>
  );

  const StoryTemplate = ({ bg }: { bg: string }) => (
    <div
      ref={storyRef}
      style={{
        width: 1080,
        height: 1920,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Ogg', Georgia, serif",
      }}
    >
      <img src={bg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} crossOrigin="anonymous" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(30,53,44,0.3) 0%, rgba(30,53,44,0.5) 30%, rgba(30,53,44,0.85) 70%, rgba(30,53,44,0.95) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "120px 80px 100px" }}>
        {/* Top: Logo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img src={wrLogo} alt="White Rabbit" style={{ height: 80, objectFit: "contain" }} crossOrigin="anonymous" />
        </div>
        {/* Center: Title */}
        <div style={{ textAlign: "center", padding: "0 20px" }}>
          <p style={{
            fontFamily: "'OggText-Book', sans-serif",
            fontSize: 18,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "#c8a0a0",
            marginBottom: 32,
          }}>
            {selectedArticle?.category}
          </p>
          <h2 style={{
            fontFamily: "'Ogg', Georgia, serif",
            fontSize: selectedArticle && selectedArticle.title.length > 60 ? 48 : 58,
            fontWeight: 400,
            fontStyle: "normal",
            lineHeight: 1.25,
            color: "#f5f0e8",
            margin: "0 0 40px 0",
          }}>
            {selectedArticle?.title}
          </h2>
          <p style={{
            fontFamily: "'OggText-Book', sans-serif",
            fontSize: 20,
            lineHeight: 1.6,
            color: "rgba(245,240,232,0.7)",
            margin: 0,
            maxWidth: 800,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {selectedArticle?.excerpt}
          </p>
        </div>
        {/* Bottom: Symbol + URL */}
        <div style={{ textAlign: "center" }}>
          <img src={wrSymbol} alt="" style={{ height: 48, objectFit: "contain", marginBottom: 20, opacity: 0.7 }} crossOrigin="anonymous" />
          <p style={{
            fontFamily: "'OggText-Book', sans-serif",
            fontSize: 14,
            letterSpacing: "0.25em",
            textTransform: "uppercase" as const,
            color: "rgba(245,240,232,0.5)",
            margin: 0,
          }}>
            whiterabbitla.com
          </p>
        </div>
      </div>
    </div>
  );

  if (!authenticated) {
    return (
      <main id="main-content" className="pt-20 min-h-screen flex items-center justify-center">
        <div className="max-w-sm w-full px-6">
          <AnimatedSection>
            <div className="text-center mb-8">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Admin Access</p>
              <h1 className="font-serif text-3xl text-foreground">Social Generator</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3 hover:bg-accent/80 transition-colors"
              >
                Enter
              </button>
            </form>
          </AnimatedSection>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="pt-20">
      <section className="bg-forest-dark py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-4">Admin Tool</p>
            <h1 className="font-serif text-4xl md:text-5xl text-cream mb-6">Social Content Generator</h1>
            <p className="font-sans text-base text-cream/70 max-w-xl mx-auto">
              AI generates the background artwork, then your brand fonts, logos, and layout are composited with pixel-perfect precision.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Select Article
            </label>
            <select
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setPostBg(null); setStoryBg(null);
                setPostFinal(null); setStoryFinal(null);
              }}
              className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
            >
              <option value="">Choose an article...</option>
              {blogArticles.map((article) => (
                <option key={article.slug} value={article.slug}>
                  {article.title}
                </option>
              ))}
            </select>
          </div>

          {selectedArticle && (
            <AnimatedSection>
              <div className="border border-border p-6 mb-8">
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-2">
                  {selectedArticle.category} · {selectedArticle.readTime}
                </p>
                <h2 className="font-serif text-2xl text-foreground mb-3">{selectedArticle.title}</h2>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {selectedArticle.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mb-12">
                <button
                  onClick={() => generate("post")}
                  disabled={!!generating}
                  className="font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-3 hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === "post" ? "Generating..." : "Generate Square Post"}
                </button>
                <button
                  onClick={() => generate("story")}
                  disabled={!!generating}
                  className="font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === "story" ? "Generating..." : "Generate Story"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Post */}
                <div>
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Square Post (1:1)</p>
                  {postFinal ? (
                    <>
                      <div className="aspect-square border border-border overflow-hidden">
                        <img src={postFinal} alt="Generated post" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => download(postFinal, `wr-post-${selectedSlug}.png`)}
                        className="mt-3 font-sans text-xs tracking-[0.2em] uppercase text-accent hover:text-accent/80 transition-colors"
                      >
                        Download Post ↓
                      </button>
                    </>
                  ) : (
                    <div className="aspect-square bg-muted/20 border border-border flex items-center justify-center">
                      <p className="font-sans text-sm text-muted-foreground">
                        {generating === "post" ? "Generating background..." : "No image yet"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Story */}
                <div>
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Story (9:16)</p>
                  {storyFinal ? (
                    <>
                      <div className="aspect-[9/16] border border-border overflow-hidden max-h-[500px]">
                        <img src={storyFinal} alt="Generated story" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => download(storyFinal, `wr-story-${selectedSlug}.png`)}
                        className="mt-3 font-sans text-xs tracking-[0.2em] uppercase text-accent hover:text-accent/80 transition-colors"
                      >
                        Download Story ↓
                      </button>
                    </>
                  ) : (
                    <div className="aspect-[9/16] bg-muted/20 border border-border flex items-center justify-center max-h-[500px]">
                      <p className="font-sans text-sm text-muted-foreground">
                        {generating === "story" ? "Generating background..." : "No image yet"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Hidden compositing canvases - rendered offscreen at full resolution */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {postBg && selectedArticle && <PostTemplate bg={postBg} />}
        {storyBg && selectedArticle && <StoryTemplate bg={storyBg} />}
      </div>
    </main>
  );
};

export default SocialGenerator;
