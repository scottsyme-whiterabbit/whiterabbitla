import { describe, it, expect } from "vitest";
import {
  buildReplyBody, replyBodyProblems, eventPhrase, locationPhrase, freeMessage, detailIsGrounded,
  dateOpenCheck, pickAlertMessage, replySubject, signatureText, instagramFromSignature, replyFirstName,
  type ReplyFacts,
} from "../../supabase/functions/_shared/personal-reply";

const facts = (o: Partial<ReplyFacts> = {}): ReplyFacts => ({ firstName: "Jessica", event: "wedding", location: "Hollywood", detail: "", date: "", ...o });
const SIG_LINES = ["Scott Syme", "Magician", "White Rabbit LA", "Office Telephone: (424) 394-1850", "Mobile: (650) 678-9428", "Website: www.whiterabbitla.com", "Email: scott.syme@whiterabbitla.com"];

describe("personal reply templates", () => {
  it("fills the voicemail template with first name, event and location", () => {
    expect(buildReplyBody("voicemail", facts())).toBe(
      "Hello Jessica,\n\nThank you for sending in your reservation request today, sounds very exciting of having magic at your wedding in Hollywood.\n\nI just left you a voice message, I would love to talk to you about details of the wedding and see where we can collaborate. Let me know of a good time coming up that can work for you to connect. After our call I can put together an official proposal presentation.\n\nTalk soon,\n-Scott",
    );
  });

  it("uses the client's specific detail in place of event and location", () => {
    expect(buildReplyBody("voicemail", facts({ detail: "wedding cocktail hour at Vibiana" })))
      .toContain("having magic at your wedding cocktail hour at Vibiana.");
  });

  it("drops the location phrase when location is missing", () => {
    const b = buildReplyBody("schedule_call", facts({ location: "" }));
    expect(b).toContain("this sounds like a lovely time, a wedding. I would enjoy");
    expect(b).not.toContain(" in .");
  });

  it("drops the whole event phrase when nothing is known", () => {
    expect(buildReplyBody("schedule_call", facts({ event: "", location: "" }))).toContain("this sounds like a lovely time. I would enjoy");
  });

  it("uses an before a vowel", () => {
    expect(buildReplyBody("schedule_call", facts({ event: "engagement party", location: "Malibu" }))).toContain("a lovely time, an engagement party in Malibu.");
  });

  it("refuses to build Date is open without a checked date", () => {
    expect(() => buildReplyBody("date_open", facts())).toThrow();
    expect(buildReplyBody("date_open", facts({ date: "Saturday, November 21" }))).toContain("Saturday, November 21 is open and available for me.");
  });

  it("booked and proposal follow-up templates are word for word", () => {
    expect(buildReplyBody("booked", facts())).toBe(
      "Hello Jessica,\n\nThank you so much for reaching out, I was happy to receive your inquiry today. Unfortunately I am booked with a prior reservation that night, so I will not be able to make an appearance at your event, which sounds like a really lovely time.\n\nIf there's anything I can do for you in the future, please let me know. I would love to stay in touch. I can help by making a few suggestions of other magicians if you like.\n\nBest,\n-Scott",
    );
    expect(buildReplyBody("proposal_followup", facts())).toBe(
      "Hello Jessica,\n\nJust checking to see if there are any questions in the proposal booking system. Happy to help!\n\nBest,\n-Scott",
    );
  });

  it("no template contains a long dash or a price", () => {
    for (const t of ["voicemail", "schedule_call", "booked", "proposal_followup"] as const) {
      expect(replyBodyProblems(buildReplyBody(t, facts()))).toEqual([]);
    }
    expect(replyBodyProblems(buildReplyBody("date_open", facts({ date: "Friday, December 4" })))).toEqual([]);
  });
});

describe("inquiry fields", () => {
  it("cleans the event type", () => {
    expect(eventPhrase("Private Party (Corporate)")).toBe("private party");
    expect(eventPhrase("Wedding (Wedding)")).toBe("wedding");
    expect(eventPhrase("Something Else (Corporate)")).toBe("");
    expect(eventPhrase("Corporate")).toBe("corporate event");
  });
  it("trims the state from the location", () => {
    expect(locationPhrase("Hollywood, CA")).toBe("Hollywood");
    expect(locationPhrase("Point Dume, Malibu")).toBe("Point Dume, Malibu");
    expect(locationPhrase("Santa Monica")).toBe("Santa Monica");
    expect(locationPhrase("Santa Monica, CA")).toBe("Santa Monica");
    expect(locationPhrase("Costa Mesa CA")).toBe("Costa Mesa");
  });
  it("never passes budget or how they found us to the draft", () => {
    const m = freeMessage("Client Type: Individual\nGuest Count: 30 to 75\nBudget: Go All Out\nHow They Found Us: Google Search\nRecommended: X\n\nCocktail hour at Vibiana");
    expect(m).toBe("Cocktail hour at Vibiana");
    expect(m).not.toMatch(/budget|google/i);
  });
  it("uses the first name only", () => {
    expect(replyFirstName("jessica alamo")).toBe("Jessica");
    expect(replyFirstName("")).toBe("");
  });
});

describe("detail phrase is never invented", () => {
  const src = ["We want magic during cocktail hour at Vibiana downtown", "wedding", "Los Angeles"];
  it("accepts words the client wrote", () => {
    expect(detailIsGrounded("wedding cocktail hour at Vibiana", src)).toBe(true);
  });
  it("rejects a venue they never named", () => {
    expect(detailIsGrounded("wedding cocktail hour at the Beverly Hilton", src)).toBe(false);
  });
  it("rejects numbers and prices", () => {
    expect(detailIsGrounded("cocktail hour for 120 guests", [...src, "120 guests"])).toBe(false);
  });
});

describe("send safety checks", () => {
  it("blocks long dashes", () => {
    expect(replyBodyProblems("Hello — there")).toHaveLength(1);
    expect(replyBodyProblems("Hello – there")).toHaveLength(1);
  });
  it("blocks prices", () => {
    expect(replyBodyProblems("It is $2,000")).toHaveLength(1);
    expect(replyBodyProblems("about 3k")).toHaveLength(1);
    expect(replyBodyProblems("2000 dollars")).toHaveLength(1);
  });
  it("blocks a pasted signature so it is never attached twice", () => {
    expect(replyBodyProblems("Thanks\n-Scott\n\nScott Syme\nOffice Telephone: (424) 394-1850")).toHaveLength(1);
  });
  it("blocks unfilled brackets", () => {
    expect(replyBodyProblems("Hello {First},")).toHaveLength(1);
  });
});

describe("Date is open check", () => {
  const today = { year: 2026, month: 11, day: 12 };
  it("refuses an unreadable date", () => {
    expect(dateOpenCheck({ date: null, today, bookedOnDate: 0, formatted: "" }).ok).toBe(false);
  });
  it("refuses a past date", () => {
    expect(dateOpenCheck({ date: { year: 2026, month: 11, day: 1 }, today, bookedOnDate: 0, formatted: "Sunday, November 1" }).ok).toBe(false);
  });
  it("refuses a date that already has a booked show", () => {
    const r = dateOpenCheck({ date: { year: 2026, month: 12, day: 5 }, today, bookedOnDate: 1, formatted: "Saturday, December 5" });
    expect(r.ok).toBe(false);
  });
  it("allows a future open date", () => {
    expect(dateOpenCheck({ date: { year: 2026, month: 12, day: 5 }, today, bookedOnDate: 0, formatted: "Saturday, December 5" }))
      .toEqual({ ok: true, iso: "2026-12-05", text: "Saturday, December 5" });
  });
});

describe("Booking Inquiry thread", () => {
  const msg = (o: object) => ({ id: "m", threadId: "t", subject: "", replyTo: "", internalDate: 1, ...o });
  it("picks the alert whose subject and reply-to match the client", () => {
    const picked = pickAlertMessage([
      msg({ id: "other", threadId: "t0", subject: "Booking Inquiry: Jessica Alamo (Wedding (Wedding))", replyTo: "someone@else.com" }),
      msg({ id: "right", threadId: "t1", subject: "Booking Inquiry: Jessica Alamo (Wedding (Wedding))", replyTo: "jalamo1993@gmail.com", internalDate: 2 }),
    ], { name: "Jessica Alamo", eventType: "Wedding (Wedding)", email: "jalamo1993@gmail.com" });
    expect(picked?.threadId).toBe("t1");
  });
  it("finds nothing when no alert exists, so no new thread is started", () => {
    expect(pickAlertMessage([], { name: "A", eventType: "B", email: "a@b.com" })).toBeNull();
  });
  it("keeps one Re: on the subject", () => {
    expect(replySubject("Booking Inquiry: Jessica Alamo (Wedding (Wedding))")).toBe("Re: Booking Inquiry: Jessica Alamo (Wedding (Wedding))");
    expect(replySubject("Re: Re: Booking Inquiry: X (Y)")).toBe("Re: Booking Inquiry: X (Y)");
  });
});

describe("signature", () => {
  it("contains every line once, plus Instagram", () => {
    const s = signatureText(instagramFromSignature('<a href="https://www.instagram.com/whiterabbit.la">'));
    for (const l of SIG_LINES) expect(s.split("\n").filter((x) => x === l)).toHaveLength(1);
    expect(s).toContain("Instagram: https://www.instagram.com/whiterabbit.la");
  });
});

// ---------- Five follow-up replies ----------
import {
  REPLY_TYPES, isFollowUpType, copyRuleProblems, sendProblems, quietReengageCheck, proposalCheckinCheck, formatIsoDay,
  redactForAi, smartDraftContext, assembleSmartDraft, smartDraftProblems, SMART_DRAFT_ENDING, SMART_DRAFT_INSTRUCTIONS, smartDraftPrompt,
} from "../../supabase/functions/_shared/personal-reply";

const NEW_TYPES = ["quiet_reengage", "proposal_checkin", "date_still_open", "castle_invite", "smart_draft"] as const;

describe("follow-up reply list", () => {
  it("keeps the original five first, in order, and adds five follow-ups with Scott's labels", () => {
    expect(REPLY_TYPES.filter((r) => r.group === "reply").map((r) => r.key)).toEqual(["voicemail", "schedule_call", "date_open", "booked", "proposal_followup"]);
    expect(REPLY_TYPES.filter((r) => r.group === "followup").map((r) => [r.key, r.label])).toEqual([
      ["quiet_reengage", "Re-engage quiet lead"],
      ["proposal_checkin", "Proposal check-in"],
      ["date_still_open", "Date still open nudge"],
      ["castle_invite", "Stay in touch / Magic Castle invite"],
      ["smart_draft", "Smart AI draft"],
    ]);
    for (const t of NEW_TYPES) expect(isFollowUpType(t)).toBe(true);
    expect(isFollowUpType("schedule_call")).toBe(false);
  });
});

describe("follow-up templates", () => {
  it("re-engage uses the occasion when known", () => {
    expect(buildReplyBody("quiet_reengage", facts())).toBe(
      "Hello Jessica,\n\nChecking in here to see if there is anything I can do for you. Have you found a magician yet for your wedding in Hollywood? I would still like to be considered.\n\nBest,\n-Scott",
    );
  });
  it("re-engage drops 'for your ...' cleanly when nothing is known", () => {
    expect(buildReplyBody("quiet_reengage", facts({ event: "", location: "" }))).toContain("Have you found a magician yet? I would still like");
  });
  it("proposal check-in mentions the hold only when one is active, and has no link or price", () => {
    const held = buildReplyBody("proposal_checkin", facts({ holdUntil: "Saturday, December 5" }));
    expect(held).toContain("Your date is currently held for you through Saturday, December 5.");
    expect(held.endsWith("Please let me know if there is anything I can do for you.\n\nBest,\n-Scott")).toBe(true);
    const none = buildReplyBody("proposal_checkin", facts());
    expect(none).not.toMatch(/held/i);
    expect(none).not.toMatch(/https?:|www\.|\$/);
  });
  it("date still open needs a checked date and never mentions a voicemail", () => {
    expect(() => buildReplyBody("date_still_open", facts())).toThrow();
    const b = buildReplyBody("date_still_open", facts({ date: "Saturday, December 5" }));
    expect(b).toBe(
      "Hello Jessica,\n\nSaturday, December 5 is still open and available for me. I would love to talk with you about the details of your wedding in Hollywood. Let me know some good times that work for you.\n\nPlease let me know if there is anything I can do for you.\n\nTalk soon,\n-Scott",
    );
    expect(b).not.toMatch(/voice|message/i);
  });
  it("date still open uses the client's own detail when one was found", () => {
    const b = buildReplyBody("date_still_open", facts({ date: "Saturday, December 5", detail: "50th birthday at the Jonathan Club" }));
    expect(b).toContain("I would love to talk with you about the details of your 50th birthday at the Jonathan Club. Let me know");
  });
  it("date still open falls back to 'upcoming event' when nothing is known", () => {
    const b = buildReplyBody("date_still_open", facts({ date: "Saturday, December 5", event: "", location: "" }));
    expect(b).toContain("I would love to talk with you about the details of your upcoming event. Let me know");
    expect(b.endsWith("Please let me know if there is anything I can do for you.\n\nTalk soon,\n-Scott")).toBe(true);
    expect(sendProblems("date_still_open", b)).toEqual([]);
  });
  it("castle invite offers up to 5 guests and invents nothing else", () => {
    const b = buildReplyBody("castle_invite", facts());
    expect(b).toContain("Magic Castle in Hollywood");
    expect(b).toContain("up to 5 guests on my guest list");
    expect(b).not.toMatch(/last show|decline|team/i);
  });
  it("smart draft has no template", () => {
    expect(() => buildReplyBody("smart_draft", facts())).toThrow();
  });
  it("every new template passes all send checks", () => {
    for (const t of ["quiet_reengage", "proposal_checkin", "castle_invite"] as const) {
      expect(sendProblems(t, buildReplyBody(t, facts()))).toEqual([]);
      expect(sendProblems(t, buildReplyBody(t, facts({ firstName: "", event: "", location: "" })))).toEqual([]);
    }
    expect(sendProblems("date_still_open", buildReplyBody("date_still_open", facts({ date: "Friday, December 4" })))).toEqual([]);
    expect(sendProblems("proposal_checkin", buildReplyBody("proposal_checkin", facts({ holdUntil: "Friday, December 4" })))).toEqual([]);
  });
  it("the original five templates are unchanged by the new checks", () => {
    for (const t of ["voicemail", "schedule_call", "booked", "proposal_followup"] as const) {
      expect(sendProblems(t, buildReplyBody(t, facts()))).toEqual([]);
    }
  });
});

describe("dash and phrase rules", () => {
  it("blocks a hyphen used as punctuation but keeps -Scott and hyphenated words", () => {
    expect(replyBodyProblems("Hello - there\n\nBest,\n-Scott")).toHaveLength(1);
    expect(replyBodyProblems("It was great -- truly")).toHaveLength(1);
    expect(replyBodyProblems("A well-known follow-up.\n\nBest,\n-Scott")).toEqual([]);
  });
  it("blocks the banned phrases, links and 'not X, but Y' on follow-ups only", () => {
    expect(copyRuleProblems("Hi, just checking in.")).toHaveLength(1);
    expect(copyRuleProblems("Thanks for reaching out!")).toHaveLength(1);
    expect(copyRuleProblems("It is not a show, but an experience.")).toHaveLength(1);
    expect(copyRuleProblems("See https://whiterabbitla.com")).toHaveLength(1);
    expect(sendProblems("quiet_reengage", "Hello,\n\njust checking in\n\nBest,\n-Scott").length).toBeGreaterThan(0);
    // The approved "schedule_call" copy keeps its opening line.
    expect(sendProblems("schedule_call", "Hi,\n\nThank you so much for reaching out.\n\n-Scott")).toEqual([]);
  });
  it("blocks prices on follow-ups", () => {
    expect(sendProblems("castle_invite", "Hello,\n\nIt is $2,500.\n\nBest,\n-Scott").length).toBeGreaterThan(0);
  });
});

describe("Re-engage quiet lead check", () => {
  const now = new Date("2026-11-20T18:00:00Z");
  it("refuses when Scott never wrote", () => {
    const r = quietReengageCheck({ lastOutboundAt: null, lastInboundAt: null, now });
    expect(r.ok).toBe(false);
  });
  it("refuses when the client replied after Scott's last email", () => {
    const r = quietReengageCheck({ lastOutboundAt: "2026-11-01T18:00:00Z", lastInboundAt: "2026-11-03T18:00:00Z", now });
    expect(r).toMatchObject({ ok: false });
    expect((r as { reason?: string }).reason).toMatch(/wrote back/);
  });
  it("refuses before 7 full days have passed", () => {
    expect(quietReengageCheck({ lastOutboundAt: "2026-11-14T18:00:01Z", lastInboundAt: null, now }).ok).toBe(false);
  });
  it("allows at 7 days with no reply since", () => {
    expect(quietReengageCheck({ lastOutboundAt: "2026-11-13T18:00:00Z", lastInboundAt: "2026-11-10T00:00:00Z", now }).ok).toBe(true);
  });
});

describe("Proposal check-in check", () => {
  const today = { year: 2026, month: 11, day: 20 };
  it("refuses when no proposal was sent", () => {
    expect(proposalCheckinCheck({ proposal: null, viewCount: 0, today }).ok).toBe(false);
    expect(proposalCheckinCheck({ proposal: { sent_at: null, hold_until: "2026-12-01" }, viewCount: 0, today }).ok).toBe(false);
  });
  it("reports an active hold through today or later", () => {
    const r = proposalCheckinCheck({ proposal: { sent_at: "2026-11-10T18:00:00Z", hold_until: "2026-12-05" }, viewCount: 0, today });
    expect(r).toMatchObject({ ok: true, holdUntil: "Saturday, December 5", viewCount: 0 });
    expect(proposalCheckinCheck({ proposal: { sent_at: "2026-11-10T18:00:00Z", hold_until: "2026-11-20" }, viewCount: 2, today })).toMatchObject({ ok: true, holdUntil: "Friday, November 20" });
  });
  it("never claims a hold that has passed or is missing", () => {
    expect(proposalCheckinCheck({ proposal: { sent_at: "2026-11-10T18:00:00Z", hold_until: "2026-11-19" }, viewCount: 3, today })).toMatchObject({ ok: true, holdUntil: "" });
    expect(proposalCheckinCheck({ proposal: { sent_at: "2026-11-10T18:00:00Z", hold_until: null }, viewCount: 3, today })).toMatchObject({ ok: true, holdUntil: "" });
  });
  it("formats ISO days", () => {
    expect(formatIsoDay("2026-12-05")).toBe("Saturday, December 5");
    expect(formatIsoDay("nope")).toBe("");
  });
});

describe("Date still open nudge check", () => {
  it("uses the same date check as Date is open", () => {
    const today = { year: 2026, month: 11, day: 20 };
    expect(dateOpenCheck({ date: { year: 2026, month: 11, day: 1 }, today, bookedOnDate: 0, formatted: "Sunday, November 1" }).ok).toBe(false);
    expect(dateOpenCheck({ date: { year: 2026, month: 12, day: 5 }, today, bookedOnDate: 1, formatted: "Saturday, December 5" }).ok).toBe(false);
    expect(dateOpenCheck({ date: null, today, bookedOnDate: 0, formatted: "" }).ok).toBe(false);
  });
});

describe("Smart AI draft", () => {
  const input = {
    firstName: "Jessica",
    stage: "contacted",
    notes: "Budget: Go All Out\nHow They Found Us: Google Search\nGuest Count: 75 to 150\nWants strolling magic at the Vibiana cocktail hour. Call me at 310 555 1234 or jess@example.com. Quoted $3,000.",
    activities: [
      { type: "call", title: "Call", body: "Talked about the cocktail hour at Vibiana", occurred_at: "2026-11-10T18:00:00Z" },
      { type: "stage_change", title: "Stage", body: "new to contacted", occurred_at: "2026-11-09T18:00:00Z" },
    ],
    proposal: { sentOn: "November 12", holdUntil: "", viewCount: 0 },
    inquiry: { name: "Jessica Alamo", eventType: "Wedding (Wedding)", location: "Los Angeles, CA", message: "Budget: Go All Out\nGuest Count: 120 guests\n\nCocktail hour magic at Vibiana for 120 guests" },
  };
  const ctx = smartDraftContext(input);

  it("context never carries budget, source, guest count, price, phone or email", () => {
    expect(ctx).not.toMatch(/go all out|google search|75 to 150|120|\$|3,000|555|jess@example/i);
    expect(ctx).toContain("Vibiana");
    expect(ctx).not.toContain("new to contacted");
    expect(ctx).toContain("No date hold is active");
  });
  it("redacts prices and guest counts", () => {
    expect(redactForAi("We have 120 guests and $5k")).toBe("We have [guest count removed] and [price removed]");
  });
  it("assembles Scott's opening and closing around the AI sentences", () => {
    const b = assembleSmartDraft("Hi Jessica,\n\nIt was lovely talking about the cocktail hour at Vibiana. I would be glad to help with any details.\n\nBest,\n-Scott", "Jessica");
    expect(b).toBe(`Hi Jessica,\n\nIt was lovely talking about the cocktail hour at Vibiana. I would be glad to help with any details.\n\n${SMART_DRAFT_ENDING}`);
    expect(smartDraftProblems(b, { firstName: "Jessica", context: ctx })).toEqual([]);
  });
  const draft = (mid: string) => assembleSmartDraft(mid, "Jessica");
  it("rejects dashes, banned phrases and prices", () => {
    expect(smartDraftProblems(draft("It was lovely to talk — truly. I would be glad to help."), { firstName: "Jessica", context: ctx }).length).toBeGreaterThan(0);
    expect(smartDraftProblems(draft("Just checking in on the cocktail hour. I would be glad to help."), { firstName: "Jessica", context: ctx }).length).toBeGreaterThan(0);
    expect(smartDraftProblems(draft("The show is $3,000. I would be glad to help."), { firstName: "Jessica", context: ctx }).length).toBeGreaterThan(0);
  });
  it("rejects invented venues, dates and numbers", () => {
    expect(smartDraftProblems(draft("I loved hearing about the Beverly Hilton. I would be glad to help."), { firstName: "Jessica", context: ctx })[0]).toMatch(/Beverly/);
    expect(smartDraftProblems(draft("I can hold Saturday for you. I would be glad to help."), { firstName: "Jessica", context: ctx }).length).toBeGreaterThan(0);
    expect(smartDraftProblems(draft("I can bring 3 performers. I would be glad to help."), { firstName: "Jessica", context: ctx }).length).toBeGreaterThan(0);
  });
  it("rejects a draft that is too short or too long", () => {
    expect(smartDraftProblems(draft("I would be glad to help."), { firstName: "Jessica", context: ctx })).toContain("The draft must be 2 to 4 sentences.");
    expect(smartDraftProblems(draft("One. Two. Three. Four. Five."), { firstName: "Jessica", context: ctx })).toContain("The draft must be 2 to 4 sentences.");
  });
  it("context includes the company and event date only when present", () => {
    const withBoth = smartDraftContext({ ...input, company: "Acme Studios", eventDate: "Saturday, December 5" });
    expect(withBoth).toContain("Company or organization: Acme Studios");
    expect(withBoth).toContain("Event date from their record: Saturday, December 5");
    expect(ctx).not.toMatch(/Company or organization|Event date from their record/);
    const blank = smartDraftContext({ ...input, company: "  ", eventDate: null });
    expect(blank).not.toMatch(/Company or organization|Event date from their record/);
  });
  it("allows the company and event date from the record, and blocks ones that are not there", () => {
    const rich = smartDraftContext({ ...input, company: "Acme Studios", eventDate: "Saturday, December 5" });
    const ok = draft("It would be a joy to be part of the Acme Studios evening on Saturday, December 5. I would be glad to help with any details.");
    expect(smartDraftProblems(ok, { firstName: "Jessica", context: rich })).toEqual([]);
    expect(smartDraftProblems(ok, { firstName: "Jessica", context: ctx }).length).toBeGreaterThan(0);
    const otherCo = draft("It would be a joy to be part of the Globex evening. I would be glad to help with any details.");
    expect(smartDraftProblems(otherCo, { firstName: "Jessica", context: rich })[0]).toMatch(/Globex/);
    const otherDay = draft("It would be a joy to be part of your evening on Friday, January 9. I would be glad to help.");
    expect(smartDraftProblems(otherDay, { firstName: "Jessica", context: rich }).length).toBeGreaterThan(0);
  });
  it("never lets the AI claim a date is open or available", () => {
    const rich = smartDraftContext({ ...input, company: "Acme Studios", eventDate: "Saturday, December 5" });
    for (const mid of [
      "Good news, Saturday, December 5 is open. I would be glad to help.",
      "Your date is still available. I would be glad to help.",
      "I have that date free for you. I would be glad to help.",
      "I am available on that night. I would be glad to help.",
    ]) {
      expect(smartDraftProblems(draft(mid), { firstName: "Jessica", context: rich }).some((p) => /open or available/.test(p))).toBe(true);
    }
  });
  it("tells the AI to anchor on their inquiry and never claim availability", () => {
    expect(SMART_DRAFT_INSTRUCTIONS).toContain("naturally reference one or two of those concrete details");
    expect(SMART_DRAFT_INSTRUCTIONS).toContain("Never claim a date is open or available.");
    expect(SMART_DRAFT_INSTRUCTIONS).toContain("Never mention prices, budgets, how they found him or guest counts.");
    expect(smartDraftPrompt("X")).toContain("anchoring on the specific details they shared in their original inquiry");
  });
  it("rejects a draft without the required opening or ending", () => {
    const bad = "Dear Jessica,\n\nIt was lovely to talk. I would be glad to help.\n\nCheers";
    const p = smartDraftProblems(bad, { firstName: "Jessica", context: ctx });
    expect(p.some((x) => /open with/.test(x))).toBe(true);
    expect(p.some((x) => /closing/.test(x))).toBe(true);
  });
});
