import { notFound } from "next/navigation";
import { API_BASE } from "../../../lib/api";
import { ServiceDetailClient, type Service } from "./ServiceDetailClient";

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${API_BASE}/services/${params.id}`, { cache: "no-store" });
  if (!res.ok) return notFound();

  const service = (await res.json()) as Service;
  return <ServiceDetailClient service={service} />;
}
