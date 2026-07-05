import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import brandOverviewTool from "./tools/brand-overview";

export default defineMcp({
  name: "white-rabbit-la-mcp",
  title: "White Rabbit LA",
  version: "0.1.0",
  instructions:
    "Tools for the White Rabbit LA site. Use `echo` to verify connectivity and `brand_overview` for a concise brand summary.",
  tools: [echoTool, brandOverviewTool],
});
