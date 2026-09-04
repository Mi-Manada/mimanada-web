import { notFound } from "next/navigation";
import { PetDetailScreen } from "@/components/pets/PetDetailScreen";
import { parseEntityId } from "@/lib/seo-urls";

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = parseEntityId(slug);
  if (!id) notFound();
  return <PetDetailScreen petId={id} urlSlug={slug} />;
}
