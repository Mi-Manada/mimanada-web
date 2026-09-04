import { notFound } from "next/navigation";
import { PetSiblingsScreen } from "@/components/pets/PetSiblingsScreen";
import { parseEntityId } from "@/lib/seo-urls";

export default async function PetSiblingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = parseEntityId(slug);
  if (!id) notFound();
  return <PetSiblingsScreen petId={id} urlSlug={slug} />;
}
