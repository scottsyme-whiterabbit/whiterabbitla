import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PROPOSAL_SEND_DEFAULT_MESSAGE,
  PROPOSAL_SEND_LOGO_URL,
  defaultProposalSubject,
  renderProposalSendEmailHtml,
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
});
