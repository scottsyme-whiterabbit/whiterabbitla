import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import {
  claimLadyCredit, validateClaim, creditExpiry, addTwelveMonths, generateCreditCode, isCreditCode,
  LADY_SOURCE, CREDIT_CENTS, MIN_PACKAGE_CENTS, type ClaimStore, type CreditRow, type LadyDealRow, type StoredCredit, type LadyAlert,
} from "../../supabase/functions/_shared/find-the-lady";
import { buildLadyAlert, notifyLadyTelegram, crmDealLink, type AlertStore } from "../../supabase/functions/_shared/telegram-inquiry";

// 12:02 in Los Angeles on Monday November 16, 2026.
const NOW = new Date("2026-11-16T20:02:00Z");
const claim = { firstName: "Jane", email: "jane@example.com", eventType: "wedding" as const, approxDate: "2027-06-12", optIn: false, foundQueen: true };

function memoryDb(opts: { openDeal?: string } = {}) {
  const credits: (StoredCredit & CreditRow & { status: string })[] = [];
  const deals: (LadyDealRow & { id: string })[] = [];
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
    createDeal: vi.fn(async (row: LadyDealRow) => { const d = { ...row, id: `deal-${deals.length + 1}` }; deals.push(d); return { id: d.id }; }),
    attachDeal: async (creditId, dealId) => { const c = credits.find((x) => x.id === creditId); if (c) c.deal_id = dealId; },
    logActivity: async (dealId, title) => { activity.push({ dealId, title }); },
  };
  return { store, credits, deals, activity };
}

describe("Find the Lady claim flow", () => {
  it("creates a CRM lead with source Find the Lady and no guessed event date", async () => {
    const db = memoryDb();
    const res = await claimLadyCredit(claim, { store: db.store, now: NOW, notify: () => {} });
    expect(db.deals).toHaveLength(1);
    expect(db.deals[0]).toMatchObject({ source: "Find the Lady", stage: "new", contact_email: "jane@example.com", contact_name: "Jane", event_type: "wedding", event_date: null });
    expect(LADY_SOURCE).toBe("Find the Lady");
    expect(res.dealId).toBe("deal-1");
    expect(db.credits[0].deal_id).toBe("deal-1");
    expect(db.deals[0].notes).toContain(res.code);
  });

  it("generates a WR-LADY code and stores the $250 credit for packages of $2,500 or more", async () => {
    const db = memoryDb();
    const res = await claimLadyCredit(claim, { store: db.store, now: NOW, notify: () => {} });
    expect(res.code).toMatch(/^WR-LADY-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    expect(isCreditCode(res.code)).toBe(true);
    expect(db.credits[0].code).toBe(res.code);
    expect(CREDIT_CENTS).toBe(25000);
    expect(MIN_PACKAGE_CENTS).toBe(250000);
    expect(db.credits[0]).toMatchObject({ credit_cents: 25000, min_package_cents: 250000 });
  });

  it("sets the expiry 12 months from today in Los Angeles", async () => {
    const db = memoryDb();
    const res = await claimLadyCredit(claim, { store: db.store, now: NOW, notify: () => {} });
    expect(res.expiresOn).toBe("2027-11-16");
    expect(db.credits[0].expires_on).toBe("2027-11-16");
    // 11 PM Los Angeles on Dec 31 is already Jan 1 in UTC; the day still counts as Dec 31.
    expect(creditExpiry(new Date("2027-01-01T07:00:00Z"))).toBe("2027-12-31");
    expect(addTwelveMonths("2028-02-29")).toBe("2029-02-28");
  });

  it("sends a single Telegram alert per claim, even when the same person submits twice", async () => {
    const db = memoryDb();
    const notify = vi.fn((_a: LadyAlert) => {});
    const first = await claimLadyCredit(claim, { store: db.store, now: NOW, notify });
    const second = await claimLadyCredit({ ...claim, foundQueen: false }, { store: db.store, now: NOW, notify });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ code: first.code, existing: true });
    expect(db.deals).toHaveLength(1);
    expect(db.credits).toHaveLength(1);
  });

  it("sends the Telegram message once for a credit even if the alert is retried", async () => {
    const keys = new Set<string>();
    const store: AlertStore = {
      claim: async (k) => (keys.has(k) ? "duplicate" : (keys.add(k), "claimed")),
      finish: async () => {},
      release: async (k) => { keys.delete(k); },
    };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true, result: { message_id: 9 } }), { status: 200 }));
    const alert = { creditId: "credit-1", code: "WR-LADY-7KQ4", expiresOn: "2027-11-16", firstName: "Jane", eventType: "Wedding", approxDate: null, foundQueen: true, optIn: false, dealId: null };
    const deps = { token: "t", chatId: "1", store, fetchImpl: fetchImpl as unknown as typeof fetch, log: () => {} };
    expect((await notifyLadyTelegram(alert, deps)).sent).toBe(true);
    expect((await notifyLadyTelegram(alert, deps)).reason).toBe("duplicate");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("links an existing open deal instead of creating a duplicate lead", async () => {
    const db = memoryDb({ openDeal: "deal-existing" });
    const res = await claimLadyCredit(claim, { store: db.store, now: NOW, notify: () => {} });
    expect(db.store.createDeal).not.toHaveBeenCalled();
    expect(res.dealId).toBe("deal-existing");
    expect(db.activity[0]).toMatchObject({ dealId: "deal-existing" });
  });

  it("issues a fresh credit once the old one has expired", async () => {
    const db = memoryDb();
    const old = await claimLadyCredit(claim, { store: db.store, now: NOW, notify: () => {} });
    const notify = vi.fn();
    const later = await claimLadyCredit(claim, { store: db.store, now: new Date("2027-11-18T20:00:00Z"), notify });
    expect(later.existing).toBe(false);
    expect(later.code).not.toBe(old.code);
    expect(db.credits[0].status).toBe("expired");
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("retries when a generated code is already taken", async () => {
    const db = memoryDb();
    let call = 0;
    const randomBytes = () => new Uint8Array(call++ < 2 ? [0, 0, 0, 0] : [1, 2, 3, 4]);
    await claimLadyCredit(claim, { store: db.store, now: NOW, notify: () => {}, randomBytes });
    const res = await claimLadyCredit({ ...claim, email: "sam@example.com" }, { store: db.store, now: NOW, notify: () => {}, randomBytes });
    expect(res.code).toBe(generateCreditCode(() => new Uint8Array([1, 2, 3, 4])));
  });
});

describe("Find the Lady alert", () => {
  const alert = { creditId: "c1", code: "WR-LADY-7KQ4", expiresOn: "2027-11-16", firstName: "Jane", eventType: "Wedding", approxDate: "2027-06-12", foundQueen: false, optIn: true, dealId: "16e6d8e0-c2c7-48e6-a06b-4f59ccf87834" };

  it("is labeled Find the Lady and carries no email or phone", () => {
    const t = buildLadyAlert(alert);
    expect(t.split("\n")[0]).toContain("Find the Lady");
    expect(t).toContain("WR-LADY-7KQ4");
    expect(t).not.toMatch(/@|%40|📞|✉️|email=/i);
    expect(t).toContain(`deal=${alert.dealId}`);
    expect(t).not.toMatch(/[—–]/);
  });

  it("CRM link carries only the deal id", () => {
    expect(crmDealLink(alert.dealId)).toBe(`https://whiterabbitla.com/admin/newsletter?tab=today&deal=${alert.dealId}`);
    expect(crmDealLink("nope")).toBeNull();
  });
});

describe("Find the Lady claim validation", () => {
  const ok = { firstName: " Jane ", email: "Jane@Example.com ", eventType: "corporate", approxDate: "", optIn: false };
  it("accepts the form and normalizes email; event date is optional", () => {
    const r = validateClaim(ok, NOW);
    expect(r).toEqual({ ok: true, value: { firstName: "Jane", email: "jane@example.com", eventType: "corporate", approxDate: null, optIn: false, foundQueen: false } });
  });
  it("rejects a bad email, an unknown event type and a past date", () => {
    expect(validateClaim({ ...ok, email: "nope" }, NOW).ok).toBe(false);
    expect(validateClaim({ ...ok, eventType: "bar_mitzvah" }, NOW).ok).toBe(false);
    expect(validateClaim({ ...ok, approxDate: "2026-11-15" }, NOW).ok).toBe(false);
    expect(validateClaim({ ...ok, approxDate: "2027-02-30" }, NOW).ok).toBe(false);
  });
  it("opt in is only true when the box was ticked", () => {
    const r = validateClaim({ ...ok, optIn: "true" }, NOW);
    expect(r.ok && r.value.optIn).toBe(false);
  });
  it("treats a filled hidden field as a bot", () => {
    expect(validateClaim({ ...ok, website: "http://spam" }, NOW)).toEqual({ ok: false, bot: true });
  });
});

describe("Find the Lady stays out of search", () => {
  it("is not in the sitemap", () => {
    expect(readFileSync("public/sitemap.xml", "utf8")).not.toContain("find-the-lady");
    expect(readFileSync("scripts/generate-sitemap.ts", "utf8")).not.toContain("find-the-lady");
  });
});
