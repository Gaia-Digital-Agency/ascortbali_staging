// This module defines the FavoriteButton component for adding services to a user's favorites.
"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

// FavoriteButton functional component.
export function FavoriteButton({ serviceId }: { serviceId: string }) {
  const [loading, setLoading] = useState(false); // State to manage loading status during favorite action.

  // Handles saving a service to favorites via API call.
  const save = async () => {
    setLoading(true); // Set loading to true while the API request is in progress.
    try {
      // Send a POST request to the /me/favorites/:serviceId endpoint.
      await apiFetch(`/me/favorites/${serviceId}`, { method: "POST" });
      alert("Saved to favorites"); // Alert the user that the service has been saved.
    } catch (e: any) {
      alert(`Failed: ${e.message}`); // Alert the user if the favorite action fails.
    } finally {
      setLoading(false); // Reset loading status after the API request is complete.
    }
  };

  return (
    // Render a button that triggers the save function when clicked.
    <button onClick={save} disabled={loading} className="btn btn-outline">
      {loading ? "SAVING..." : "FAVORITE"} {/* Display dynamic text based on loading status. */}
    </button>
  );
}
