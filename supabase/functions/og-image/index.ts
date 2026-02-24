const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title") || "White Rabbit Magic";

    // Generate an SVG-based OG image (1200x630)
    const fontSize = title.length > 50 ? 44 : 56;
    const lines = wrapText(title, fontSize > 50 ? 28 : 22);

    const textY = 315 - (lines.length * fontSize * 1.3) / 2;

    const textElements = lines
      .map(
        (line, i) =>
          `<text x="600" y="${textY + i * fontSize * 1.3}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`
      )
      .join("\n    ");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#2D4A3E"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  ${textElements}
  <text x="600" y="${textY + lines.length * fontSize * 1.3 + 48}" font-family="Georgia, 'Times New Roman', serif" font-size="16" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="8">WHITE RABBIT</text>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    return Response.redirect("https://whiterabbitla.com/og-image.jpg", 302);
  }
});

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}