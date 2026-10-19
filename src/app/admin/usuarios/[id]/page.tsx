"use client";

import { use } from "react";
import { AdminUserDetailScreen } from "@/components/admin/AdminUserDetailScreen";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AdminUserDetailScreen userId={id} />;
}
