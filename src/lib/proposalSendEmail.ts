/**
 * The admin send preview renders the proposal email from the same shared
 * module the proposals-api send action uses
 * (supabase/functions/_shared/proposal-send-email.ts), so the preview always
 * matches what goes out. Only the editor's default subject lives here.
 */
export {
  PROPOSAL_PUBLIC_ORIGIN,
  PROPOSAL_SEND_FALLBACK_SUBJECT,
  PROPOSAL_SEND_LOGO_URL,
  LEGACY_PROPOSAL_SEND_MESSAGE,
  buildProposalSendMessage,
  defaultHoldUntilIso,
  effectiveHoldUntilIso,
  effectiveProposalSubject,
  formatHoldDate,
  isLegacyDefaultProposalMessage,
  proposalLinkFromPosted,
  proposalPublicLink,
  proposalSendGreeting,
  renderProposalSendEmailHtml,
  renderProposalSendEmailText,
  resolveProposalSendMessage,
  type ProposalSendContext,
} from "../../supabase/functions/_shared/proposal-send-email";

/** Editor default subject (unchanged). */
export const defaultProposalSubject = (firstName: string) =>
  `Your White Rabbit LA Proposal, ${firstName}`;
