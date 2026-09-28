import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { inquiryFirstName, parseFutureInquiryDate, validEmail, withinPacificSendHours } from "../_shared/inquiry-email.ts";

Deno.test("parses supported future inquiry dates and rejects invalid dates", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  assertEquals(parseFutureInquiryDate("12/18/2026", now)?.iso, "2026-12-18");
  assertEquals(parseFutureInquiryDate("2026-12-18", now)?.monthDay, "December 18");
  assertEquals(parseFutureInquiryDate("December 18, 2026", now)?.monthDayOrdinal, "December 18th");
  assertEquals(parseFutureInquiryDate("02/30/2027", now), null);
  assertEquals(parseFutureInquiryDate("September 1, 2026", now), null);
});

Deno.test("preserves couples and validates basic email shape", () => {
  assertEquals(inquiryFirstName("Arielle Smith"), "Arielle");
  assertEquals(inquiryFirstName("Arielle and Sam"), "Arielle and Sam");
  assertEquals(inquiryFirstName("Arielle & Sam"), "Arielle & Sam");
  assertEquals(inquiryFirstName(""), "there");
  assertEquals(validEmail("guest@example.com"), true);
  assertEquals(validEmail("bad@@example.com"), false);
  assertEquals(validEmail("bad @example.com"), false);
});

Deno.test("Pacific send window includes 8am and excludes 8:30pm", () => {
  assertEquals(withinPacificSendHours(new Date("2026-09-28T15:00:00Z")), true);
  assertEquals(withinPacificSendHours(new Date("2026-09-29T03:29:00Z")), true);
  assertEquals(withinPacificSendHours(new Date("2026-09-29T03:30:00Z")), false);
});
import { extractClientNote, validAckLine } from "../_shared/inquiry-email.ts";
Deno.test("extracts client note and validates AI line", () => {
  assertEquals(extractClientNote("Client Type: Individual\nRecommended: The Show\n\nNo additional message."), null);
  assertEquals(extractClientNote("Client Type: Individual\nRecommended: The Show\n\nRooftop at the Proper, 160 guests"), "Rooftop at the Proper, 160 guests");
  assertEquals(extractClientNote("  We are hosting about 160 guests at a vineyard.  "), "We are hosting about 160 guests at a vineyard.");
  assertEquals(extractClientNote("short"), null);
  assertEquals(validAckLine("A rooftop at the Proper for 160 guests sounds like a wonderful room.", "a@b.com"), true);
  assertEquals(validAckLine("Is the rooftop open?", "a@b.com"), false);
  assertEquals(validAckLine("Great room - lovely.", "a@b.com"), false);
  assertEquals(validAckLine("Call 4243941850 soon.", "a@b.com"), false);
});
