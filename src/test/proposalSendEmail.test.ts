import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  LEGACY_PROPOSAL_SEND_MESSAGE,
  PROPOSAL_SEND_FALLBACK_SUBJECT,
  PROPOSAL_SEND_LOGO_URL,
  buildProposalSendMessage,
  defaultHoldUntilIso,
  defaultProposalSubject,
  effectiveProposalSubject,
  formatHoldDate,
  isLegacyDefaultProposalMessage,
  proposalLinkFromPosted,
  proposalPublicLink,
  renderProposalSendEmailHtml,
  renderProposalSendEmailText,
  resolveProposalSendMessage,
} from "@/lib/proposalSendEmail";
import * as shared from "../../supabase/functions/_shared/proposal-send-email";

const serverSource = readFileSync(
  resolve(__dirname, "../../supabase/functions/proposals-api/index.ts"),
  "utf8",
);
const sendStart = serverSource.indexOf('if (action === "send" && req.method === "POST")');
const sendBlock = serverSource.slice(sendStart, serverSource.indexOf("return json({ ok: true });", sendStart));

// Sunday Nov 22 2026, 10 AM in Los Angeles.
const NOW = new Date("2026-11-22T18:00:00Z");
const LINK = "https://whiterabbitla.com/proposal/ana-smith-ab12cd";

const WEDDING_MARCH_14 =
  "Thank you so much for thinking of White Rabbit for your wedding! I've put together a proposal for Sunday, March 14. Feel free to share it with anyone helping you plan.\n\n" +
  "Your date is held for seven days, through November 29. If you'd like to talk anything through, I'm happy to hop on a call.\n\n" +
  "Please let me know if there is anything I can do for you.\n\n" +
  "Best,\n-Scott";

describe("proposal send email: server and preview stay in lockstep", () => {
  it("the preview uses the exact module the send action uses", () => {
    expect(renderProposalSendEmailHtml).toBe(shared.renderProposalSendEmailHtml);
    expect(renderProposalSendEmailText).toBe(shared.renderProposalSendEmailText);
    expect(buildProposalSendMessage).toBe(shared.buildProposalSendMessage);
    expect(resolveProposalSendMessage).toBe(shared.resolveProposalSendMessage);
  });

  it("the send action builds its body from the shared module, not its own copy", () => {
    expect(serverSource).toContain('from "../_shared/proposal-send-email.ts"');
    expect(sendBlock).toContain("resolveProposalSendMessage(message, {");
    expect(sendBlock).toContain("const html = renderProposalSendEmailHtml(emailInput);");
    expect(sendBlock).toContain("const text = renderProposalSendEmailText(emailInput);");
    expect(sendBlock).not.toContain("<!DOCTYPE html>");
    expect(sendBlock).not.toContain("Hello");
    expect(sendBlock).not.toContain("window.location");
  });

  it("the send action links to whiterabbitla.com from the stored slug, posted link only as fallback", () => {
    expect(sendBlock).toContain("stored?.slug ? proposalPublicLink(stored.slug) : proposalLinkFromPosted(link)");
    expect(sendBlock).toContain("link: proposalLink");
  });

  it("the hold named in the email is the hold the send action stores", () => {
    expect(sendBlock).toContain("const newHoldUntil = defaultHoldUntilIso(sendNow);");
    expect(sendBlock).toContain("holdUntil: stored?.hold_until || newHoldUntil");
    expect(sendBlock).toContain('.update({ hold_until: newHoldUntil })\n            .eq("id", id)\n            .is("hold_until", null);');
  });

  it("keeps the subject fallback", () => {
    expect(sendBlock).toContain('const finalSubject = subject || "Your White Rabbit LA Proposal";');
    expect(PROPOSAL_SEND_FALLBACK_SUBJECT).toBe("Your White Rabbit LA Proposal");
    expect(effectiveProposalSubject("")).toBe("Your White Rabbit LA Proposal");
    expect(effectiveProposalSubject("Custom")).toBe("Custom");
    expect(defaultProposalSubject("Ana")).toBe("Your White Rabbit LA Proposal, Ana");
  });
});

describe("proposal send message", () => {
  it("wedding on a parseable date", () => {
    expect(buildProposalSendMessage({ eventType: " Wedding ", eventDate: "2027-03-14", holdUntil: null, now: NOW }))
      .toBe(WEDDING_MARCH_14);
  });

  it("formats a free-text date like Saturday, December 5", () => {
    const m = buildProposalSendMessage({ eventType: "Corporate Event", eventDate: "December 5th", now: NOW });
    expect(m).toContain("for your corporate event! I've put together a proposal for Saturday, December 5.");
  });

  it("no parseable date says a proposal for you", () => {
    for (const eventDate of ["", null, "june-ish", "2926-01-01"]) {
      const m = buildProposalSendMessage({ eventType: "Private Event", eventDate, now: NOW });
      expect(m.startsWith(
        "Thank you so much for thinking of White Rabbit for your private event! I've put together a proposal for you. Feel free to share",
      )).toBe(true);
    }
  });

  it("blank event type falls back to event", () => {
    expect(buildProposalSendMessage({ eventType: "   ", now: NOW })).toContain("for your event! I've put together");
    expect(buildProposalSendMessage({ eventType: null, now: NOW })).toContain("for your event! I've put together");
  });

  it("hold date reads like December 1", () => {
    expect(formatHoldDate("2026-12-01")).toBe("December 1");
    expect(buildProposalSendMessage({ holdUntil: "2026-12-01", now: NOW }))
      .toContain("Your date is held for seven days, through December 1. If you'd like");
  });

  it("uses an existing hold_until instead of a new one", () => {
    expect(buildProposalSendMessage({ holdUntil: "2027-01-15", now: NOW })).toContain("through January 15.");
  });

  it("a new hold is seven days from today in Los Angeles, even late evening", () => {
    expect(defaultHoldUntilIso(NOW)).toBe("2026-11-29");
    // 11 PM Pacific on Nov 22 is already Nov 23 in UTC.
    expect(defaultHoldUntilIso(new Date("2026-11-23T07:00:00Z"))).toBe("2026-11-29");
    expect(buildProposalSendMessage({ now: NOW })).toContain("through November 29.");
  });

  it("detects the old default message in any spacing, with or without the sign-off", () => {
    expect(isLegacyDefaultProposalMessage(LEGACY_PROPOSAL_SEND_MESSAGE)).toBe(true);
    expect(isLegacyDefaultProposalMessage("  Here's the proposal we discussed. Take your time with it, call me anytime.  ")).toBe(true);
    expect(isLegacyDefaultProposalMessage("Here\u2019s the proposal we discussed. Take your time with it, call me anytime.\r\n\r\nBest,\r\n-Scott\n")).toBe(true);
    expect(isLegacyDefaultProposalMessage("Here's the proposal we discussed. Take your time with it, call me anytime. P.S. Love the venue.")).toBe(false);
    expect(isLegacyDefaultProposalMessage("")).toBe(false);
  });

  it("replaces empty or old default messages with the new body", () => {
    const ctx = { eventType: "Wedding", eventDate: "2027-03-14", holdUntil: null, now: NOW };
    expect(resolveProposalSendMessage(LEGACY_PROPOSAL_SEND_MESSAGE, ctx)).toBe(WEDDING_MARCH_14);
    expect(resolveProposalSendMessage("Here's the proposal we discussed. Take your time with it, call me anytime.", ctx)).toBe(WEDDING_MARCH_14);
    expect(resolveProposalSendMessage("   ", ctx)).toBe(WEDDING_MARCH_14);
    expect(resolveProposalSendMessage(undefined, ctx)).toBe(WEDDING_MARCH_14);
  });

  it("leaves a custom message intact", () => {
    const custom = "Great talking today.\n\nHere is the plan we sketched out. Call me with questions.\n\nScott";
    expect(resolveProposalSendMessage(`\n${custom}  `, { eventType: "Wedding", now: NOW })).toBe(custom);
    const html = renderProposalSendEmailHtml({ firstName: "Ana", message: custom, link: LINK });
    expect(html).toContain("Great talking today.<br/><br/>Here is the plan we sketched out. Call me with questions.<br/><br/>Scott");
    expect(html).toContain(">Hi Ana,</p>");
  });
});

describe("proposal send link", () => {
  it("is always https://whiterabbitla.com/proposal/{slug}", () => {
    expect(proposalPublicLink("ana-smith-ab12cd")).toBe(LINK);
    expect(proposalLinkFromPosted("https://id-preview--x.lovable.app/proposal/ana-smith-ab12cd")).toBe(LINK);
    expect(proposalLinkFromPosted("http://localhost:8080/proposal/ana-smith-ab12cd/?x=1#y")).toBe(LINK);
    expect(proposalLinkFromPosted("https://evil.example/phish")).toBeNull();
    expect(proposalLinkFromPosted("https://whiterabbitla.com/proposal/a/b")).toBeNull();
    expect(proposalLinkFromPosted("")).toBeNull();
  });

  it("puts the same link on the button, the browser line and the text version", () => {
    const html = renderProposalSendEmailHtml({ firstName: "Ana", message: "x", link: LINK });
    expect(html.split(`href="${LINK}"`).length - 1).toBe(2);
    expect(html).toContain(`>${LINK}</a></p>`);
    expect(renderProposalSendEmailText({ firstName: "Ana", message: "x", link: LINK })).toContain(`View your proposal: ${LINK}`);
  });
});

describe("proposal send template", () => {
  const html = renderProposalSendEmailHtml({ firstName: "Ana", message: WEDDING_MARCH_14, link: LINK });
  const text = renderProposalSendEmailText({ firstName: "Ana", message: WEDDING_MARCH_14, link: LINK });

  it("greets with Hi once, never Hello", () => {
    expect(html.split("Hi Ana,").length - 1).toBe(1);
    expect(text.split("Hi Ana,").length - 1).toBe(1);
    expect(html).not.toContain("Hello");
    expect(text).not.toContain("Hello");
    expect(text.startsWith("Hi Ana,\n\nThank you so much for thinking of White Rabbit for your wedding!")).toBe(true);
    expect(renderProposalSendEmailHtml({ firstName: "  ", message: "x", link: LINK })).toContain(">Hi,</p>");
    expect(renderProposalSendEmailText({ firstName: null, message: "x", link: LINK }).startsWith("Hi,\n\nx")).toBe(true);
  });

  it("escapes the greeting and message", () => {
    const h = renderProposalSendEmailHtml({ firstName: "<b>Ana", message: "a & <b>\nnext", link: LINK });
    expect(h).toContain(">Hi &lt;b>Ana,</p>");
    expect(h).toContain("a &amp; &lt;b&gt;<br/>next");
  });

  it("renders the full approved body in the HTML", () => {
    expect(html).toContain(
      "Thank you so much for thinking of White Rabbit for your wedding! I've put together a proposal for Sunday, March 14. Feel free to share it with anyone helping you plan.<br/><br/>" +
      "Your date is held for seven days, through November 29. If you'd like to talk anything through, I'm happy to hop on a call.<br/><br/>" +
      "Please let me know if there is anything I can do for you.<br/><br/>Best,<br/>-Scott</p>",
    );
  });

  it("signature uses a comma and no em dash remains anywhere", () => {
    expect(html).toContain("White Rabbit LA, Luxury Magic &amp; Entertainment<br/>");
    expect(text).toContain("Scott Syme\nWhite Rabbit LA, Luxury Magic & Entertainment\n(424) 394-1850\nscott.syme@whiterabbitla.com · https://whiterabbitla.com");
    expect(html).not.toContain("\u2014");
    expect(text).not.toContain("\u2014");
    expect(text.endsWith(`View your proposal: ${LINK}\n\nWhite Rabbit LA · 7393 W. Manchester Ave #209, Los Angeles, CA 90045`)).toBe(true);
  });

  it("keeps every other fixed line", () => {
    expect(html).toContain(">Your White Rabbit LA proposal is ready to view.</div>");
    expect(html).toContain(">View Your Proposal</a>");
    expect(html).toContain("Or open in your browser:<br/>");
    expect(html).toContain(">Scott Syme</span><br/>");
    expect(html).toContain(">(424) 394-1850</a>");
    expect(html).toContain(">scott.syme@whiterabbitla.com</a> · <a");
    expect(html).toContain(">whiterabbitla.com</a>");
    expect(html).toContain("White Rabbit · Los Angeles<br/>\n7393 W. Manchester Ave #209, Los Angeles, CA 90045");
    expect(html).toContain("You're receiving this because you requested a proposal from White Rabbit LA.");
    expect(html).toContain(PROPOSAL_SEND_LOGO_URL);
    expect(html).toContain("background-color:#223D34;");
  });
});
