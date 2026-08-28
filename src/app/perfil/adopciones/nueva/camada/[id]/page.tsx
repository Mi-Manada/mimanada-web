import { redirect } from "next/navigation";

export default async function LegacyCamadaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/adopta/nueva/camada/${id}`);
}
