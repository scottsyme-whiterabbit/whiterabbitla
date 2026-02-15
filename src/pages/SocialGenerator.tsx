import { useState } from "react";
import { blogArticles } from "@/data/blogArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Format = "post" | "story";

const SocialGenerator = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [generating, setGenerating] = useState<Format | null>(null);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [storyImage, setStoryImage] = useState<string | null>(null);

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

  const generate = async (format: Format) => {
    if (!selectedArticle) return;
    setGenerating(format);
    if (format === "post") setPostImage(null);
    else setStoryImage(null);

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

      if (format === "post") setPostImage(data.image);
      else setStoryImage(data.image);

      toast({ title: "Image generated", description: `Your ${format === "post" ? "square post" : "story"} is ready to download.` });
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
              Generate branded Instagram posts and stories from your blog articles using AI.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Article Selector */}
          <div className="mb-12">
            <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Select Article
            </label>
            <select
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setPostImage(null);
                setStoryImage(null);
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
                  {generating === "post" ? "Generating Post..." : "Generate Square Post"}
                </button>
                <button
                  onClick={() => generate("story")}
                  disabled={!!generating}
                  className="font-sans text-sm tracking-[0.2em] uppercase bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === "story" ? "Generating Story..." : "Generate Story"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
                    Square Post (1:1)
                  </p>
                  <div className="aspect-square bg-muted/20 border border-border flex items-center justify-center overflow-hidden">
                    {postImage ? (
                      <img src={postImage} alt="Generated post" className="w-full h-full object-cover" />
                    ) : (
                      <p className="font-sans text-sm text-muted-foreground">
                        {generating === "post" ? "Generating..." : "No image yet"}
                      </p>
                    )}
                  </div>
                  {postImage && (
                    <button
                      onClick={() => download(postImage, `wr-post-${selectedSlug}.png`)}
                      className="mt-3 font-sans text-xs tracking-[0.2em] uppercase text-accent hover:text-accent/80 transition-colors"
                    >
                      Download Post ↓
                    </button>
                  )}
                </div>

                <div>
                  <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
                    Story (9:16)
                  </p>
                  <div className="aspect-[9/16] bg-muted/20 border border-border flex items-center justify-center overflow-hidden max-h-[500px]">
                    {storyImage ? (
                      <img src={storyImage} alt="Generated story" className="w-full h-full object-cover" />
                    ) : (
                      <p className="font-sans text-sm text-muted-foreground">
                        {generating === "story" ? "Generating..." : "No image yet"}
                      </p>
                    )}
                  </div>
                  {storyImage && (
                    <button
                      onClick={() => download(storyImage, `wr-story-${selectedSlug}.png`)}
                      className="mt-3 font-sans text-xs tracking-[0.2em] uppercase text-accent hover:text-accent/80 transition-colors"
                    >
                      Download Story ↓
                    </button>
                  )}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </main>
  );
};

export default SocialGenerator;
