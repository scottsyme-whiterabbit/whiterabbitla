/**
 * Preview-only copy of the proposal email the server sends.
 *
 * KEEP IN SYNC WITH: supabase/functions/proposals-api/index.ts,
 * the `action === "send"` block (default message, escaping and the `html`
 * template). That server copy is what actually goes out; this file only
 * renders the same body for the admin send preview. Do not reword anything
 * here without changing the server in the same way.
 * src/test/proposalSendEmail.test.ts compares the two.
 */

export const PROPOSAL_SEND_LOGO_URL =
  "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";

/** Same text the server falls back to when the personal message is blank. */
export const PROPOSAL_SEND_DEFAULT_MESSAGE =
  "Here's the proposal we discussed. Take your time with it, call me anytime.\n\nBest,\n-Scott";

export const defaultProposalSubject = (firstName: string) =>
  `Your White Rabbit LA Proposal, ${firstName}`;

/** The message the server will actually send (blank falls back to the default). */
export const effectiveProposalMessage = (message: string | null | undefined) =>
  (message || "").trim() || PROPOSAL_SEND_DEFAULT_MESSAGE;

export function renderProposalSendEmailHtml(input: {
  firstName?: string | null;
  message?: string | null;
  link: string;
}): string {
  const LOGO_URL = PROPOSAL_SEND_LOGO_URL;
  const link = input.link;
  const greetingName = (input.firstName || "").toString().trim();
  const safeGreeting = greetingName.replace(/</g, "&lt;");
  const messageText = effectiveProposalMessage(input.message);
  const safeMessageHtml = messageText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #335747; }
@media screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:#335747;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#335747;">Your White Rabbit LA proposal is ready to view.</div>
<center style="width:100%; background-color:#335747;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#223D34; border-radius:4px;">

<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px; height:auto; display:block; margin:0 auto;" />
</td></tr>

<tr><td style="padding: 0 40px 20px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0;">Hello${safeGreeting ? ` ${safeGreeting}` : ""},</p>
</td></tr>

<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0;">${safeMessageHtml}</p>
</td></tr>

<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<a href="${link}" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">View Your Proposal</a>
</td></tr>

<tr><td style="padding: 0 40px 28px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">Or open in your browser:<br/><a href="${link}" style="color:rgba(201,163,168,0.7); word-break:break-all; text-decoration:none;">${link}</a></p>
</td></tr>

<tr><td style="padding: 0 40px;" class="padding-mobile">
<hr style="border:none; border-top:1px solid rgba(201,163,168,0.15); margin:0 0 24px;" />
</td></tr>

<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:13px; line-height:1.7; color:rgba(245,240,232,0.55);" class="padding-mobile">
<p style="margin:0;">
<span style="color:rgba(245,240,232,0.85);">Scott Syme</span><br/>
White Rabbit LA — Luxury Magic &amp; Entertainment<br/>
<a href="tel:+14243941850" style="color:rgba(201,163,168,0.85); text-decoration:none;">(424) 394-1850</a><br/>
<a href="mailto:scott.syme@whiterabbitla.com" style="color:rgba(201,163,168,0.85); text-decoration:none;">scott.syme@whiterabbitla.com</a> · <a href="https://whiterabbitla.com" style="color:rgba(201,163,168,0.85); text-decoration:none;">whiterabbitla.com</a>
</p>
</td></tr>

<tr><td style="padding: 0 40px 12px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">
White Rabbit · Los Angeles<br/>
7393 W. Manchester Ave #209, Los Angeles, CA 90045
</p>
</td></tr>
<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:11px; color:rgba(245,240,232,0.25);">
You're receiving this because you requested a proposal from White Rabbit LA.
</p>
</td></tr>

</table>
</td></tr></table>
</center>
</body></html>`;
}
