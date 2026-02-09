// This module defines the server-side component for displaying a single service detail page.
import { notFound } from "next/navigation";
import { API_BASE } from "../../../lib/api";
import { ServiceDetailClient, type Service } from "./ServiceDetailClient";

// Asynchronous server component for the Service Detail page.
export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  // Fetch service data from the API based on the provided ID.
  const res = await fetch(`${API_BASE}/services/${params.id}`, { cache: "no-store" });
  if (!res.ok) return notFound(); // If service not found, return a 404.

  const service = (await res.json()) as Service; // Parse the service data.
  // Render the client-side ServiceDetailClient component with the fetched service data.
  return <ServiceDetailClient service={service} />;
}
