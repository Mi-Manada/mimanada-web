"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { Button } from "@/components/ui/Button";
import {
  createLitterCart,
  deleteLitterCart,
  listLitterCarts,
  litterCartDisplayTitle,
  type LitterCart,
} from "@/lib/litter-draft";

export function LitterListScreen() {
  const router = useRouter();
  const [carts, setCarts] = useState<LitterCart[]>([]);

  function refresh() {
    setCarts(listLitterCarts());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleCreate() {
    const cart = createLitterCart();
    router.push(`/adopta/nueva/camada/${cart.id}`);
  }

  function handleDelete(cartId: string) {
    const cart = carts.find((c) => c.id === cartId);
    const ok = window.confirm(
      `¿Eliminar ${cart ? litterCartDisplayTitle(cart) : "esta camada"} del borrador?`,
    );
    if (!ok) return;
    deleteLitterCart(cartId);
    refresh();
  }

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-5 pb-5 pt-5 text-[var(--color-text-on-primary)] sm:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage: "url(/brand/paw-texture.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "420px auto",
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex w-full max-w-[80rem] items-center gap-2">
            <Link
              href="/adopta/nueva"
              aria-label="Volver"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 5 8 12l7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-[1.05rem] [font-weight:700]">Camadas</h1>
              <p className="text-[0.75rem] text-white/85">
                Puedes preparar varias camadas a la vez
              </p>
            </div>
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          {carts.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#ddd] bg-white px-4 py-10 text-center">
              <p className="text-[0.95rem] text-[#555] [font-weight:700]">
                No tienes camadas en borrador
              </p>
              <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
                Crea una camada y agrega mascotas nuevas o ya publicadas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carts.map((cart) => {
                const count = cart.items.length + cart.linkedPets.length;
                return (
                  <article
                    key={cart.id}
                    className="rounded-[14px] border border-[#ececec] bg-white p-4"
                  >
                    <h2 className="text-[1rem] text-[#555] [font-weight:700]">
                      {litterCartDisplayTitle(cart)}
                    </h2>
                    <p className="mt-1 text-[0.8rem] text-[var(--color-text-muted)]">
                      {count === 0
                        ? "Vacía"
                        : `${count} mascota${count === 1 ? "" : "s"}`}
                      {cart.linkedPets.length > 0
                        ? ` · ${cart.linkedPets.length} ya publicadas`
                        : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/adopta/nueva/camada/${cart.id}`}
                        className="rounded-full bg-[var(--color-primary)] px-3.5 py-1.5 text-[0.75rem] text-white [font-weight:700]"
                      >
                        Abrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(cart.id)}
                        className="cursor-pointer rounded-full border border-[#e4e4e4] px-3.5 py-1.5 text-[0.75rem] text-[#777] [font-weight:600]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-auto border-t border-[#f0f0f0] pt-4">
            <Button
              type="button"
              className="h-11 w-full text-[0.9rem]"
              onClick={handleCreate}
            >
              + Nueva camada
            </Button>
          </div>
        </section>
      </main>
    </AppChrome>
  );
}
