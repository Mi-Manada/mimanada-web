"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { FoundationPublicScreen } from "@/components/foundations/FoundationPublicScreen";

function FoundationPublicInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const backHref =
    from && from.startsWith("/") && !from.startsWith("//") ? from : "/home";

  return (
    <FoundationPublicScreen
      slug={decodeURIComponent(slug)}
      backHref={backHref}
    />
  );
}

export default function FundacionPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<p className="p-6 text-[#666]">Cargando…</p>}>
      <FoundationPublicInner slug={slug} />
    </Suspense>
  );
}
