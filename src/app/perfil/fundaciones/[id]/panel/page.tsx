"use client";

import { use } from "react";
import { FoundationPanelScreen } from "@/components/foundations/FoundationPanelScreen";

export default function FundacionPanelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FoundationPanelScreen foundationId={id} />;
}
