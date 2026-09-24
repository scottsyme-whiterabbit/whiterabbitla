// Convert email bodies (HTML and/or quoted-printable) into readable plain text.
// Pure string code: no Deno or browser APIs, so it can be reused anywhere.

const NAMED: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'",
  rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201D", ldquo: "\u201C",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", copy: "\u00A9",
  reg: "\u00AE", trade: "\u2122", bull: "\u2022", middot: "\u00B7",
  zwnj: "", zwj: "", shy: "", ensp: " ", emsp: " ", thinsp: " ",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
      if (code === 0x200c || code === 0x200b || code === 0x034f || code === 0xfeff) return "";
      try { return String.fromCodePoint(code); } catch { return ""; }
    }
    const v = NAMED[e.toLowerCase()];
    return v !== undefined ? v : m;
  });
}

export function looksQuotedPrintable(s: string): boolean {
  return /=(3D|0A|0D|20|E2|C2|[0-9A-F]{2}=\r?\n)/.test(s) || /=\r?\n/.test(s) && /=[0-9A-F]{2}/.test(s);
}

export function decodeQuotedPrintable(s: string): string {
  const joined = s.replace(/=\r?\n/g, ""); // soft line breaks
  // Decode runs of =XX as UTF-8 bytes
  return joined.replace(/(?:=[0-9A-Fa-f]{2})+/g, (run) => {
    const bytes = new Uint8Array(run.length / 3);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(run.slice(i * 3 + 1, i * 3 + 3), 16);
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    }
  });
}

export function looksHtml(s: string): boolean {
  return /<div|<table|<!doctype|style=|<p[\s>]|<br|<html|<span|<a\s/i.test(s);
}

export function htmlToText(input: string): string {
  let s = input;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|head|title|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  s = s.replace(/<a\b[^>]*?href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi,
    (_m, _q, h1, h2, h3, label) => {
      const href = decodeEntities((h1 ?? h2 ?? h3 ?? "").trim());
      const text = decodeEntities(String(label).replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
      if (!href || /^(mailto:|tel:|#|javascript:)/i.test(href)) return text || href.replace(/^(mailto:|tel:)/i, "");
      if (!text) return href;
      const norm = (x: string) => x.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
      return norm(text) === norm(href) ? text : `${text} (${href})`;
    });
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n• ");
  s = s.replace(/<\/(p|div|tr|table|h[1-6]|li|ul|ol|blockquote|section|article|header|footer|center|pre|form)\s*>/gi, "\n");
  s = s.replace(/<(p|div|tr|h[1-6]|blockquote|table)\b[^>]*>/gi, "\n");
  s = s.replace(/<\/t[dh]\s*>/gi, " ");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  return s;
}

function tidy(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00A0\u200B\u200C\u034F\uFEFF]/g, (c) => (c === "\u00A0" ? " " : ""))
    .replace(/[ \t]+/g, " ")
    .split("\n").map((l) => l.trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Clean any stored/received body into readable plain text. */
export function cleanEmailBody(raw: string, isHtml?: boolean): string {
  if (!raw) return "";
  let s = raw;
  if (looksQuotedPrintable(s)) s = decodeQuotedPrintable(s);
  if (isHtml || looksHtml(s)) s = htmlToText(s);
  return tidy(s);
}
