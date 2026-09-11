import { CreatePetScreen } from "@/components/pets/CreatePetScreen";

export default async function NuevaMascotaEnCamadaPublicadaPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <CreatePetScreen
      mode="isolated"
      publishedLitterGroupId={groupId}
      backHref={`/adopta/camadas/${groupId}`}
    />
  );
}
