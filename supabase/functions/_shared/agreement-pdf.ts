import { type Invoice, money } from "./invoice-email.ts";

/** Render the signed agreement to a PDF. Returns base64, or null on any failure. */
export async function buildAgreementPdf(inv: Invoice, agreementText: string): Promise<string | null> {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import("https://esm.sh/pdf-lib@1.17.1");
    const doc = await PDFDocument.create();
    const serif = await doc.embedFont(StandardFonts.TimesRoman);
    const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const ink = rgb(0.13, 0.24, 0.20);

    const W = 612, H = 792, M = 56;
    const maxW = W - M * 2;
    let page = doc.addPage([W, H]);
    let y = H - M;

    const wrap = (text: string, font: any, size: number) => {
      const out: string[] = [];
      for (const raw of String(text ?? "").split("\n")) {
        const words = raw.replace(/\r/g, "").split(/\s+/).filter(Boolean);
        if (!words.length) { out.push(""); continue; }
        let line = "";
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (font.widthOfTextAtSize(test, size) > maxW) { out.push(line); line = w; }
          else line = test;
        }
        if (line) out.push(line);
      }
      return out;
    };

    const draw = (text: string, size: number, font: any, gap = 4) => {
      for (const line of wrap(text, font, size)) {
        if (y < M + size) { page = doc.addPage([W, H]); y = H - M; }
        // pdf-lib's standard fonts are WinAnsi-only; strip anything they can't encode.
        const safe = line.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
        page.drawText(safe, { x: M, y, size, font, color: ink });
        y -= size + gap;
      }
    };

    draw("White Rabbit Agreement & Reservation Invoice", 17, serifBold, 10);
    y -= 6;
    const meta = [
      `Client: ${inv.client_name || "-"}`,
      `Event: ${inv.event_type || "-"}`,
      `Date: ${inv.event_date || "-"}`,
      `Venue: ${inv.venue || "-"}`,
      `Experience: ${inv.tier_name || "-"}`,
      `Total: ${money(inv.total_cents)}`,
    ];
    for (const m of meta) draw(m, 11, serif, 3);
    y -= 12;
    draw(agreementText, 10.5, serif, 3);

    const bytes = await doc.save();
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  } catch (e) {
    console.error("agreement PDF generation failed", e);
    return null;
  }
}
