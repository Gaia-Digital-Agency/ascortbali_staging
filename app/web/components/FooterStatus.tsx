"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

type FooterStatusData = {
  visitorCount: number;
  ip: string;
  location: string;
};

export function FooterStatus() {
  const [status, setStatus] = useState<FooterStatusData | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleString());
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/analytics/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data);
      } catch {
        // ignore
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-xs tracking-[0.18em] text-brand-muted md:flex-row md:items-start md:justify-between">
      <div className="space-y-2 text-center md:text-left">
        <div>DEVELOPED BY GAIADA</div>
        <div>DATA PRIVACY SECURES</div>
        <div>COPYRIGHT (R) 2026</div>
      </div>
      <div className="space-y-2 text-center md:text-right">
        <div>NUMBER OF VISITORS: {status?.visitorCount ?? "—"}</div>
        <div>CURRENT DATE: {currentDate || "—"}</div>
        <div>CURRENT LOCATION: {status?.location ?? "—"}</div>
        <div>CURRENT IP: {status?.ip ?? "—"}</div>
      </div>
    </div>
  );
}
