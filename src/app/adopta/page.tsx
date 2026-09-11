import { Suspense } from "react";
import AdoptaPageClient from "./AdoptaPageClient";

export default function AdoptaPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
        </main>
      }
    >
      <AdoptaPageClient />
    </Suspense>
  );
}
