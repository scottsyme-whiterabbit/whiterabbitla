export interface ParsedInquiryDate {
  iso: string;
  monthDay: string;
  monthDayOrdinal: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_INDEX = new Map(MONTHS.map((month, index) => [month.toLowerCase(), index + 1]));

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

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}

function validCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

export function parseFutureInquiryDate(raw: string | null | undefined, now = new Date()): ParsedInquiryDate | null {
  const value = raw?.trim();
  if (!value) return null;

  let year = 0;
  let month = 0;
  let day = 0;
  let match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    month = Number(match[1]);
    day = Number(match[2]);
    year = Number(match[3]);
  } else {
    match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else {
      match = value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
      if (!match) return null;
      month = MONTH_INDEX.get(match[1].toLowerCase()) || 0;
      day = Number(match[2]);
      year = Number(match[3]);
    }
  }

  if (!validCalendarDate(year, month, day)) return null;
  const pacific = pacificParts(now);
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (iso <= pacific.isoDate) return null;
  return {
    iso,
    monthDay: `${MONTHS[month - 1]} ${day}`,
    monthDayOrdinal: `${MONTHS[month - 1]} ${day}${ordinal(day)}`,
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
export const CALENDAR_URL = "https://calendar.app.google/58WjggPt3RFAcJjq8";
export const FALLBACK_ACK_LINE = "I read through what you sent and it sounds like a great evening.";

export function extractClientNote(message: string | null | undefined): string | null {
  if (!message || message.length < 15) return null;
  const idx = message.indexOf("Recommended:");
  if (idx === -1) return message.trim() || null;
  const lineEnd = message.indexOf("\n", idx);
  const rest = lineEnd === -1 ? "" : message.slice(lineEnd + 1).trim();
  if (!rest || /^No additional message/i.test(rest)) return null;
  return rest;
}

const BANNED_ACK = ["thank you so much", "reaching out", "just checking in", "i'm available", "is open", "free that", "my calendar", "package", "pricing", "quote", "deposit"];

export function validAckLine(line: string | null | undefined, clientEmail: string): boolean {
  const s = (line || "").trim();
  if (!s || s.length > 200) return false;
  if ((s.match(/\. [A-Z]/g) || []).length > 1) return false;
  if (["$", "http", "www.", "?", "\u2014", "\u2013"].some((t) => s.includes(t))) return false;
  if (/\s-\s/.test(s)) return false;
  const lower = s.toLowerCase();
  if (BANNED_ACK.some((t) => lower.includes(t))) return false;
  if (clientEmail && lower.includes(clientEmail.toLowerCase())) return false;
  if (/\d{7,}/.test(s)) return false;
  return true;
}
