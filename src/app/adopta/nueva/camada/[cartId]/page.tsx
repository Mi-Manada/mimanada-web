import { LitterCartScreen } from "@/components/pets/LitterCartScreen";

export default async function CamadaCartPage({
  params,
}: {
  params: Promise<{ cartId: string }>;
}) {
  const { cartId } = await params;
  return <LitterCartScreen cartId={cartId} />;
}
