// Centralized GA4 event helper
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const trackEvent = (eventName: string, params?: Record<string, string | number>) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
};

// Key events — mark these as "Key Events" in GA4 Admin
export const trackQuizStart = (quizType: "booking" | "discovery") =>
  trackEvent("quiz_start", { quiz_type: quizType });

export const trackQuizComplete = (quizType: "booking" | "discovery", category?: string) =>
  trackEvent("quiz_complete", { quiz_type: quizType, event_category: category || "" });

export const trackFormSubmit = (formName: string, category?: string) =>
  trackEvent("form_submit", { form_name: formName, event_category: category || "" });

export const trackCTAClick = (ctaLabel: string, location?: string) =>
  trackEvent("cta_click", { cta_label: ctaLabel, cta_location: location || "" });
