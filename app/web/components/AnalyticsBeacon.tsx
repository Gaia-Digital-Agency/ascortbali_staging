// This module defines the AnalyticsBeacon component, which sends visitor data to the analytics API.
"use client";

import { useEffect } from "react";

// AnalyticsBeacon functional component.
export function AnalyticsBeacon() {
  // Effect hook to send visitor data to the analytics API on component mount.
  useEffect(() => {
    const run = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!; // Get API base URL from environment variables.
        const ua = navigator.userAgent; // Get user agent string.
        // Send a POST request to the analytics visit endpoint.
        const res = await fetch(`${base}/analytics/visit`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userAgent: ua }),
        });
        const json = await res.json(); // Parse the response.
        // If a visitorId is received, store it in local storage.
        if (json?.visitorId) localStorage.setItem("visitorId", json.visitorId);
      } catch {
        // Ignore any errors to avoid disrupting the main application flow.
      }
    };
    run(); // Execute the analytics tracking function.
  }, []);

  return null; // The component does not render any visible UI.
}
