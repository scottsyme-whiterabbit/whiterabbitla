import satori from "npm:satori@0.12.1";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";

let wasmInitialized = false;
let fontCache: ArrayBuffer | null = null;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmUrl =
    "https://unpkg.com/@aspect-build/resvg-wasm@0.1.0/resvg.wasm";
  const res = await fetch(wasmUrl);
  await initWasm(await res.arrayBuffer());
  wasmInitialized = true;
}

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(
    "https://whiterabbitla.com/fonts/Ogg-Medium.ttf"
  );
  if (!res.ok) throw new Error("Font fetch failed");
  fontCache = await res.arrayBuffer();
  return fontCache;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title") || "White Rabbit Magic";

    const [font] = await Promise.all([loadFont(), ensureWasm()]);

    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#2D4A3E",
            padding: "60px 80px",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  color: "white",
                  fontSize: title.length > 50 ? 44 : 56,
                  fontFamily: "Ogg",
                  textAlign: "center",
                  lineHeight: 1.3,
                  maxWidth: "1000px",
                },
                children: title,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 16,
                  letterSpacing: "8px",
                  marginTop: "48px",
                  fontFamily: "Ogg",
                },
                children: "WHITE RABBIT",
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Ogg",
            data: font as ArrayBuffer,
            style: "normal" as const,
            weight: 500,
          },
        ],
      }
    );

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width" as const, value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    // Fallback: redirect to default static OG image
    return Response.redirect("https://whiterabbitla.com/og-image.jpg", 302);
  }
});
