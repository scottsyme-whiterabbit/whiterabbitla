import { defineTool } from "@lovable.dev/mcp-js";

const OVERVIEW = `White Rabbit LA — luxury private magic and sophisticated event entertainment.
Founder: Scott Syme. Based in Los Angeles, performs nationwide.
Positioning: white-glove hospitality; magic performed WITH guests, never AT them.
Signature offerings: Cocktail-hour close-up, Private Magic Show, Speakeasy sets, Magic Mondays residency.
Booking lead time: 4–6 weeks (8–12 weeks peak season).
Contact: scott.syme@whiterabbitla.com — https://whiterabbitla.com`;

export default defineTool({
  name: "brand_overview",
  title: "Brand overview",
  description: "Returns a concise overview of White Rabbit LA — positioning, offerings, and contact info.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({ content: [{ type: "text", text: OVERVIEW }] }),
});
