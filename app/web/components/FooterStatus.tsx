// This module defines the FooterStatus component, which displays various application status details.
"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

// Type definition for data fetched for the footer status.
type FooterStatusData = {
  visitorCount: number;
  ip: string;
  location: string;
};

// FooterStatus functional component.
export function FooterStatus() {
  // State variables for application status data and the current date.
  const [status, setStatus] = useState<FooterStatusData | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  // Effect hook to fetch analytics status and set the current date on component mount.
  useEffect(() => {
    setCurrentDate(new Date().toLocaleString()); // Set the current date and time.
    const fetchStatus = async () => {
      try {
        // Fetch analytics status from the API.
        const res = await fetch(`${API_BASE}/analytics/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data); // Update status state with fetched data.
      } catch {
        // Ignore any errors to avoid disrupting the main application flow.
      }
    };

    fetchStatus(); // Execute the status fetching function.
  }, []);

  return (
    // Render the footer with application status details.
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-xs tracking-[0.18em] text-brand-muted md:flex-row md:items-start md:justify-between">
      {/* Copyright and developer information. */}
      <div className="space-y-2 text-center md:text-left">
        <div>DATA PRIVACY SECURED</div>
        <div>NUMBER OF VISITORS: {status?.visitorCount ?? 12876}</div>
        <div>COPYRIGHT (C) 2026</div>
        <div>Your visit to this site is subject to this website terms and condition.</div>
      </div>
      {/* Dynamic status information like visitor count, date, location, and IP. */}
      <div className="space-y-2 text-center md:text-right">
        <div>CURRENT DATE: {currentDate || "—"}</div>
        <div>CURRENT LOCATION: {status?.location ?? "—"}</div>
        <div>CURRENT IP: {status?.ip ?? "—"}</div>
      </div>
    </div>
  );
}
