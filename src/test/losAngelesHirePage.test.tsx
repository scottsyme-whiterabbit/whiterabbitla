import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ServiceAreaDetail from "../pages/ServiceAreaDetail";

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
function renderArea(slug: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      <MemoryRouter initialEntries={[`/areas/${slug}`]}>
        <Routes>
          <Route path="/areas/:citySlug" element={<ServiceAreaDetail />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
  return container;
}

const faqQuestions = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((s) => JSON.parse(s.textContent || "{}"))
    .filter((j) => j["@type"] === "FAQPage")
    .flatMap((j) => j.mainEntity.map((q: { name: string }) => q.name));

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

describe("dedicated Los Angeles hire page", () => {
  it("renders the new H1, sections and FAQ on /areas/los-angeles", () => {
    const page = renderArea("los-angeles");
    expect(page.querySelector("h1")?.textContent).toBe("Hire a Magician in Los Angeles");
    expect(page.textContent).toContain("Two ways to host magic in Los Angeles");
    expect(page.textContent).toContain("Who invites White Rabbit in Los Angeles");
    expect(page.textContent).not.toContain("What Makes White Rabbit Different");
    expect(page.textContent).not.toMatch(/\d+ Entertainment Options/);
    expect(page.querySelector('a[href="/services/charity-gala-magician"]')).not.toBeNull();
    expect(page.querySelector('a[href="/reviews"]')?.textContent).toContain("Read every review");
    expect(faqQuestions()).toContain("How do I hire a magician in Los Angeles?");
    expect(faqQuestions()).toHaveLength(7);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Hire a Los Angeles magician for a corporate evening, wedding or private party. Close-up magic in the cocktail hour or a parlor show, from a Magic Castle member.",
    );
  });

  it("leaves other area pages on the original template", () => {
    const page = renderArea("beverly-hills");
    expect(page.querySelector("h1")?.textContent).toBe("Magician in Beverly Hills");
    expect(page.textContent).toContain("What Makes White Rabbit Different");
    expect(page.textContent).toContain("Types of Events in Beverly Hills");
    expect(page.textContent).not.toContain("Two ways to host magic");
    expect(faqQuestions()).toEqual([
      "How do I book a magician for an event in Beverly Hills?",
      "What types of events can a magician perform at in Beverly Hills?",
      "How far in advance should I book a magician in Beverly Hills?",
      "Does the magician travel to Beverly Hills?",
      "What is close-up magic and is it right for my Beverly Hills event?",
    ]);
  });
});
