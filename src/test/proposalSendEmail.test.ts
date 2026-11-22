import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PROPOSAL_SEND_DEFAULT_MESSAGE,
  PROPOSAL_SEND_FALLBACK_SUBJECT,
  PROPOSAL_SEND_LOGO_URL,
  defaultProposalSubject,
  effectiveProposalSubject,
  renderProposalSendEmailHtml,
  renderProposalSendEmailText,
} from "@/lib/proposalSendEmail";

const serverSource = readFileSync(
  resolve(__dirname, "../../supabase/functions/proposals-api/index.ts"),
  "utf8",
);
const sendBlock = serverSource.slice(serverSource.indexOf('if (action === "send" && req.method === "POST")'));

/** Fill the server's html template with the same values the preview used. */
function serverHtml(greeting: string, messageHtml: string, link: string) {
  const start = sendBlock.indexOf("const html = `") + "const html = `".length;
  const end = sendBlock.indexOf("</body></html>`;", start) + "</body></html>".length;
  return sendBlock
    .slice(start, end)
    .split("${LOGO_URL}").join(PROPOSAL_SEND_LOGO_URL)
    .split('${safeGreeting ? ` ${safeGreeting}` : ""}').join(greeting ? ` ${greeting}` : "")
    .split("${safeMessageHtml}").join(messageHtml)
    .split("${link}").join(link);
}

/** Fill the server's plain-text template with the same values. */
function serverText(greeting: string, messageText: string, link: string) {
  const start = sendBlock.indexOf("const text = `") + "const text = `".length;
  const end = sendBlock.indexOf("`;", start);
  return sendBlock
    .slice(start, end)
    .split('${greetingName ? ` ${greetingName}` : ""}').join(greeting ? ` ${greeting}` : "")
    .split("${messageText}").join(messageText)
    .split("${link}").join(link);
}

const LINK = "https://whiterabbitla.com/proposal/ana-smith";

describe("proposal send preview", () => {
  it("matches the server email body exactly", () => {
    const html = renderProposalSendEmailHtml({ firstName: "Ana", message: "Line one\nLine two", link: LINK });
    expect(html).toBe(serverHtml("Ana", "Line one<br/>Line two", LINK));
  });

  it("uses the same default message as the server", () => {
    expect(sendBlock).toContain(JSON.stringify(PROPOSAL_SEND_DEFAULT_MESSAGE));
    expect(PROPOSAL_SEND_DEFAULT_MESSAGE).toBe(
      "Here's the proposal we discussed. Take your time with it, call me anytime.\n\nBest,\n-Scott",
    );
  });

  it("shows the default message when the personal message is blank", () => {
    const html = renderProposalSendEmailHtml({ firstName: "Ana", message: "   ", link: LINK });
    expect(html).toContain("Here's the proposal we discussed. Take your time with it, call me anytime.<br/><br/>Best,<br/>-Scott");
  });

  it("escapes the message and the name like the server", () => {
    const html = renderProposalSendEmailHtml({ firstName: "<b>Ana", message: "a & <b>", link: LINK });
    expect(html).toContain("Hello &lt;b>Ana,");
    expect(html).toContain("a &amp; &lt;b&gt;");
  });

  it("greets with Hello, when there is no first name", () => {
    expect(renderProposalSendEmailHtml({ firstName: "", message: "x", link: LINK })).toContain(">Hello,</p>");
  });

  it("keeps the existing default subject", () => {
    expect(defaultProposalSubject("Ana")).toBe("Your White Rabbit LA Proposal, Ana");
  });

  it("matches the server plain-text body exactly", () => {
    const text = renderProposalSendEmailText({ firstName: "Ana", message: "Line one\nLine two", link: LINK });
    expect(text).toBe(serverText("Ana", "Line one\nLine two", LINK));
    expect(renderProposalSendEmailText({ firstName: "", message: "", link: LINK })).toBe(
      serverText("", PROPOSAL_SEND_DEFAULT_MESSAGE, LINK),
    );
  });

  it("falls back to the same subject as the server when blank", () => {
    expect(sendBlock).toContain('const finalSubject = subject || "Your White Rabbit LA Proposal";');
    expect(PROPOSAL_SEND_FALLBACK_SUBJECT).toBe("Your White Rabbit LA Proposal");
    expect(effectiveProposalSubject("")).toBe("Your White Rabbit LA Proposal");
    expect(effectiveProposalSubject("Custom")).toBe("Custom");
  });

  it("keeps the default subject template when the first name is empty", () => {
    expect(defaultProposalSubject("")).toBe("Your White Rabbit LA Proposal, ");
  });

  it("keeps the current wording of every fixed line", () => {
    const html = renderProposalSendEmailHtml({ firstName: "Ana", message: "", link: LINK });
    const text = renderProposalSendEmailText({ firstName: "Ana", message: "", link: LINK });
    expect(html).toContain(">Your White Rabbit LA proposal is ready to view.</div>");
    expect(html).toContain(">Hello Ana,</p>");
    expect(html).toContain(">View Your Proposal</a>");
    expect(html).toContain("Or open in your browser:<br/>");
    expect(html).toContain(">Scott Syme</span><br/>");
    expect(html).toContain("White Rabbit LA — Luxury Magic &amp; Entertainment<br/>");
    expect(html).toContain(">(424) 394-1850</a>");
    expect(html).toContain(">scott.syme@whiterabbitla.com</a> · <a");
    expect(html).toContain(">whiterabbitla.com</a>");
    expect(html).toContain("White Rabbit · Los Angeles<br/>\n7393 W. Manchester Ave #209, Los Angeles, CA 90045");
    expect(html).toContain("You're receiving this because you requested a proposal from White Rabbit LA.");
    expect(html).toContain(PROPOSAL_SEND_LOGO_URL);
    expect(PROPOSAL_SEND_LOGO_URL).toBe(
      "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png",
    );
    expect(html).toContain("background-color:#335747;");
    expect(html).toContain("background-color:#223D34;");
    expect(html).toContain("color:#C9A3A8;");
    expect(html).toContain("font-family:Georgia,serif;");
    expect(text).toContain("Scott Syme\nWhite Rabbit LA — Luxury Magic & Entertainment\n(424) 394-1850\nscott.syme@whiterabbitla.com · https://whiterabbitla.com");
    expect(text).toContain(`View your proposal: ${LINK}`);
  });
});
