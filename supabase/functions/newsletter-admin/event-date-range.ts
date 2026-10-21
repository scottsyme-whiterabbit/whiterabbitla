// Shared by newsletter-admin and the admin forms: an event date must be a real
// YYYY-MM-DD between 2020-01-01 and three years after today.
export function eventDateRangeError(value: unknown, now: Date = new Date()): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
    return "Event date must be a date in YYYY-MM-DD format.";
  }
  if (value < "2020-01-01") return "Event date cannot be before January 1, 2020. Please check the year.";
  const max = new Date(now);
  max.setFullYear(max.getFullYear() + 3);
  const maxIso = max.toISOString().slice(0, 10);
  if (value > maxIso) return "Event date cannot be more than 3 years from today. Please check the year.";
  return null;
}
