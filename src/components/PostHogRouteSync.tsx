import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { syncPostHogWithRoute } from "@/lib/posthog";

/** Keeps PostHog off internal pages and loads it on public ones after consent. */
const PostHogRouteSync = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    syncPostHogWithRoute(pathname);
  }, [pathname]);
  return null;
};

export default PostHogRouteSync;
