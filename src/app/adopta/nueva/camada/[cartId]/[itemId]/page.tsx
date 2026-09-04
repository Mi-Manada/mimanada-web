import { CreatePetScreen } from "@/components/pets/CreatePetScreen";

export default async function EditarEnCamadaPage({
  params,
}: {
  params: Promise<{ cartId: string; itemId: string }>;
}) {
  const { cartId, itemId } = await params;
  return (
    <CreatePetScreen
      mode="litter"
      litterCartId={cartId}
      litterItemId={itemId}
    />
  );
}
