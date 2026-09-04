import { CreatePetScreen } from "@/components/pets/CreatePetScreen";
import { notFound } from "next/navigation";
import { parseEntityId } from "@/lib/seo-urls";

export default async function EditPetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const id = parseEntityId(slug);
  if (!id) notFound();

  const backHref =
    from && from.startsWith("/") && !from.startsWith("//") ? from : undefined;

  return <CreatePetScreen editPetId={id} backHref={backHref} />;
}
