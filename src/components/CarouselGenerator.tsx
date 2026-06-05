import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { toast } from "@/hooks/use-toast";
import wrSecondaryLogo from "@/assets/wr-secondary-logo.png";
import { DrivePhotoBank } from "@/components/DrivePhotoBank";

// Brand tokens
const forestDark = "#223D34";
const cream = "#F8F5F0";
const gold = "#C8963E";

const W = 1080;
const H = 1350;

type PanelKind = "hook" | "blindspot" | "reframe" | "proof" | "cta";

interface PhotoItem { src: string; label: string }

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
  bg1: string | null;
  bg4: string | null;
  isExport: boolean;
}

const Logo = ({ color }: { color: "cream" | "emerald" }) => (
  <img
    src={wrSecondaryLogo}
    alt="White Rabbit Los Angeles"
    crossOrigin="anonymous"
    style={{
      height: 64,
      objectFit: "contain",
      filter: color === "cream" ? "brightness(0) invert(1)" : "brightness(0) saturate(100%) invert(18%) sepia(15%) saturate(900%) hue-rotate(100deg) brightness(95%) contrast(90%)",
    }}
  />
);

const PanelFrame = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
  <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: bg, fontFamily: "'Ogg', Georgia, serif", display: "flex", flexDirection: "column" }}>
    {children}
  </div>
);

const LogoRow = ({ color }: { color: "cream" | "emerald" }) => (
  <div style={{ display: "flex", justifyContent: "center", paddingTop: 70, paddingBottom: 20 }}>
    <Logo color={color} />
  </div>
);

const renderPanel = ({ kind, hook, blindSpot, reframe, proof, proofCred, ctaQuestion, keyword, url, bg1, bg4, isExport }: PanelProps) => {
  switch (kind) {
    case "hook":
      return (
        <PanelFrame bg={forestDark}>
          {bg1 && (
            <img src={bg1} alt="" {...(isExport ? { crossOrigin: "anonymous" as const } : {})} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${forestDark}AA 0%, ${forestDark}E6 100%)` }} />
          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>
            <LogoRow color="cream" />
            <div style={{ flex: 1 }} />
            <div style={{ padding: "0 90px 140px" }}>
              <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 72, lineHeight: 1.12, color: cream, margin: 0, fontWeight: 400 }}>{hook}</p>
            </div>
          </div>
        </PanelFrame>
      );
    case "blindspot":
      return (
        <PanelFrame bg={cream}>
          <LogoRow color="emerald" />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 110px" }}>
            <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 56, lineHeight: 1.25, color: forestDark, margin: 0, textAlign: "center", fontWeight: 400 }}>{blindSpot}</p>
          </div>
          <div style={{ height: 100 }} />
        </PanelFrame>
      );
    case "reframe":
      return (
        <PanelFrame bg={forestDark}>
          <LogoRow color="cream" />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 100px" }}>
            <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 64, lineHeight: 1.22, color: cream, margin: 0, textAlign: "center", fontWeight: 400 }}>{reframe}</p>
          </div>
          <div style={{ height: 100 }} />
        </PanelFrame>
      );
    case "proof":
      return (
        <PanelFrame bg={cream}>
          <div style={{ position: "relative", width: "100%", height: "55%", background: forestDark }}>
            {bg4 && (
              <img src={bg4} alt="" {...(isExport ? { crossOrigin: "anonymous" as const } : {})} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${forestDark}55 0%, ${forestDark}11 60%)` }} />
            <div style={{ position: "relative", display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <Logo color="cream" />
            </div>
          </div>
          <div style={{ flex: 1, padding: "60px 90px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 44, lineHeight: 1.3, color: forestDark, margin: 0, fontWeight: 400 }}>{proof}</p>
            {proofCred && (
              <p style={{ fontFamily: "'Ogg', Georgia, serif", fontStyle: "italic", fontSize: 24, lineHeight: 1.4, color: forestDark, opacity: 0.7, marginTop: 24 }}>{proofCred}</p>
            )}
          </div>
        </PanelFrame>
      );
    case "cta":
      return (
        <PanelFrame bg={forestDark}>
          <LogoRow color="cream" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 100px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 56, lineHeight: 1.25, color: cream, margin: 0, fontWeight: 400 }}>{ctaQuestion}</p>
            <div style={{ width: 80, height: 2, background: gold, margin: "50px auto" }} />
            <p style={{ fontFamily: "'Ogg', Georgia, serif", fontSize: 40, lineHeight: 1.3, color: cream, margin: 0 }}>
              Comment <span style={{ color: gold, fontWeight: 700 }}>{keyword || "READ"}</span> for the full read.
            </p>
          </div>
          <div style={{ paddingBottom: 80, textAlign: "center" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, letterSpacing: "0.35em", color: cream, opacity: 0.85, margin: 0, textTransform: "uppercase" }}>{url}</p>
          </div>
        </PanelFrame>
      );
  }
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
  setSelected: (src: string) => void;
}) => {
  const uploadRef = useRef<HTMLInputElement>(null);
  const all = [...brandPhotos, ...customPhotos];
  return (
    <div className="border border-border p-4 space-y-3">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent">{label}</p>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[260px] overflow-y-auto pr-1">
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

const CarouselGenerator = ({ brandPhotos, password }: Props) => {
  const [hook, setHook] = useState("At ultra-luxury hotels under 50 keys, if the crowd is uninteresting, you'll feel it.");
  const [blindSpot, setBlindSpot] = useState("Most operators cannot give a precise answer to the question: who is your guest?");
  const [reframe, setReframe] = useState("Brand attracts a type. Room mix determines the proportion. Most have only invested in the first.");
  const [proof, setProof] = useState("The best private rooms have achieved longevity through thoughtfulness over who belongs.");
  const [proofCred, setProofCred] = useState("");
  const [ctaQuestion, setCtaQuestion] = useState("Who is responsible for guest curation at your next event: the planner, the venue, or both?");
  const [keyword, setKeyword] = useState("MIX");
  const [url, setUrl] = useState("whiterabbitla.com");
  const [bg1, setBg1] = useState<string | null>(null);
  const [bg4, setBg4] = useState<string | null>(null);
  const [customPhotos, setCustomPhotos] = useState<PhotoItem[]>([]);
  const [exporting, setExporting] = useState(false);

  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const panels: PanelKind[] = ["hook", "blindspot", "reframe", "proof", "cta"];

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

  const panelProps = (kind: PanelKind, isExport: boolean): PanelProps => ({
    kind, hook, blindSpot, reframe, proof, proofCred, ctaQuestion, keyword, url, bg1, bg4, isExport,
  });

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT: Inputs */}
          <div className="space-y-6">
            {[
              { label: "Panel 1 — Hook", value: hook, set: setHook, rows: 3 },
              { label: "Panel 2 — Blind Spot", value: blindSpot, set: setBlindSpot, rows: 3 },
              { label: "Panel 3 — Reframe (quotable)", value: reframe, set: setReframe, rows: 3 },
              { label: "Panel 4 — Proof", value: proof, set: setProof, rows: 3 },
              { label: "Panel 4 — Credibility line (optional, italic)", value: proofCred, set: setProofCred, rows: 2 },
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

            <PhotoPicker
              label="Panel 1 Background Photo"
              brandPhotos={brandPhotos}
              password={password}
              customPhotos={customPhotos}
              setCustomPhotos={setCustomPhotos}
              selected={bg1}
              setSelected={setBg1}
            />
            <PhotoPicker
              label="Panel 4 Background Photo"
              brandPhotos={brandPhotos}
              password={password}
              customPhotos={customPhotos}
              setCustomPhotos={setCustomPhotos}
              selected={bg4}
              setSelected={setBg4}
            />

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
                <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-accent">Panel {i + 1} — {kind}</p>
                <div className="border border-border overflow-hidden mx-auto" style={{ aspectRatio: "4 / 5", maxWidth: 360 }}>
                  <div style={{ width: W, height: H, transform: `scale(${360 / W})`, transformOrigin: "top left" }}>
                    {renderPanel(panelProps(kind, false))}
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
            {renderPanel(panelProps(kind, true))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CarouselGenerator;
