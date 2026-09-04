import { MyLitterDetailScreen } from "@/components/pets/MyLitterDetailScreen";

export default async function MisCamadaDetallePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <MyLitterDetailScreen groupId={groupId} />;
}
