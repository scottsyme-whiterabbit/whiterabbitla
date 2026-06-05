import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { toast } from "@/hooks/use-toast";
import wrSecondaryLogo from "@/assets/wr-secondary-logo.png";
import wrSymbol from "@/assets/wr-symbol.png";
import { DrivePhotoBank } from "@/components/DrivePhotoBank";
import { blogArticles } from "@/data/blogArticles";

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").trim();
const firstSentence = (s: string) => {
  const m = stripHtml(s).match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : stripHtml(s)).trim();
};

// Brand tokens
const forestDark = "#223D34";
const cream = "#F8F5F0";
const gold = "#C8963E";

const W = 1080;
const H = 1350;

type PanelKind = "hook" | "blindspot" | "reframe" | "proof" | "cta";
type LogoKind = "none" | "rabbit" | "wordmark";

interface PhotoItem { src: string; label: string }

interface SlideLogos {
  top: LogoKind;
  bottom: LogoKind;
}

interface PanelProps {
  kind: PanelKind;
  hook: string;
  blindSpot: string;
  reframe: string;
  proof: string;
  proofCred: string;
  ctaQuestion: string;
  keyword: string;
  url: string;
  bgs: (string | null)[];
  idx: number;
  overlayOpacity: number; // 0-100
  logoScale: number; // percentage
  textScale: number; // percentage
  slideLogos: SlideLogos;
  isExport: boolean;
}

const LogoImg = ({ kind, color, scale }: { kind: LogoKind; color: "cream" | "emerald"; scale: number }) => {
  if (kind === "none") return null;
  const src = kind === "rabbit" ? wrSymbol : wrSecondaryLogo;
  const baseHeight = kind === "rabbit" ? 90 : 80;
  return (
    <img
      src={src}
      alt="White Rabbit Los Angeles"
      crossOrigin="anonymous"
      style={{
        height: baseHeight * (scale / 100),
        objectFit: "contain",
        filter:
          color === "cream"
            ? "brightness(0) invert(1)"
            : "brightness(0) saturate(100%) invert(18%) sepia(15%) saturate(900%) hue-rotate(100deg) brightness(95%) contrast(90%)",
      }}
    />
  );
};

const TopLogoRow = ({ kind, color, scale }: { kind: LogoKind; color: "cream" | "emerald"; scale: number }) =>
  kind === "none" ? <div style={{ height: 110 }} /> : (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 120, paddingBottom: 10 }}>
      <LogoImg kind={kind} color={color} scale={scale} />
    </div>
  );

const BottomLogoRow = ({ kind, color, scale }: { kind: LogoKind; color: "cream" | "emerald"; scale: number }) =>
  kind === "none" ? <div style={{ height: 110 }} /> : (
    <div style={{ display: "flex", justifyContent: "center", paddingBottom: 120, paddingTop: 10 }}>
      <LogoImg kind={kind} color={color} scale={scale} />
    </div>
  );

const PanelFrame = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
  <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: bg, fontFamily: "'Ogg', Georgia, serif", display: "flex", flexDirection: "column" }}>
    {children}
  </div>
);

const PhotoBackdrop = ({ src, overlayOpacity, isExport, baseColor }: { src: string | null; overlayOpacity: number; isExport: boolean; baseColor: string }) => {
  if (!src) return null;
  // Always use forest green for the wash, applied as a vertical gradient
  // so the 5 slides read as one continuous green wash when swiped.
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  const topAlpha = toHex((Math.max(0, overlayOpacity - 20) / 100) * 255);
  const midAlpha = toHex((overlayOpacity / 100) * 255);
  const botAlpha = toHex((Math.min(100, overlayOpacity + 20) / 100) * 255);
  const green = forestDark;
  return (
    <>
      <img
        src={src}
        alt=""
        {...(isExport ? { crossOrigin: "anonymous" as const } : {})}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${green}${topAlpha} 0%, ${green}${midAlpha} 55%, ${green}${botAlpha} 100%)` }} />
    </>
  );
};

const renderPanel = (p: PanelProps) => {
  const { kind, hook, blindSpot, reframe, proof, proofCred, ctaQuestion, keyword, url, bgs, idx, overlayOpacity, logoScale, textScale, slideLogos, isExport } = p;
  const bg = bgs[idx] ?? null;
  const ts = textScale / 100;
  // Determine if the panel base is dark (emerald) or light (cream)
  const isDarkBase = kind === "hook" || kind === "reframe" || kind === "cta";
  // When a photo is present, treat as dark so cream text is legible
  const useCreamText = isDarkBase || !!bg;
  const baseBg = isDarkBase ? forestDark : cream;
  const overlayColor = useCreamText ? forestDark : cream;
  const logoColor: "cream" | "emerald" = useCreamText ? "cream" : "emerald";
  const textColor = useCreamText ? cream : forestDark;

  // Special proof split layout stays unique
  if (kind === "proof") {
    return (
      <PanelFrame bg={cream}>
        <div style={{ position: "relative", width: "100%", height: "55%", background: forestDark }}>
          <PhotoBackdrop src={bg} overlayOpacity={Math.max(20, overlayOpacity - 20)} isExport={isExport} baseColor={forestDark} />
          <div style={{ position: "relative", display: "flex", justifyContent: "center", paddingTop: 90 }}>
            <LogoImg kind={slideLogos.top} color="cream" scale={logoScale} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "60px 90px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 44 * ts, lineHeight: 1.3, color: forestDark, margin: 0, fontWeight: 400 }}>{proof}</p>
          {proofCred && (
            <p style={{ fontFamily: "'Ogg', Georgia, serif", fontStyle: "italic", fontSize: 24 * ts, lineHeight: 1.4, color: forestDark, opacity: 0.7, marginTop: 24 }}>{proofCred}</p>
          )}
        </div>
        <BottomLogoRow kind={slideLogos.bottom} color="emerald" scale={logoScale} />
      </PanelFrame>
    );
  }

  let bodyContent: React.ReactNode = null;
  switch (kind) {
    case "hook":
      bodyContent = (
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", padding: "0 90px 60px" }}>
          <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 72 * ts, lineHeight: 1.12, color: textColor, margin: 0, fontWeight: 400 }}>{hook}</p>
        </div>
      );
      break;
    case "blindspot":
      bodyContent = (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 110px" }}>
          <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 56 * ts, lineHeight: 1.25, color: textColor, margin: 0, textAlign: "center", fontWeight: 400 }}>{blindSpot}</p>
        </div>
      );
      break;
    case "reframe":
      bodyContent = (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 100px" }}>
          <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 64 * ts, lineHeight: 1.22, color: textColor, margin: 0, textAlign: "center", fontWeight: 400 }}>{reframe}</p>
        </div>
      );
      break;
    case "cta":
      bodyContent = (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 100px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 56 * ts, lineHeight: 1.25, color: textColor, margin: 0, fontWeight: 400 }}>{ctaQuestion}</p>
          <div style={{ width: 80, height: 2, background: gold, margin: "40px auto" }} />
          <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 40 * ts, lineHeight: 1.3, color: textColor, margin: 0 }}>
            Comment <span style={{ color: gold, fontWeight: 700 }}>{keyword || "READ"}</span> for the full read.
          </p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22 * ts, letterSpacing: "0.35em", color: textColor, opacity: 0.85, margin: "40px 0 0", textTransform: "uppercase" }}>{url}</p>
        </div>
      );
      break;
  }

  return (
    <PanelFrame bg={baseBg}>
      <PhotoBackdrop src={bg} overlayOpacity={overlayOpacity} isExport={isExport} baseColor={overlayColor} />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>
        <TopLogoRow kind={slideLogos.top} color={logoColor} scale={logoScale} />
        {bodyContent}
        <BottomLogoRow kind={slideLogos.bottom} color={logoColor} scale={logoScale} />
      </div>
    </PanelFrame>
  );
};

interface Props {
  brandPhotos: PhotoItem[];
  password: string;
}

const PhotoPicker = ({
  label,
  brandPhotos,
  password,
  customPhotos,
  setCustomPhotos,
  selected,
  setSelected,
}: {
  label: string;
  brandPhotos: PhotoItem[];
  password: string;
  customPhotos: PhotoItem[];
  setCustomPhotos: (next: PhotoItem[]) => void;
  selected: string | null;
  setSelected: (src: string | null) => void;
}) => {
  const uploadRef = useRef<HTMLInputElement>(null);
  const all = [...brandPhotos, ...customPhotos];
  return (
    <div className="border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent">{label}</p>
        {selected && (
          <button onClick={() => setSelected(null)} className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-accent">Clear</button>
        )}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="aspect-square border-2 border-dashed border-muted-foreground/30 hover:border-accent/60 flex flex-col items-center justify-center text-[9px] tracking-wider uppercase text-muted-foreground/60 hover:text-accent"
        >
          + Upload
        </button>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (!files) return;
            const newOnes: PhotoItem[] = [];
            let remaining = files.length;
            Array.from(files).forEach((file) => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                newOnes.push({ src: ev.target?.result as string, label: file.name });
                remaining--;
                if (remaining === 0) {
                  const next = [...customPhotos, ...newOnes];
                  setCustomPhotos(next);
                  if (newOnes[0]) setSelected(newOnes[0].src);
                }
              };
              reader.readAsDataURL(file);
            });
            e.target.value = "";
          }}
        />
        {all.map((p) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setSelected(p.src)}
            className={`aspect-square overflow-hidden border-2 transition-all ${selected === p.src ? "border-accent scale-[0.95]" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <img src={p.src} alt={p.label} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <div>
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">From Google Drive</p>
        <DrivePhotoBank
          password={password}
          selectedFileIds={customPhotos.filter((p) => p.src.includes("fileId=")).map((p) => decodeURIComponent(p.src.split("fileId=")[1] || ""))}
          onPick={(fileId, name) => {
            const src = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-photos?action=image&fileId=${encodeURIComponent(fileId)}`;
            const exists = customPhotos.find((p) => p.src === src);
            if (!exists) setCustomPhotos([...customPhotos, { src, label: name }]);
            setSelected(src);
          }}
        />
      </div>
    </div>
  );
};

const PANEL_LABELS: Record<PanelKind, string> = {
  hook: "Hook",
  blindspot: "Blind Spot",
  reframe: "Reframe",
  proof: "Proof",
  cta: "CTA",
};

const CarouselGenerator = ({ brandPhotos, password }: Props) => {
  const [hook, setHook] = useState("At ultra-luxury hotels under 50 keys, if the crowd is uninteresting, you'll feel it.");
  const [blindSpot, setBlindSpot] = useState("Most operators cannot give a precise answer to the question: who is your guest?");
  const [reframe, setReframe] = useState("Brand attracts a type. Room mix determines the proportion. Most have only invested in the first.");
  const [proof, setProof] = useState("The best private rooms have achieved longevity through thoughtfulness over who belongs.");
  const [proofCred, setProofCred] = useState("");
  const [ctaQuestion, setCtaQuestion] = useState("Who is responsible for guest curation at your next event: the planner, the venue, or both?");
  const [keyword, setKeyword] = useState("MIX");
  const [url, setUrl] = useState("whiterabbitla.com");
  const [selectedSlug, setSelectedSlug] = useState("");

  const applyArticle = (slug: string) => {
    setSelectedSlug(slug);
    if (!slug) return;
    const a = blogArticles.find((x) => x.slug === slug);
    if (!a) return;
    const paras = (a.content || []).map(stripHtml).filter((p) => p && p.length > 40);
    setHook(a.title);
    setBlindSpot(firstSentence(a.excerpt) || a.excerpt);
    setReframe(paras[1] ? firstSentence(paras[1]) : firstSentence(a.excerpt));
    setProof(paras[2] ? firstSentence(paras[2]) : (paras[0] ? firstSentence(paras[0]) : ""));
    setProofCred(`— ${a.category}`);
    setCtaQuestion(`Want the full read on ${a.title.toLowerCase().replace(/[.?!]+$/, "")}?`);
    setUrl(`whiterabbitla.com/blog/${a.slug}`);
  };

  const panels: PanelKind[] = ["hook", "blindspot", "reframe", "proof", "cta"];
  const [bgs, setBgs] = useState<(string | null)[]>([null, null, null, null, null]);
  const [slideLogos, setSlideLogos] = useState<SlideLogos[]>(
    panels.map(() => ({ top: "rabbit", bottom: "wordmark" }))
  );

  // Global controls (mirror Story Mode)
  const [overlayOpacity, setOverlayOpacity] = useState(55);
  const [logoScale, setLogoScale] = useState(100);
  const [textScale, setTextScale] = useState(100);

  const [customPhotos, setCustomPhotos] = useState<PhotoItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [activePanel, setActivePanel] = useState<number>(0);

  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const setBgFor = (i: number, src: string | null) => setBgs((prev) => prev.map((v, j) => (i === j ? src : v)));
  const setLogoFor = (i: number, key: "top" | "bottom", val: LogoKind) =>
    setSlideLogos((prev) => prev.map((s, j) => (i === j ? { ...s, [key]: val } : s)));

  const downloadOne = useCallback(async (idx: number) => {
    const el = refs[idx].current;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { width: W, height: H, pixelRatio: 1, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `wr-carousel-${idx + 1}-${panels[idx]}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      toast({ title: `Panel ${idx + 1} failed`, variant: "destructive" });
    }
  }, []);

  const downloadAll = useCallback(async () => {
    setExporting(true);
    for (let i = 0; i < refs.length; i++) {
      await downloadOne(i);
      await new Promise((r) => setTimeout(r, 400));
    }
    setExporting(false);
    toast({ title: "All 5 panels downloaded" });
  }, [downloadOne]);

  const panelProps = (kind: PanelKind, i: number, isExport: boolean): PanelProps => ({
    kind, hook, blindSpot, reframe, proof, proofCred, ctaQuestion, keyword, url,
    bgs, idx: i, overlayOpacity, logoScale, textScale, slideLogos: slideLogos[i], isExport,
  });

  const LOGO_OPTIONS: { val: LogoKind; label: string }[] = [
    { val: "rabbit", label: "Rabbit" },
    { val: "wordmark", label: "Script" },
    { val: "none", label: "None" },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT: Inputs */}
          <div className="space-y-6">
            {/* Global controls */}
            <div className="border border-accent/40 p-4 space-y-4 bg-accent/5">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent">Global Controls (all panels)</p>
              <div>
                <label className="flex justify-between font-sans text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                  <span>Photo Darkness</span><span>{overlayOpacity}%</span>
                </label>
                <input type="range" min={0} max={100} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full accent-accent" />
              </div>
              <div>
                <label className="flex justify-between font-sans text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                  <span>Logo Size</span><span>{logoScale}%</span>
                </label>
                <input type="range" min={50} max={180} value={logoScale} onChange={(e) => setLogoScale(Number(e.target.value))} className="w-full accent-accent" />
              </div>
              <div>
                <label className="flex justify-between font-sans text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                  <span>Text Size</span><span>{textScale}%</span>
                </label>
                <input type="range" min={60} max={150} value={textScale} onChange={(e) => setTextScale(Number(e.target.value))} className="w-full accent-accent" />
              </div>
            </div>

            {/* Article source */}
            <div className="border border-border p-4 space-y-3">
              <label className="block font-sans text-xs tracking-[0.3em] uppercase text-accent">Pull From Article (optional)</label>
              <select
                value={selectedSlug}
                onChange={(e) => applyArticle(e.target.value)}
                className="w-full bg-background border border-border text-foreground font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent"
              >
                <option value="">— Custom copy —</option>
                {blogArticles.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.category} · {a.title}</option>
                ))}
              </select>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Auto-fills all 5 panels. You can still edit each below.</p>
            </div>

            {/* Copy fields */}
            {[
              { label: "Panel 1 — Hook", value: hook, set: setHook, rows: 3 },
              { label: "Panel 2 — Blind Spot", value: blindSpot, set: setBlindSpot, rows: 3 },
              { label: "Panel 3 — Reframe (quotable)", value: reframe, set: setReframe, rows: 3 },
              { label: "Panel 4 — Proof", value: proof, set: setProof, rows: 3 },
              { label: "Panel 4 — Credibility line (optional)", value: proofCred, set: setProofCred, rows: 2 },
              { label: "Panel 5 — CTA Question", value: ctaQuestion, set: setCtaQuestion, rows: 3 },
            ].map((f) => (
              <div key={f.label}>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">{f.label}</label>
                <textarea value={f.value} onChange={(e) => f.set(e.target.value)} rows={f.rows} className="w-full bg-background border border-border text-foreground font-serif text-base px-4 py-3 focus:outline-none focus:border-accent resize-none" />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">Keyword</label>
                <input value={keyword} onChange={(e) => setKeyword(e.target.value.toUpperCase())} className="w-full bg-background border border-border font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">URL</label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-background border border-border font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent" />
              </div>
            </div>

            {/* Per-panel photo & logo controls */}
            <div className="border border-border p-4 space-y-4">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent">Per-Panel Settings</p>
              <div className="flex flex-wrap gap-2">
                {panels.map((k, i) => (
                  <button
                    key={k}
                    onClick={() => setActivePanel(i)}
                    className={`font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-2 border ${activePanel === i ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:text-accent hover:border-accent"}`}
                  >
                    {i + 1}. {PANEL_LABELS[k]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Top Logo</p>
                  <div className="flex gap-1">
                    {LOGO_OPTIONS.map((o) => (
                      <button
                        key={o.val}
                        onClick={() => setLogoFor(activePanel, "top", o.val)}
                        className={`flex-1 font-sans text-[10px] tracking-[0.2em] uppercase px-2 py-2 border ${slideLogos[activePanel].top === o.val ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:border-accent"}`}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Bottom Logo</p>
                  <div className="flex gap-1">
                    {LOGO_OPTIONS.map((o) => (
                      <button
                        key={o.val}
                        onClick={() => setLogoFor(activePanel, "bottom", o.val)}
                        className={`flex-1 font-sans text-[10px] tracking-[0.2em] uppercase px-2 py-2 border ${slideLogos[activePanel].bottom === o.val ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:border-accent"}`}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <PhotoPicker
                label={`Panel ${activePanel + 1} Background Photo (optional)`}
                brandPhotos={brandPhotos}
                password={password}
                customPhotos={customPhotos}
                setCustomPhotos={setCustomPhotos}
                selected={bgs[activePanel]}
                setSelected={(src) => setBgFor(activePanel, src)}
              />
            </div>

            <button
              onClick={downloadAll}
              disabled={exporting}
              className="w-full font-sans text-sm tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Download All 5 Panels"}
            </button>
          </div>

          {/* RIGHT: Previews */}
          <div className="space-y-6">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground">Live Previews — 1080×1350</p>
            {panels.map((kind, i) => (
              <div key={kind} className="space-y-2">
                <button onClick={() => setActivePanel(i)} className={`font-sans text-[10px] tracking-[0.25em] uppercase ${activePanel === i ? "text-accent" : "text-muted-foreground"}`}>Panel {i + 1} — {PANEL_LABELS[kind]} {activePanel === i ? "•" : ""}</button>
                <div className={`border overflow-hidden mx-auto ${activePanel === i ? "border-accent" : "border-border"}`} style={{ aspectRatio: "4 / 5", maxWidth: 360 }}>
                  <div style={{ width: W, height: H, transform: `scale(${360 / W})`, transformOrigin: "top left" }}>
                    {renderPanel(panelProps(kind, i, false))}
                  </div>
                </div>
                <button
                  onClick={() => downloadOne(i)}
                  className="w-full font-sans text-xs tracking-[0.2em] uppercase border border-accent text-accent px-6 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Download Panel {i + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden full-res render targets */}
      <div style={{ position: "absolute", left: "-99999px", top: 0 }}>
        {panels.map((kind, i) => (
          <div key={kind} ref={refs[i]}>
            {renderPanel(panelProps(kind, i, true))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CarouselGenerator;
