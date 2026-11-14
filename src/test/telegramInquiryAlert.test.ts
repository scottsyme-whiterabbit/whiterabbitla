import { describe, it, expect, vi } from "vitest";
import {
  buildInquiryAlert, notifyInquiryTelegram, visibleLength, telegramPhone, alertDate, messageField,
  inquiryAlertKey, CONTINUED, TELEGRAM_LIMIT, type AlertStore,
} from "../../supabase/functions/_shared/telegram-inquiry";

const DEAL = "16e6d8e0-c2c7-48e6-a06b-4f59ccf87834";
const full = {
  name: "Jane Doe", email: "jane@example.com", phone: "(310) 555-0123", clientType: "Private Host",
  eventType: "Wedding", date: "2027-06-12", guestCount: "80", budget: "$2,000 to $3,000",
  location: "Hollywood", foundUs: "Google", message: "Cocktail hour at the Roosevelt.\n\nAlso a note: we love card tricks!",
  dealId: DEAL,
};

function memoryStore(initial: string[] = []) {
  const rows = new Map<string, string>(initial.map((k) => [k, "sent"]));
  const store: AlertStore = {
    claim: vi.fn(async (k: string) => (rows.has(k) ? "duplicate" : (rows.set(k, "sending"), "claimed"))),
    finish: vi.fn(async (k: string, status: "sent" | "unknown") => { rows.set(k, status); }),
    release: vi.fn(async (k: string) => { rows.delete(k); }),
  };
  return { store, rows };
}
const okFetch = () => vi.fn(async () => new Response(JSON.stringify({ ok: true, result: { message_id: 7 } }), { status: 200 }));
const silent = () => {};

describe("Telegram inquiry alert format", () => {
  it("lays out every detail in the requested order with a CRM link", () => {
    const t = buildInquiryAlert(full);
    expect(t).toBe([
      "🐇 <b>New inquiry</b>",
      "<b>Jane Doe</b>",
      "📞 +1-310-555-0123  ✉️ jane@example.com",
      "Client type: Private Host",
      "Event: Wedding",
      "Date: Saturday, June 12",
      "Guests: 80",
      "Budget: $2,000 to $3,000",
      "Location: Hollywood",
      "Found us: Google",
      "Message:",
      "Cocktail hour at the Roosevelt.\n\nAlso a note: we love card tricks!",
      `<a href="https://whiterabbitla.com/admin/newsletter?tab=today&amp;deal=${DEAL}&amp;email=jane%40example.com">Open in CRM</a>`,
    ].join("\n\n"));
  });

  it("drops lines whose detail is missing and never fills them in", () => {
    const t = buildInquiryAlert({ name: "Sam", email: "sam@example.com", eventType: "Birthday", date: "2027-01-09", location: "Malibu", message: "Hi", phone: "", budget: "  ", guestCount: null });
    expect(t).not.toMatch(/Client type|Guests|Budget|Found us|📞|Open in CRM/);
    expect(t).toContain("✉️ sam@example.com");
    expect(t).not.toMatch(/undefined|null|Not specified|N\/A/);
  });

  it("shows an unreadable date the same way the owner email does", () => {
    expect(alertDate("june")).toBe("date unclear (they wrote: june)");
    expect(buildInquiryAlert({ ...full, date: "sometime in spring" })).toContain("Date: date unclear (they wrote: sometime in spring)");
  });

  it("includes the full message exactly as written", () => {
    const message = "Line one\nLine two\n\n  Indented note, with commas; and symbols * _ ` [ ]\nClosing comment.";
    expect(buildInquiryAlert({ ...full, message })).toContain(message);
  });

  it("escapes HTML in everything the client typed", () => {
    const t = buildInquiryAlert({ ...full, name: "<b>Eve</b> & Co", location: "\"Bel Air\" <script>", message: "Tags <i>here</i> & there" });
    expect(t).toContain("<b>&lt;b&gt;Eve&lt;/b&gt; &amp; Co</b>");
    expect(t).toContain("Location: &quot;Bel Air&quot; &lt;script&gt;");
    expect(t).toContain("Tags &lt;i&gt;here&lt;/i&gt; &amp; there");
    expect(t).not.toContain("<script>");
    expect(t).not.toContain("<i>");
  });

  it("keeps a message under the limit whole, with no continued marker", () => {
    const t = buildInquiryAlert({ ...full, message: "a".repeat(3000) });
    expect(t).toContain("a".repeat(3000));
    expect(t).not.toContain(CONTINUED);
  });

  it("trims only an over-limit message, ends it with the continued marker and stays under 4096", () => {
    const t = buildInquiryAlert({ ...full, message: "word & <tag> ".repeat(800) });
    expect(visibleLength(t)).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(visibleLength(t)).toBeGreaterThan(TELEGRAM_LIMIT - 20);
    expect(t).toContain(`${CONTINUED}\n\n<a href=`);
    expect(t).toContain("Open in CRM");
  });

  it("stays under the limit even when every other field is huge", () => {
    const big = "x".repeat(5000);
    const t = buildInquiryAlert({ ...full, name: big, location: big, clientType: big, foundUs: big, message: big });
    expect(visibleLength(t)).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("formats US phones for tap to call and leaves other numbers as typed", () => {
    expect(telegramPhone("310.555.0123")).toBe("+1-310-555-0123");
    expect(telegramPhone("+1 (424) 394-1850")).toBe("+1-424-394-1850");
    expect(telegramPhone("+44 20 7946 0958")).toBe("+44 20 7946 0958");
    expect(telegramPhone("call after 5")).toBe("call after 5");
  });

  it("reads the quiz's labelled lines", () => {
    const m = "Client Type: Wedding Couple\nHow They Found Us: Instagram\n\nHello";
    expect(messageField(m, "How They Found Us")).toBe("Instagram");
    expect(messageField(m, "Client Type")).toBe("Wedding Couple");
    expect(messageField("Hello", "How They Found Us")).toBe("");
  });
});

describe("Telegram inquiry alert sending", () => {
  it("sends one HTML message to the chat", async () => {
    const { store } = memoryStore();
    const fetchImpl = okFetch();
    const r = await notifyInquiryTelegram(full, { token: "T", chatId: "8126542645", store, fetchImpl, log: silent });
    expect(r).toEqual({ sent: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.chat_id).toBe("8126542645");
    expect(body.parse_mode).toBe("HTML");
    expect(body.text).toBe(buildInquiryAlert(full));
  });

  it("alerts at most once for the same inquiry, even on a retry or double submit", async () => {
    const { store } = memoryStore();
    const fetchImpl = okFetch();
    await notifyInquiryTelegram(full, { token: "T", chatId: "1", store, fetchImpl, log: silent });
    const second = await notifyInquiryTelegram({ ...full, email: " JANE@example.com ", dealId: "another-deal" }, { token: "T", chatId: "1", store, fetchImpl, log: silent });
    expect(second).toEqual({ sent: false, reason: "duplicate" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("treats a different inquiry from the same person as new", async () => {
    expect(await inquiryAlertKey(full)).not.toBe(await inquiryAlertKey({ ...full, date: "2027-07-01" }));
  });

  it("never throws when Telegram errors, and frees the claim for a later retry", async () => {
    const { store, rows } = memoryStore();
    const logs: string[] = [];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: false, description: "Bad Request: chat not found" }), { status: 400 }));
    const r = await notifyInquiryTelegram(full, { token: "SECRET123", chatId: "1", store, fetchImpl, log: (m) => logs.push(m) });
    expect(r).toEqual({ sent: false, reason: "telegram_error" });
    expect(rows.size).toBe(0);
    expect(logs.join(" ")).toContain("chat not found");
  });

  it("never throws on a network failure and never logs the bot token", async () => {
    const { store } = memoryStore();
    const logs: string[] = [];
    const fetchImpl = vi.fn(async () => { throw new TypeError("error sending request for url (https://api.telegram.org/botSECRET123/sendMessage)"); });
    const r = await notifyInquiryTelegram(full, { token: "SECRET123", chatId: "1", store, fetchImpl, log: (m) => logs.push(m) });
    expect(r).toEqual({ sent: false, reason: "send_exception" });
    expect(logs.join(" ")).not.toContain("SECRET123");
  });

  it("gives up quickly when Telegram hangs, and keeps the claim so it cannot ping twice", async () => {
    const { store, rows } = memoryStore();
    const fetchImpl = vi.fn(() => new Promise<Response>(() => {}));
    const started = Date.now();
    const r = await notifyInquiryTelegram(full, { token: "T", chatId: "1", store, fetchImpl, timeoutMs: 50, log: silent });
    expect(r).toEqual({ sent: false, reason: "timeout" });
    expect(Date.now() - started).toBeLessThan(1000);
    expect([...rows.values()]).toEqual(["unknown"]);
  });

  it("never throws when the alert record itself fails", async () => {
    const store: AlertStore = {
      claim: async () => { throw new Error("db down"); },
      finish: async () => { throw new Error("db down"); },
      release: async () => { throw new Error("db down"); },
    };
    const fetchImpl = okFetch();
    await expect(notifyInquiryTelegram(full, { token: "T", chatId: "1", store, fetchImpl, log: silent })).resolves.toEqual({ sent: false, reason: "send_exception" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips quietly when the bot is not set up", async () => {
    const { store } = memoryStore();
    const fetchImpl = okFetch();
    expect(await notifyInquiryTelegram(full, { token: "", chatId: "1", store, fetchImpl, log: silent })).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
