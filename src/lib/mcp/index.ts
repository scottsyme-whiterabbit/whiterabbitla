import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import brandOverviewTool from "./tools/brand-overview";
import importContactsTool from "./tools/import-contacts";

export default defineMcp({
  name: "white-rabbit-la-mcp",
  title: "White Rabbit LA",
  version: "0.2.0",
  instructions:
    "Tools for the White Rabbit LA site. Use `echo` to verify connectivity, `brand_overview` for a brand summary, and `import_contacts` to upload Apollo-scraped contacts into a specific drip campaign category (dedupes + respects suppression list; inserted paused unless start_immediately=true).",
  tools: [echoTool, brandOverviewTool, importContactsTool],
});
