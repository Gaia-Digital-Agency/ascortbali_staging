"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { withBasePath } from "../lib/paths";

const STORAGE_PREFIX = "age_gate_ok_";

type AgeGateStatus = {
  ip: string | null;
  open: boolean;
};

export function AgeGateModal() {
  const [state, setState] = useState<AgeGateStatus>({ ip: null, open: false });

  const localKey = useMemo(() => {
    const safeIp = (state.ip || "no-ip").replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${STORAGE_PREFIX}${safeIp}`;
  }, [state.ip]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/analytics/status`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const ip = String(json?.ip ?? "").trim();
          if (ip) {
            setState((prev) => ({ ...prev, ip }));
            if (window.localStorage.getItem(`${STORAGE_PREFIX}${ip.replace(/[^a-zA-Z0-9.-]/g, "_")}`)) {
              setState((prev) => ({ ...prev, open: false }));
              return;
            }
          }
        }
      } catch {
        // Keep the existing stored preference if IP cannot be fetched.
        const key = localKey;
        if (key && window.localStorage.getItem(key)) {
          setState((prev) => ({ ...prev, open: false }));
          return;
        }
      }
      setState((prev) => ({ ...prev, open: true }));
    };
    check();
  }, [localKey]);

  const accept = () => {
    if (state.ip) {
      window.localStorage.setItem(`${STORAGE_PREFIX}${state.ip.replace(/[^a-zA-Z0-9.-]/g, "_")}`, "1");
    } else if (localKey) {
      window.localStorage.setItem(localKey, "1");
    }
    setState((prev) => ({ ...prev, open: false }));
  };

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-brand-line bg-brand-surface p-8 shadow-luxe">
        <h2 className="font-display text-2xl">Age Verification</h2>
        <p className="mt-3 text-sm text-brand-muted">
          I am 18 years of age and above and agree to this site terms of use (<a href={withBasePath("/terms")} className="text-brand-gold hover:underline">T&C</a>) and Privacy
          Statement (<a href={withBasePath("/privacy")} className="text-brand-gold hover:underline">Privacy Statement</a>).
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn btn-primary px-4 py-2 text-xs" onClick={accept}>
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
}
