import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { inquiryFirstName, validEmail, withinPacificSendHours } from "../_shared/inquiry-email.ts";

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
