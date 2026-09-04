import { notFound } from "next/navigation";
import { PublicUserProfileScreen } from "@/components/profile/PublicUserProfileScreen";
import { parseEntityId } from "@/lib/seo-urls";

export default async function PublicUserPage({
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
    from && from.startsWith("/") && !from.startsWith("//") ? from : "/adopta";

  return (
    <PublicUserProfileScreen userId={id} urlSlug={slug} backHref={backHref} />
  );
}
