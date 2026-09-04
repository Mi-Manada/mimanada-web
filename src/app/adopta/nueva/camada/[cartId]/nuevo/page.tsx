import { CreatePetScreen } from "@/components/pets/CreatePetScreen";

export default async function NuevaEnCamadaPage({
  params,
}: {
  params: Promise<{ cartId: string }>;
}) {
  const { cartId } = await params;
  return (
    <CreatePetScreen
      mode="litter"
      litterCartId={cartId}
      litterItemId="nuevo"
    />
  );
}
