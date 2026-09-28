export function pacificParts(now = new Date()): { year: number; month: number; day: number; hour: number; minute: number; isoDate: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  return {
    year,
    month,
    day,
    hour: value("hour"),
    minute: value("minute"),
    isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

export function inquiryFirstName(name: string | null | undefined): string {
  const clean = name?.trim();
  if (!clean) return "there";
  if (/\s(?:and|&)\s/i.test(clean)) return clean;
  return clean.split(/\s+/)[0] || "there";
}

export function validEmail(email: string | null | undefined): boolean {
  const value = email?.trim() || "";
  if (/\s/.test(value)) return false;
  const parts = value.split("@");
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes(".") && !parts[1].startsWith(".") && !parts[1].endsWith(".");
}

export function withinPacificSendHours(now = new Date()): boolean {
  const { hour, minute } = pacificParts(now);
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 8 * 60 && totalMinutes < 20 * 60 + 30;
}
export const CALENDAR_URL = "https://calendar.app.google/qgd4ck3DCgBKTYHU8";
