import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Footer from "../components/Footer";
import ServiceAreaDetail from "../pages/ServiceAreaDetail";
import BlogArticle from "../pages/BlogArticle";
import SeoLanding from "../pages/SeoLanding";

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
function render(path: string, routePath: string, element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>,
    ),
  );
  return container;
}

const linksTo = (el: HTMLElement, href: string) =>
  Array.from(el.querySelectorAll<HTMLAnchorElement>(`a[href="${href}"]`)).map((a) => a.textContent?.trim());

const BASED_IN_LA = "White Rabbit LA is based in Los Angeles. If you are planning an evening here, this is how to hire a magician in Los Angeles.";

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

describe("internal links to the Los Angeles hire page", () => {
  it("footer links to /areas/los-angeles as Los Angeles Magician", () => {
    const page = render("/", "/", <Footer />);
    expect(linksTo(page, "/areas/los-angeles")).toEqual(["Los Angeles Magician"]);
  });

  it("other area pages carry the Los Angeles magician for hire line", () => {
    const page = render("/areas/beverly-hills", "/areas/:citySlug", <ServiceAreaDetail />);
    expect(page.textContent).toContain("Hosting closer to our home base? See the Los Angeles magician for hire page.");
    expect(linksTo(page, "/areas/los-angeles")).toContain("Los Angeles magician for hire");
  });

  it("the Los Angeles page does not link to itself with that line", () => {
    const page = render("/areas/los-angeles", "/areas/:citySlug", <ServiceAreaDetail />);
    expect(page.textContent).not.toContain("Hosting closer to our home base?");
    expect(linksTo(page, "/areas/los-angeles")).not.toContain("Los Angeles magician for hire");
    expect(page.textContent).toContain("rated 5.0 on Google across 45+ reviews.");
  });

  it("the Los Angeles experiences article shows its host callout and skips the single line", () => {
    const page = render("/blog/best-magic-experiences-los-angeles", "/blog/:slug", <BlogArticle />);
    const callouts = page.querySelectorAll('[data-testid="article-host-callout"]');
    expect(callouts).toHaveLength(1);
    const callout = callouts[0] as HTMLElement;
    expect(callout.textContent).toContain("Hosting, not buying a ticket?");
    expect(linksTo(callout, "/areas/los-angeles")).toEqual(["hire a magician in Los Angeles"]);
    expect(linksTo(callout, "/services/private-magic-show")).toEqual(["the private magic show"]);
    expect(page.textContent).not.toContain(BASED_IN_LA);
  });

  it("the Las Vegas shows article shows its host callout and skips the single line", () => {
    const page = render("/blog/best-magic-shows-las-vegas", "/blog/:slug", <BlogArticle />);
    const callouts = page.querySelectorAll('[data-testid="article-host-callout"]');
    expect(callouts).toHaveLength(1);
    const callout = callouts[0] as HTMLElement;
    expect(callout.textContent).toContain("Planning an event rather than a night out?");
    expect(linksTo(callout, "/areas/las-vegas")).toEqual(["Las Vegas magician"]);
    expect(linksTo(callout, "/areas/los-angeles")).toEqual(["hire a magician in Los Angeles"]);
    expect(page.textContent).not.toContain(BASED_IN_LA);
  });

  it("any other article has no callout but carries the based in Los Angeles line", () => {
    const page = render("/blog/why-cocktail-hour-entertainment-matters", "/blog/:slug", <BlogArticle />);
    expect(page.querySelector('[data-testid="article-host-callout"]')).toBeNull();
    expect(page.textContent).toContain(BASED_IN_LA);
    expect(linksTo(page, "/areas/los-angeles")).toContain("hire a magician in Los Angeles");
  });

  it("city landing pages outside Los Angeles carry the based in Los Angeles line", () => {
    const page = render("/blog/miami-charity-gala-magician", "/blog/:slug", <SeoLanding />);
    expect(page.textContent).toContain(BASED_IN_LA);
    expect(linksTo(page, "/areas/los-angeles")).toContain("hire a magician in Los Angeles");
  });

  it("Los Angeles city landing pages skip the based in Los Angeles line", () => {
    const page = render("/blog/los-angeles-close-up-magician", "/blog/:slug", <SeoLanding />);
    expect(page.querySelector("h1")).not.toBeNull();
    expect(page.textContent).not.toContain(BASED_IN_LA);
  });
});
