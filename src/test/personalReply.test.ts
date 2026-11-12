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
