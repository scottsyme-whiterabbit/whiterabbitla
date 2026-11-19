import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptureResult } from "posthog-js";

const ph = vi.hoisted(() => ({
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  capture: vi.fn(),
  startSessionRecording: vi.fn(),
  stopSessionRecording: vi.fn(),
  sessionRecordingStarted: vi.fn(() => true),
}));
const invoke = vi.hoisted(() => vi.fn(async () => ({ data: { token: "phc_test" }, error: null })));

vi.mock("posthog-js", () => ({ default: ph }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

import {
  POSTHOG_OPTIONS,
  __resetPostHogForTests,
  allowedProperties,
  beforeSend,
  classifyLink,
  contactEventType,
  guestCountRange,
  isInternalPath,
  optInPostHog,
  optOutPostHog,
  sanitizeUrl,
  syncPostHogWithRoute,
  track,
} from "@/lib/posthog";

const flush = () => new Promise((r) => setTimeout(r, 0));

function goTo(path: string) {
  window.history.pushState({}, "", path);
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetPostHogForTests();
  localStorage.clear();
  sessionStorage.clear();
  goTo("/");
});

describe("PostHog settings", () => {
  it("uses the requested setup", () => {
    expect(POSTHOG_OPTIONS.api_host).toBe("https://us.i.posthog.com");
    expect(POSTHOG_OPTIONS.person_profiles).toBe("identified_only");
    expect(POSTHOG_OPTIONS.capture_pageview).toBe("history_change");
    expect(POSTHOG_OPTIONS.autocapture).toBe(true);
    expect(POSTHOG_OPTIONS.disable_session_recording).toBe(false);
    expect(POSTHOG_OPTIONS.session_recording?.maskAllInputs).toBe(true);
    expect(POSTHOG_OPTIONS.opt_out_capturing_by_default).toBe(true);
  });
});

describe("cookie banner choice", () => {
  it("loads nothing and sends nothing before the visitor answers", async () => {
    track("quiz_started");
    syncPostHogWithRoute("/");
    await flush();
    expect(invoke).not.toHaveBeenCalled();
    expect(ph.init).not.toHaveBeenCalled();
  });

  it("stays off after Decline", async () => {
    localStorage.setItem("wr-cookie-consent", "declined");
    track("hero_cta_clicked", { label: "Check your date" });
    syncPostHogWithRoute("/");
    await flush();
    expect(ph.init).not.toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it("opts in after Accept and sends the queued event", async () => {
    localStorage.setItem("wr-cookie-consent", "accepted");
    optInPostHog();
    track("hero_cta_clicked", { label: "Check your date" });
    await flush();
    await flush();
    expect(ph.init).toHaveBeenCalledWith("phc_test", POSTHOG_OPTIONS);
    expect(ph.opt_in_capturing).toHaveBeenCalled();
    expect(ph.capture).toHaveBeenCalledWith("hero_cta_clicked", { label: "Check your date" }, undefined);
  });

  it("remembers an earlier Accept on the next visit", async () => {
    localStorage.setItem("wr-cookie-consent", "accepted");
    syncPostHogWithRoute("/");
    await flush();
    await flush();
    expect(ph.init).toHaveBeenCalledTimes(1);
  });

  it("Decline after Accept opts out", async () => {
    localStorage.setItem("wr-cookie-consent", "accepted");
    optInPostHog();
    await flush();
    await flush();
    localStorage.setItem("wr-cookie-consent", "declined");
    optOutPostHog();
    expect(ph.opt_out_capturing).toHaveBeenCalled();
  });
});

describe("internal pages", () => {
  it.each(["/admin/newsletter", "/admin/proposals", "/admin/social", "/proposals/template", "/proposal/smith-wedding", "/residency/abc", "/pay/tok123", "/unsubscribe"])(
    "%s is internal",
    (path) => expect(isInternalPath(path)).toBe(true),
  );

  it.each(["/", "/reviews", "/contact", "/blog/some-article", "/consultation", "/card", "/review", "/services/wedding-magician"])(
    "%s is public",
    (path) => expect(isInternalPath(path)).toBe(false),
  );

  it("never loads PostHog on an internal page, even after Accept", async () => {
    localStorage.setItem("wr-cookie-consent", "accepted");
    goTo("/admin/newsletter");
    optInPostHog();
    syncPostHogWithRoute("/admin/newsletter");
    track("quiz_started");
    await flush();
    expect(invoke).not.toHaveBeenCalled();
    expect(ph.init).not.toHaveBeenCalled();
  });

  it("drops any event recorded on an internal page", () => {
    const ev = { uuid: "1", event: "$autocapture", properties: { $current_url: "https://whiterabbitla.com/admin/newsletter", $pathname: "/admin/newsletter" } } as CaptureResult;
    expect(beforeSend(ev)).toBeNull();
  });

  it("stops session replay when moving to an internal page", async () => {
    localStorage.setItem("wr-cookie-consent", "accepted");
    syncPostHogWithRoute("/");
    await flush();
    await flush();
    goTo("/admin/proposals");
    syncPostHogWithRoute("/admin/proposals");
    expect(ph.stopSessionRecording).toHaveBeenCalled();
  });
});

describe("no personal details in events", () => {
  it("keeps only each event's allowed properties", () => {
    expect(allowedProperties("inquiry_submitted", { event_type: "wedding", guest_count_range: "30_75", name: "Jordan", email: "j@x.com", phone: "555", budget: "Go All Out", message: "hi" }))
      .toEqual({ event_type: "wedding", guest_count_range: "30_75" });
    expect(allowedProperties("phone_or_email_clicked", { channel: "phone", href: "tel:+1" })).toEqual({ channel: "phone" });
  });

  it("refuses values that look like an email or long free text", () => {
    expect(allowedProperties("hero_cta_clicked", { label: "someone@example.com" })).toEqual({});
    expect(allowedProperties("hero_cta_clicked", { label: "x".repeat(41) })).toEqual({});
  });

  it("rejects event names that are not on the list", () => {
    expect(allowedProperties("contact_details_entered", { name: "Jordan" })).toBeNull();
  });

  it("strips extra properties from custom events right before sending", () => {
    const ev = { uuid: "1", event: "inquiry_submitted", properties: { event_type: "wedding", guest_count_range: "under_30", email: "j@x.com", $pathname: "/contact" } } as CaptureResult;
    expect(beforeSend(ev)!.properties).toEqual({ event_type: "wedding", guest_count_range: "under_30", $pathname: "/contact" });
  });

  it("keeps PostHog's own identity and token fields on custom events", () => {
    const ev = { uuid: "1", event: "quiz_started", properties: { distinct_id: "anon-1", token: "phc_test", $pathname: "/" } } as CaptureResult;
    expect(beforeSend(ev)!.properties).toEqual({ distinct_id: "anon-1", token: "phc_test", $pathname: "/" });
  });

  it("cleans page addresses everywhere PostHog puts them", () => {
    const leak = "https://whiterabbitla.com/?email=a%40b.com&utm_source=ig";
    const ev = {
      uuid: "1",
      event: "$web_vitals",
      properties: {
        $pathname: "/",
        $session_entry_url: leak,
        $heatmap_data: { [leak]: [{ x: 1 }] },
        $web_vitals_LCP_event: { navigationURL: leak, $current_url: leak },
      },
      $set_once: { $initial_person_info: { u: leak } },
    } as unknown as CaptureResult;
    const out = JSON.stringify(beforeSend(ev));
    expect(out).not.toContain("a%40b");
    expect(out).toContain("https://whiterabbitla.com/?utm_source=ig");
  });

  it("removes query values from page addresses but keeps campaign tags", () => {
    expect(sanitizeUrl("https://whiterabbitla.com/review?cid=123&email=a%40b.com&utm_source=google#x")).toBe("https://whiterabbitla.com/review?utm_source=google");
  });

  it("sends guest count as a range, never the exact count", () => {
    expect(guestCountRange("intimate")).toBe("under_30");
    expect(guestCountRange("medium")).toBe("30_75");
    expect(guestCountRange("large")).toBe("75_150");
    expect(guestCountRange("xlarge")).toBe("150_plus");
    expect(guestCountRange("")).toBe("unknown");
  });

  it("turns the Contact form's typed event type into a fixed bucket", () => {
    expect(contactEventType("Our wedding at the Biltmore")).toBe("wedding");
    expect(contactEventType("Corporate holiday party")).toBe("corporate");
    expect(contactEventType("Mom's 60th birthday")).toBe("private");
    expect(contactEventType("Jordan Smith")).toBe("other");
    expect(contactEventType("")).toBe("unknown");
  });
});

describe("link clicks", () => {
  const origin = "https://whiterabbitla.com";
  it("phone and email links", () => {
    expect(classifyLink("tel:+14243941850", origin)).toEqual({ event: "phone_or_email_clicked", props: { channel: "phone" } });
    expect(classifyLink("mailto:events@whiterabbitla.com", origin)).toEqual({ event: "phone_or_email_clicked", props: { channel: "email" } });
  });

  it("review links", () => {
    expect(classifyLink("https://g.page/r/CXLCQWnGrGWrEAE", origin)?.props).toEqual({ destination: "google" });
    expect(classifyLink("https://g.page/r/CXLCQWnGrGWrEAE/review", origin)?.props).toEqual({ destination: "google" });
    expect(classifyLink("/reviews", origin)?.props).toEqual({ destination: "reviews_page" });
    expect(classifyLink("/review", origin)).toBeNull();
    expect(classifyLink("/contact", origin)).toBeNull();
  });
});
