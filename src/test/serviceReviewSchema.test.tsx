import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ServicePage from "../pages/ServicePage";

beforeAll(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

let root: Root | undefined;
function renderService(slug: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      <MemoryRouter initialEntries={[`/services/${slug}`]}>
        <Routes>
          <Route path="/services/:serviceSlug" element={<ServicePage />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
  return container;
}

const ldTypes = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((s) => JSON.parse(s.textContent || "{}"))
    .flatMap((j) => (Array.isArray(j) ? j : [j]))
    .map((j) => j["@type"]);

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

describe("service page review markup", () => {
  const cases: [string, string][] = [
    ["charity-gala-magician", "Andres O., Black Tie Event"],
    ["trade-show-magician", "Miguel V., Corporate Company Event"],
    ["holiday-party-magician", "Grace G., Corporate Holiday Dinner"],
  ];
  for (const [slug, attribution] of cases) {
    it(`${slug} has no Review structured data but keeps the visible testimonial`, () => {
      const page = renderService(slug);
      expect(ldTypes()).not.toContain("Review");
      expect(ldTypes()).not.toContain("AggregateRating");
      expect(document.getElementById("service-review-schema")).toBeNull();
      expect(page.textContent).toContain(attribution);
    });
  }
});
