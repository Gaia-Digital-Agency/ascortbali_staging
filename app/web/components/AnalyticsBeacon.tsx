"use client";

import { useEffect } from "react";

export function AnalyticsBeacon() {
  useEffect(() => {
    const run = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const ua = navigator.userAgent;
        const res = await fetch(`${base}/analytics/visit`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userAgent: ua }),
        });
        const json = await res.json();
        if (json?.visitorId) localStorage.setItem("visitorId", json.visitorId);
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  return null;
}
