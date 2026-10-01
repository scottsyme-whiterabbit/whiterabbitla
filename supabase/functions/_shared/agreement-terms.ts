// Pure helpers shared by the proposal page (preview) and proposals-api (signing),
// so the client is shown exactly the terms the server records. No runtime imports.

export interface AgreementTermOptions {
  omit_photography?: boolean | null;
  special_terms?: string | null;
}

const ADDITIONAL_HEADING = "Additional Terms Agreed:";
const CONTACT_HEADING = "Contact Information:";

export const normalizeSpecialTerms = (s: string | null | undefined): string =>
  String(s ?? "").replace(/\r\n?/g, "\n").trim();

/** The exact block inserted above Contact Information, or "" when there are no terms. */
export const additionalTermsBlock = (special: string | null | undefined): string => {
  const t = normalizeSpecialTerms(special);
  return t ? `${ADDITIONAL_HEADING}\n${t}\n\n\n` : "";
};

/** Remove any Additional Terms block and nothing else. */
const stripAdditional = (text: string): string =>
  text.replace(new RegExp(`${ADDITIONAL_HEADING}\\n[\\s\\S]*\\n\\n\\n(?=${CONTACT_HEADING})`), "");

/** Remove the Photography and Video heading and its single paragraph. */
const stripPhotography = (text: string): string =>
  text.replace(/\nPhotography and Video:\n[^\n]*\n/, "\n");

/**
 * Apply per proposal terms to the standard agreement text. With no options set the
 * text is returned unchanged. Any Additional Terms block already present is replaced,
 * so only the stored proposal values can end up in the result.
 */
export function applyAgreementTerms(text: string, opts: AgreementTermOptions): string {
  let out = stripAdditional(text);
  if (opts.omit_photography) out = stripPhotography(out);
  const block = additionalTermsBlock(opts.special_terms);
  if (block) {
    const idx = out.indexOf(`\n${CONTACT_HEADING}`);
    if (idx >= 0) out = out.slice(0, idx + 1) + block + out.slice(idx + 1);
  }
  return out;
}
