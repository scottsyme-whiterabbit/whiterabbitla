import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import {
  claimQueenCredit, validateClaim, creditExpiry, addTwelveMonths, generateCreditCode, isCreditCode, drawingQuarter,
  buildWelcomeEmail, welcomeThenAlert, drawingPool, pickWinner, randomIndex, pipelineDealFromClaim,
  QUEEN_SOURCE, PIPELINE_SOURCE, CREDIT_CENTS, MIN_PACKAGE_CENTS,
  type ClaimStore, type CreditRow, type StoredCredit, type NewCredit, type WelcomeStore, type QueenClaim,
} from "../../supabase/functions/_shared/find-the-lady";
import { buildLadyAlert, notifyLadyTelegram, type AlertStore } from "../../supabase/functions/_shared/telegram-inquiry";
import { quarterHasEnded, quarterOfDay } from "../../supabase/functions/newsletter-admin/find-the-lady-admin";
import { drawablePoolSize, quarterEnded, recentQuarters } from "@/lib/findTheLadyAdmin";

// 12:02 in Los Angeles on Monday November 16, 2026.
const NOW = new Date("2026-11-16T20:02:00Z");
const claim: QueenClaim = { firstName: "Jane", email: "jane@example.com", occasion: "wedding", timing: "next_3_months", foundQueen: false, marketingOptIn: false };

function memoryDb() {
  const credits: (StoredCredit & CreditRow & { status: string })[] = [];
  let n = 0;
  const store: ClaimStore = {
    findActiveCredit: async (email) => credits.find((c) => c.email === email && c.status === "active") ?? null,
    expireCredit: async (id) => { const c = credits.find((x) => x.id === id); if (c) c.status = "expired"; },
    insertCredit: async (row) => {
      if (credits.some((c) => c.code === row.code)) return { status: "duplicate_code" };
      if (credits.some((c) => c.email === row.email && c.status === "active")) return { status: "duplicate_email" };
      const c = { ...row, id: `credit-${++n}`, status: "active" };
      credits.push(c);
      return { status: "ok", credit: c };
    },
    enterDrawing: async (id, quarter) => {
      const c = credits.find((x) => x.id === id);
      if (c) { c.drawing_entry = true; c.drawing_quarter = quarter; c.found_queen = true; }
    },
  };
  return { store, credits };
}

const deps = (db: ReturnType<typeof memoryDb>, followUp: (c: NewCredit) => unknown = () => {}) => ({ store: db.store, now: NOW, followUp });

describe("Find the Queen claim", () => {
  it("issues a LIGHTS-UP code with four digits", async () => {
    const res = await claimQueenCredit(claim, deps(memoryDb()));
    expect(res.code).toMatch(/^LIGHTS-UP-[0-9]{4}$/);
    expect(isCreditCode(res.code)).toBe(true);
    expect(isCreditCode("WR500-ABCD")).toBe(false);
    expect(generateCreditCode(() => new Uint8Array([0, 7]))).toBe("LIGHTS-UP-0007");
  });

  it("is a $250 credit on packages of $2,500 or more, valid 12 months", async () => {
    const db = memoryDb();
    const res = await claimQueenCredit(claim, deps(db));
    expect(CREDIT_CENTS).toBe(25000);
    expect(MIN_PACKAGE_CENTS).toBe(250000);
    expect(db.credits[0]).toMatchObject({ credit_cents: 25000, min_package_cents: 250000 });
    expect(res.expiresOn).toBe("2027-11-16");
    expect(creditExpiry(new Date("2027-01-01T07:00:00Z"))).toBe("2027-12-31");
    expect(addTwelveMonths("2028-02-29")).toBe("2029-02-28");
  });

  it("saves occasion, timing and source to the Find the Lady list", async () => {
    const db = memoryDb();
    await claimQueenCredit(claim, deps(db));
    expect(db.credits[0]).toMatchObject({ source: QUEEN_SOURCE, event_type: "wedding", event_timing: "next_3_months", first_name: "Jane", email: "jane@example.com" });
  });

  it("stores marketing opt-in only from the checkbox", async () => {
    const off = memoryDb();
    await claimQueenCredit(claim, deps(off));
    expect(off.credits[0].marketing_opt_in).toBe(false);
    const on = memoryDb();
    await claimQueenCredit({ ...claim, marketingOptIn: true }, deps(on));
    expect(on.credits[0].marketing_opt_in).toBe(true);
    expect(validateClaim({ firstName: "Jane", email: "jane@example.com", occasion: "wedding", timing: "this_month", marketingOptIn: "yes" })).toMatchObject({ ok: true, value: { marketingOptIn: false } });
  });

  it("enters the drawing only when the guest found the Queen", async () => {
    const missed = memoryDb();
    const a = await claimQueenCredit(claim, deps(missed));
    expect(missed.credits[0]).toMatchObject({ found_queen: false, drawing_entry: false, drawing_quarter: null });
    expect(a.drawingEntry).toBe(false);
    const found = memoryDb();
    const b = await claimQueenCredit({ ...claim, foundQueen: true }, deps(found));
    expect(found.credits[0]).toMatchObject({ found_queen: true, drawing_entry: true, drawing_quarter: "2026 Q4" });
    expect(b.drawingEntry).toBe(true);
  });

  it("gets the same code for the same email, once, with one email and one alert", async () => {
    const db = memoryDb();
    const followUp = vi.fn();
    const first = await claimQueenCredit(claim, deps(db, followUp));
    const second = await claimQueenCredit({ ...claim, foundQueen: true }, deps(db, followUp));
    expect(followUp).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ code: first.code, existing: true, drawingEntry: true });
    expect(db.credits).toHaveLength(1);
    expect(db.credits[0].drawing_quarter).toBe("2026 Q4");
  });

  it("saves the claim even if the email or alert step fails to start", async () => {
    const db = memoryDb();
    const res = await claimQueenCredit(claim, deps(db, () => { throw new Error("boom"); }));
    expect(db.credits).toHaveLength(1);
    expect(res.code).toBe(db.credits[0].code);
  });

  it("retries when a generated code is already taken", async () => {
    const db = memoryDb();
    let call = 0;
    const randomBytes = () => new Uint8Array(call++ < 2 ? [0, 5] : [0, 9]);
    await claimQueenCredit(claim, { ...deps(db), randomBytes });
    const res = await claimQueenCredit({ ...claim, email: "sam@example.com" }, { ...deps(db), randomBytes });
    expect(res.code).toBe("LIGHTS-UP-0009");
  });

  it("files entries under the Los Angeles calendar quarter", () => {
    expect(drawingQuarter(NOW)).toBe("2026 Q4");
    expect(drawingQuarter(new Date("2027-04-01T05:00:00Z"))).toBe("2027 Q1");
    expect(drawingQuarter(new Date("2027-04-01T08:00:00Z"))).toBe("2027 Q2");
  });

  it("needs a first name, a valid email, an occasion and a timing", () => {
    const ok = { firstName: " Jane ", email: "Jane@Example.com", occasion: "corporate", timing: "later_this_year", foundQueen: true };
    expect(validateClaim(ok)).toEqual({ ok: true, value: { firstName: "Jane", email: "jane@example.com", occasion: "corporate", timing: "later_this_year", foundQueen: true, marketingOptIn: false } });
    expect(validateClaim({ ...ok, firstName: "" }).ok).toBe(false);
    expect(validateClaim({ ...ok, email: "jane@example" }).ok).toBe(false);
    expect(validateClaim({ ...ok, occasion: "mobile_bar" }).ok).toBe(false);
    expect(validateClaim({ ...ok, timing: undefined }).ok).toBe(false);
    expect(validateClaim({ ...ok, website: "http://spam" })).toEqual({ ok: false, bot: true });
  });
});

describe("Move to pipeline", () => {
  it("creates a New deal under its own source, so it shows in the pipeline", () => {
    const d = pipelineDealFromClaim({ email: "jane@example.com", first_name: "Jane", code: "LIGHTS-UP-0427", expires_on: "2027-11-16", event_type: "holiday_party", event_timing: "this_month", found_queen: true });
    expect(d).toMatchObject({ stage: "new", source: PIPELINE_SOURCE, contact_email: "jane@example.com", event_type: "private_party" });
    expect(PIPELINE_SOURCE).not.toBe(QUEEN_SOURCE);
    expect(d.notes).toContain("LIGHTS-UP-0427");
  });
});

describe("Quarterly drawing", () => {
  const claims = [
    { id: "c1", first_name: "Ann", email: "ann@example.com", drawing_entry: true, drawing_quarter: "2026 Q4", status: "active" },
    { id: "c2", first_name: "Bo", email: "bo@example.com", drawing_entry: false, drawing_quarter: null, status: "active" },
    { id: "c3", first_name: "Cy", email: "cy@example.com", drawing_entry: true, drawing_quarter: "2026 Q3", status: "active" },
  ];
  const alternates = [
    { id: "a1", first_name: "Di", email: "di@example.com", quarter: "2026 Q4" },
    { id: "a2", first_name: "Ann", email: "ANN@example.com", quarter: "2026 Q4" },
  ];

  it("counts Queen finders and free entries for that quarter, one per email", () => {
    const pool = drawingPool(claims, alternates, "2026 Q4");
    expect(pool.map((e) => e.id)).toEqual(["c1", "a1"]);
    expect(drawablePoolSize(claims, alternates, "2026 Q4")).toBe(2);
  });

  it("picks one winner at random, every entry equally likely", () => {
    const pool = drawingPool(claims, alternates, "2026 Q4");
    expect(pickWinner(pool, () => 0).id).toBe("c1");
    expect(pickWinner(pool, () => 1).id).toBe("a1");
    const hits = [0, 0, 0];
    for (let i = 0; i < 3000; i++) hits[randomIndex(3)]++;
    for (const h of hits) expect(h).toBeGreaterThan(800);
    expect(() => randomIndex(0)).toThrow();
  });

  it("opens a quarter's drawing only once that quarter has ended", () => {
    expect(quarterHasEnded("2026 Q3", NOW)).toBe(true);
    expect(quarterHasEnded("2026 Q4", NOW)).toBe(false);
    expect(quarterEnded("2026 Q3", "2026 Q4")).toBe(true);
    expect(quarterEnded("2026 Q4", "2026 Q4")).toBe(false);
    expect(recentQuarters("2027 Q1", 3)).toEqual(["2027 Q1", "2026 Q4", "2026 Q3"]);
    expect(quarterOfDay("2026-12-31")).toBe("2026 Q4");
    expect(quarterOfDay("2027-01-01")).toBe("2027 Q1");
  });
});

describe("Find the Queen welcome email", () => {
  const credit: NewCredit = { creditId: "c1", code: "LIGHTS-UP-0427", expiresOn: "2027-11-16", firstName: "Jane", email: "jane@example.com", occasion: "wedding", timing: "this_month", foundQueen: false, quarter: "2026 Q4" };

  it("thanks them and carries the code, the expiry and the Official Rules link", () => {
    const m = buildWelcomeEmail(credit);
    expect(m.to).toBe("jane@example.com");
    expect(m.text).toMatch(/thank you/i);
    expect(m.text).toContain("LIGHTS-UP-0427");
    expect(m.text).toContain("November 16, 2027");
    expect(m.text).toContain("whiterabbitla.com/official-rules");
    expect(m.html).toContain("https://whiterabbitla.com/official-rules");
    expect(m.text).toContain("Scott Syme\nMagician\n(424) 394-1850\nwhiterabbitla.com");
    expect(m.unsubscribeUrl).toBe("https://whiterabbitla.com/unsubscribe?email=jane%40example.com");
  });

  it("never mentions a price or dollar amount", () => {
    for (const foundQueen of [true, false]) {
      const m = buildWelcomeEmail({ ...credit, foundQueen });
      expect(m.subject + m.text + m.html).not.toMatch(/\$|dollar|2,500|250\b/i);
      expect(m.subject + m.text).not.toMatch(/[—–]|reaching out|checking in/i);
    }
  });

  it("tells Queen finders they are in the drawing", () => {
    expect(buildWelcomeEmail({ ...credit, foundQueen: true }).text).toContain("you are entered in this quarter's drawing");
    expect(buildWelcomeEmail(credit).text).not.toContain("you are entered");
  });

  function welcomeStore() {
    const state: Record<string, string | null> = {};
    const store: WelcomeStore = {
      claimWelcome: async (id) => (state[id] ? false : ((state[id] = "sending"), true)),
      markWelcomeSent: async (id) => { state[id] = "sent"; },
      releaseWelcome: async (id) => { if (state[id] === "sending") state[id] = null; },
    };
    return { store, state };
  }

  it("sends once, then sends the single alert with the result", async () => {
    const w = welcomeStore();
    const send = vi.fn(async () => ({ sent: true }));
    const notify = vi.fn(async () => {});
    expect(await welcomeThenAlert(credit, { store: w.store, send, notify })).toBe("sent");
    expect(await welcomeThenAlert(credit, { store: w.store, send, notify })).toBe("already_sent");
    expect(send).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenNthCalledWith(1, credit, "sent");
  });

  it("rolls the claim back when the send fails, and still alerts Scott", async () => {
    const w = welcomeStore();
    const notify = vi.fn(async () => {});
    const status = await welcomeThenAlert(credit, { store: w.store, send: async () => ({ sent: false, reason: "provider_error" }), notify });
    expect(status).toBe("not_sent:provider_error");
    expect(w.state.c1).toBeNull();
    expect(notify).toHaveBeenCalledWith(credit, "not_sent:provider_error");
  });
});

describe("Find the Lady alert", () => {
  const alert = { creditId: "c1", code: "LIGHTS-UP-0427", firstName: "Jane", occasion: "Wedding", timing: "Next 3 months", foundQueen: true, welcome: "sent" };

  it("is labeled Find the Lady with name, occasion, timing, found and code, and no email or phone", () => {
    const t = buildLadyAlert(alert);
    expect(t.split("\n")[0]).toContain("Find the Lady");
    expect(t).toContain("Jane");
    expect(t).toContain("Occasion: Wedding");
    expect(t).toContain("Timing: Next 3 months");
    expect(t).toContain("Found the Queen: yes");
    expect(t).toContain("Code: LIGHTS-UP-0427");
    expect(buildLadyAlert({ ...alert, foundQueen: false })).toContain("Found the Queen: no");
    expect(t).not.toMatch(/@|%40|📞|✉️|email=/i);
    expect(t).not.toMatch(/[—–]/);
  });

  it("flags a welcome email that did not go out", () => {
    expect(buildLadyAlert({ ...alert, welcome: "not_sent:provider_error" })).toContain("NOT sent");
  });

  it("sends the Telegram message once for a claim even if the alert is retried", async () => {
    const keys = new Set<string>();
    const store: AlertStore = {
      claim: async (k) => (keys.has(k) ? "duplicate" : (keys.add(k), "claimed")),
      finish: async () => {},
      release: async (k) => { keys.delete(k); },
    };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true, result: { message_id: 9 } }), { status: 200 }));
    const d = { token: "t", chatId: "1", store, fetchImpl: fetchImpl as unknown as typeof fetch, log: () => {} };
    expect((await notifyLadyTelegram(alert, d)).sent).toBe(true);
    expect((await notifyLadyTelegram(alert, d)).reason).toBe("duplicate");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("Find the Queen claims stay out of the pipeline lists", () => {
  it("are filtered from the pipeline New column, the Action List and unanswered alerts", () => {
    const admin = readFileSync("supabase/functions/newsletter-admin/index.ts", "utf8");
    expect(admin).toContain('.or("stage.neq.new,source.is.null,source.neq.find-the-queen-popup")');
    expect(admin).toContain('.or("source.is.null,source.neq.find-the-queen-popup")');
    expect(readFileSync("supabase/functions/unanswered-inquiries/index.ts", "utf8")).toContain('.or("source.is.null,source.neq.find-the-queen-popup")');
    expect(readFileSync("supabase/functions/find-the-lady-claim/index.ts", "utf8")).not.toMatch(/from\("deals"\)/);
  });
});

describe("Find the Queen stays out of search", () => {
  it("is not in the sitemap", () => {
    expect(readFileSync("public/sitemap.xml", "utf8")).not.toMatch(/find-the-lady|official-rules/);
    expect(readFileSync("scripts/generate-sitemap.ts", "utf8")).not.toMatch(/find-the-lady|official-rules/);
  });
});
