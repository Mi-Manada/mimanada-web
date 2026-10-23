"use client";

import { use } from "react";
import { FoundationMembersScreen } from "@/components/foundations/FoundationMembersScreen";

export default function FundacionMiembrosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FoundationMembersScreen foundationId={id} />;
}
