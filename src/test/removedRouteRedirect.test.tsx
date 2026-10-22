import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RemovedRouteRedirect from "../components/RemovedRouteRedirect";

afterEach(() => {
  cleanup();
  document.head.innerHTML = "";
  vi.restoreAllMocks();
});

describe("retired-route crawler signals", () => {
  it("sets exact 301 signals synchronously and idempotently before effects", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Encited prerender");
    renderToString(<RemovedRouteRedirect to="/services" />);
    renderToString(<RemovedRouteRedirect to="/services" />);
    expect(document.querySelector('meta[name="prerender-status-code"]')?.getAttribute("content")).toBe("301");
    expect(document.querySelector('meta[name="prerender-header"]')?.getAttribute("content")).toBe("Location: https://whiterabbitla.com/services");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://whiterabbitla.com/services");
    expect(document.querySelectorAll('[data-removed-route="true"]')).toHaveLength(4);
  });

  it("keeps bots on the stub, preserves absolute URLs and retains tags after unmount", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("HeadlessChrome");
    const { unmount } = render(<RemovedRouteRedirect to="https://whiterabbitla.com/experience" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://whiterabbitla.com/experience");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(document.querySelector('meta[name="prerender-header"]')?.getAttribute("content")).toBe("Location: https://whiterabbitla.com/experience");
    expect(document.querySelector('meta[http-equiv="refresh"]')).toBeNull();
    unmount();
    expect(document.querySelectorAll('[data-removed-route="true"]')).toHaveLength(4);
  });

  it("instantly navigates humans without adding crawler metadata", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Safari/605.1.15");
    render(<MemoryRouter initialEntries={["/old"]}><Routes>
      <Route path="/old" element={<RemovedRouteRedirect to="/live" />} />
      <Route path="/live" element={<div>Destination</div>} />
    </Routes></MemoryRouter>);
    expect(screen.getByText("Destination")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-removed-route="true"]')).toHaveLength(0);
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});