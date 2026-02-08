"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

export function BuyButton({ serviceId }: { serviceId: string }) {
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    setLoading(true);
    try {
      const order = await apiFetch("/orders", { method: "POST", body: JSON.stringify({ serviceId }) });
      alert(`Order created: ${order.id}`);
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={buy} disabled={loading} className="btn btn-primary">
      {loading ? "CREATING..." : "CREATE ORDER"}
    </button>
  );
}
