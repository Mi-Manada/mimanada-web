"use client";

import { use } from "react";
import { FoundationFormScreen } from "@/components/foundations/FoundationFormScreen";

export default function EditarFundacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FoundationFormScreen mode="edit" foundationId={id} />;
}
