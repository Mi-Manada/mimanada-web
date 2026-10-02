"use client";

import { use } from "react";
import { AdminPetModerationDetail } from "@/components/admin/AdminPetModerationDetail";

export default function AdminPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AdminPetModerationDetail petId={id} />;
}
