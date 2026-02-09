// This module defines the BuyButton component for initiating service orders.
"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

// BuyButton functional component.
export function BuyButton({ serviceId }: { serviceId: string }) {
  const [loading, setLoading] = useState(false); // State to manage loading status during order creation.

  // Handles the buying action: creates an order via API call.
  const buy = async () => {
    setLoading(true); // Set loading to true while the API request is in progress.
    try {
      // Send a POST request to the /orders endpoint to create a new order.
      const order = await apiFetch("/orders", { method: "POST", body: JSON.stringify({ serviceId }) });
      alert(`Order created: ${order.id}`); // Alert the user with the new order ID.
    } catch (e: any) {
      alert(`Failed: ${e.message}`); // Alert the user if the order creation fails.
    } finally {
      setLoading(false); // Reset loading status after the API request is complete.
    }
  };

  return (
    // Render a button that triggers the buy function when clicked.
    <button onClick={buy} disabled={loading} className="btn btn-primary">
      {loading ? "CREATING..." : "CREATE ORDER"} {/* Display dynamic text based on loading status. */}
    </button>
  );
}
