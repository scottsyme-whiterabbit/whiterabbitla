import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import {
  claimQueenCredit, validateClaim, creditExpiry, addTwelveMonths, generateCreditCode, isCreditCode, drawingQuarter,
  buildWelcomeEmail, welcomeThenAlert, QUEEN_SOURCE, CREDIT_CENTS,
  type ClaimStore, type CreditRow, type QueenDealRow, type StoredCredit, type NewCredit, type WelcomeStore,
} from "../../supabase/functions/_shared/find-the-lady";
import { buildLadyAlert, notifyLadyTelegram, crmDealLink, type AlertStore } from "../../supabase/functions/_shared/telegram-inquiry";

// 12:02 in Los Angeles on Monday November 16, 2026.
const NOW = new Date("2026-11-16T20:02:00Z");
const claim = { firstName: "Jane", email: "jane@example.com" };

function memoryDb(opts: { openDeal?: string } = {}) {
  const credits: (StoredCredit & CreditRow & { status: string })[] = [];
  const deals: (QueenDealRow & { id: string })[] = [];
  const activity: { dealId: string; title: string }[] = [];
  let n = 0;
  const store: ClaimStore = {
    findActiveCredit: async (email) => credits.find((c) => c.email === email && c.status === "active") ?? null,
    expireCredit: async (id) => { const c = credits.find((x) => x.id === id); if (c) c.status = "expired"; },
    insertCredit: async (row) => {
      if (credits.some((c) => c.code === row.code)) return { status: "duplicate_code" };
      if (credits.some((c) => c.email === row.email && c.status === "active")) return { status: "duplicate_email" };
      const c = { ...row, id: `credit-${++n}`, deal_id: null, status: "active" };
      credits.push(c);
      return { status: "ok", credit: c };
    },
    findOpenDeal: async () => (opts.openDeal ? { id: opts.openDeal } : null),
    createDeal: vi.fn(async (row: QueenDealRow) => { const d = { ...row, id: `deal-${deals.length + 1}` }; deals.push(d); return { id: d.id }; }),
    attachDeal: async (creditId, dealId) => { const c = credits.find((x) => x.id === creditId); if (c) c.deal_id = dealId; },
    logActivity: async (dealId, title) => { activity.push({ dealId, title }); },
  };
  return { store, credits, deals, activity };
}

const deps = (db: ReturnType<typeof memoryDb>, followUp: (c: NewCredit) => unknown = () => {}) => ({ store: db.store, now: NOW, followUp });

describe("Find the Queen claim", () => {
  it("saves the lead with source find-the-queen-popup and a drawing entry", async () => {
    const db = memoryDb();
    const res = await claimQueenCredit(claim, deps(db));
    expect(db.deals).toHaveLength(1);
    expect(db.deals[0]).toMatchObject({ source: "find-the-queen-popup", stage: "new", contact_email: "jane@example.com", contact_name: "Jane", event_date: null });
    expect(QUEEN_SOURCE).toBe("find-the-queen-popup");
    expect(db.credits[0]).toMatchObject({ source: "find-the-queen-popup", drawing_entry: true, drawing_quarter: "2026 Q4", first_name: "Jane" });
    expect(db.credits[0].deal_id).toBe(res.dealId);
    expect(db.deals[0].notes).toContain(res.code);
  });

  it("gives a WR500 code worth $500", async () => {
    const db = memoryDb();
    const res = await claimQueenCredit(claim, deps(db));
    expect(res.code).toMatch(/^WR500-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    expect(isCreditCode(res.code)).toBe(true);
    expect(CREDIT_CENTS).toBe(50000);
    expect(db.credits[0]).toMatchObject({ code: res.code, credit_cents: 50000 });
  });

  it("is valid 12 months from today in Los Angeles", async () => {
    const db = memoryDb();
    const res = await claimQueenCredit(claim, deps(db));
    expect(res.expiresOn).toBe("2027-11-16");
    expect(creditExpiry(new Date("2027-01-01T07:00:00Z"))).toBe("2027-12-31");
    expect(addTwelveMonths("2028-02-29")).toBe("2029-02-28");
  });

  it("files entries under the Los Angeles calendar quarter", () => {
    expect(drawingQuarter(NOW)).toBe("2026 Q4");
    // 10 PM Los Angeles on March 31 is already April 1 in UTC; still Q1.
    expect(drawingQuarter(new Date("2027-04-01T05:00:00Z"))).toBe("2027 Q1");
    expect(drawingQuarter(new Date("2027-04-01T08:00:00Z"))).toBe("2027 Q2");
  });

  it("asks only for first name and a valid email", () => {
    expect(validateClaim({ firstName: " Jane ", email: "Jane@Example.com" })).toEqual({ ok: true, value: { firstName: "Jane", email: "jane@example.com" } });
    expect(validateClaim({ email: "jane@example.com" }).ok).toBe(false);
    expect(validateClaim({ firstName: "Jane", email: "jane@example" }).ok).toBe(false);
    expect(validateClaim({ firstName: "Jane", email: "jane@example.com", website: "http://spam" })).toEqual({ ok: false, bot: true });
  });

  it("starts the email and alert once, even when the same person submits twice", async () => {
    const db = memoryDb();
    const followUp = vi.fn();
    const first = await claimQueenCredit(claim, deps(db, followUp));
    const second = await claimQueenCredit(claim, deps(db, followUp));
    expect(followUp).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ code: first.code, existing: true });
    expect(db.deals).toHaveLength(1);
    expect(db.credits).toHaveLength(1);
  });

  it("links an existing open deal instead of creating a duplicate lead", async () => {
    const db = memoryDb({ openDeal: "deal-existing" });
    const res = await claimQueenCredit(claim, deps(db));
    expect(db.store.createDeal).not.toHaveBeenCalled();
    expect(res.dealId).toBe("deal-existing");
  });

  it("retries when a generated code is already taken", async () => {
    const db = memoryDb();
    let call = 0;
    const randomBytes = () => new Uint8Array(call++ < 2 ? [0, 0, 0, 0] : [1, 2, 3, 4]);
    await claimQueenCredit(claim, { ...deps(db), randomBytes });
    const res = await claimQueenCredit({ ...claim, email: "sam@example.com" }, { ...deps(db), randomBytes });
    expect(res.code).toBe(generateCreditCode(() => new Uint8Array([1, 2, 3, 4])));
  });
});

describe("Find the Queen welcome email", () => {
  const credit: NewCredit = { creditId: "c1", code: "WR500-7KQ4", expiresOn: "2027-11-16", firstName: "Jane", email: "jane@example.com", quarter: "2026 Q4", dealId: null };

  it("carries the credit code, the expiry, the signature and an unsubscribe link", () => {
    const m = buildWelcomeEmail(credit);
    expect(m.to).toBe("jane@example.com");
    expect(m.text).toContain("WR500-7KQ4");
    expect(m.text).toContain("November 16, 2027");
    expect(m.text).toContain("Scott Syme\nMagician\n(424) 394-1850\nwhiterabbitla.com");
    expect(m.html).toContain("WR500-7KQ4");
    expect(m.unsubscribeUrl).toBe("https://whiterabbitla.com/unsubscribe?email=jane%40example.com");
    expect(m.text).toContain("7393 W. Manchester Ave #209");
    expect(m.text + m.subject).not.toMatch(/[—–]|reaching out|checking in/i);
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
    expect(w.state.c1).toBe("sent");
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

describe("Find the Queen alert", () => {
  const alert = { creditId: "c1", code: "WR500-7KQ4", expiresOn: "2027-11-16", firstName: "Jane", quarter: "2026 Q4", welcome: "sent", dealId: "16e6d8e0-c2c7-48e6-a06b-4f59ccf87834" };

  it("is labeled Find the Queen and carries no email or phone", () => {
    const t = buildLadyAlert(alert);
    expect(t.split("\n")[0]).toContain("Find the Queen");
    expect(t).toContain("WR500-7KQ4");
    expect(t).toContain("2026 Q4");
    expect(t).not.toMatch(/@|%40|📞|✉️|email=/i);
    expect(t).toContain(`deal=${alert.dealId}`);
    expect(t).not.toMatch(/[—–]/);
  });

  it("flags a welcome email that did not go out", () => {
    expect(buildLadyAlert({ ...alert, welcome: "not_sent:provider_error" })).toContain("NOT sent");
  });

  it("sends the Telegram message once for a credit even if the alert is retried", async () => {
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

  it("CRM link carries only the deal id", () => {
    expect(crmDealLink(alert.dealId)).toBe(`https://whiterabbitla.com/admin/newsletter?tab=today&deal=${alert.dealId}`);
    expect(crmDealLink("nope")).toBeNull();
  });
});

describe("Find the Queen stays out of search", () => {
  it("is not in the sitemap", () => {
    expect(readFileSync("public/sitemap.xml", "utf8")).not.toMatch(/find-the-lady|official-rules/);
    expect(readFileSync("scripts/generate-sitemap.ts", "utf8")).not.toMatch(/find-the-lady|official-rules/);
  });
});
