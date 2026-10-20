export const LOST_REASONS = [
  "Ghosted / no response",
  "Pricing / budget",
  "Date conflict",
  "Decision delayed",
  "Went with another vendor",
  "Wrong fit (entertainment style)",
  "Other",
] as const;

export function lostReasonError(stage: unknown, reason: unknown): string | null {
  if (stage !== "lost") return null;
  if (typeof reason !== "string" || !reason.trim()) return "A lost reason is required before moving a deal to Lost.";
  if (reason.trim() === "Other" || /^Other:\s*$/i.test(reason.trim())) return "Enter a short explanation for Other.";
  return null;
}