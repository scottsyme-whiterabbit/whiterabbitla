export { eventDateRangeError } from "../../supabase/functions/newsletter-admin/event-date-range";
export { isSquareHistory } from "../../supabase/functions/newsletter-admin/revenue-stats";
export type { RevenueFlag } from "../../supabase/functions/newsletter-admin/revenue-stats";
import type { computeRevenueStats } from "../../supabase/functions/newsletter-admin/revenue-stats";
export type RevenueStats = ReturnType<typeof computeRevenueStats> & { autoBooked?: string[] };

export const FLAG_LABELS: Record<string, string> = {
  event_passed_open: "Event date passed, still open, nothing paid",
  on_hold_past: "On hold, event date passed",
  booked_past: "Booked, event date passed (mark completed?)",
  paid_not_booked: "Signed or paid but not booked",
};
