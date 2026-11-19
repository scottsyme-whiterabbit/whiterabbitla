import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";

// PostHog analytics: loads only after the cookie banner is accepted, never on internal pages.
initPostHog();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
