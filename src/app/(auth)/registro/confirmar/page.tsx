import { Suspense } from "react";
import { ConfirmEmailScreen } from "@/components/auth/ConfirmEmailScreen";

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full flex-1 items-center justify-center bg-[var(--color-primary)]" />
      }
    >
      <ConfirmEmailScreen />
    </Suspense>
  );
}
