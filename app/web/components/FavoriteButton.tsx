"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

export function FavoriteButton({ serviceId }: { serviceId: string }) {
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await apiFetch(`/me/favorites/${serviceId}`, { method: "POST" });
      alert("Saved to favorites");
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={save} disabled={loading} className="btn btn-outline">
      {loading ? "SAVING..." : "FAVORITE"}
    </button>
  );
}
