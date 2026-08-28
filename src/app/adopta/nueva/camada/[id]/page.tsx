import { CreatePetScreen } from "@/components/pets/CreatePetScreen";

export default async function EditarEnCamadaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreatePetScreen mode="litter" litterItemId={id} />;
}
