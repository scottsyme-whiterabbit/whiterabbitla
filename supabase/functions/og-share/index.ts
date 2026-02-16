Deno.serve(async (req) => {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url") || "https://whiterabbitla.com";
  const title = url.searchParams.get("t") || "White Rabbit LA | Luxury Magic Entertainment";
  const description = url.searchParams.get("d") || "Bespoke magical experiences for the world's most discerning audiences.";
  const image = url.searchParams.get("i") || "https://whiterabbitla.com/og-image.jpg";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(targetUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="White Rabbit Los Angeles">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(targetUrl)}">
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#2c3830;color:#f5f0e8}a{color:#c9a96e}</style>
</head>
<body>
<p>Redirecting to <a href="${esc(targetUrl)}">White Rabbit Los Angeles</a>…</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
