"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function PawTextureBand({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 h-[24vh] min-h-[8rem] max-h-[13rem] mix-blend-screen opacity-40 ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
      style={{
        backgroundImage: "url(/brand/paw-texture.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "520px auto",
        backgroundPosition: position === "top" ? "center top" : "center bottom",
        WebkitMaskImage:
          position === "top"
            ? "linear-gradient(to bottom, black 35%, transparent)"
            : "linear-gradient(to top, black 35%, transparent)",
        maskImage:
          position === "top"
            ? "linear-gradient(to bottom, black 35%, transparent)"
            : "linear-gradient(to top, black 35%, transparent)",
      }}
      aria-hidden
    />
  );
}

export function ConfirmEmailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("amigo");

  useEffect(() => {
    const fromQuery = searchParams.get("nombre");
    const fromSession =
      typeof window !== "undefined"
        ? sessionStorage.getItem("mimanada.registerName")
        : null;
    setName(fromQuery || fromSession || "amigo");
  }, [searchParams]);

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-[var(--color-primary)] px-6 py-16">
      <PawTextureBand position="top" />
      <PawTextureBand position="bottom" />

      <div className="relative z-10 flex w-full max-w-[24rem] flex-col items-center text-center lg:max-w-[28rem]">
        <h1 className="text-[clamp(2.6rem,7vw,3.75rem)] leading-none tracking-tight text-[var(--color-text-on-primary)] [font-weight:800]">
          ¡HOLA!
        </h1>

        <p className="mt-5 max-w-[20rem] text-[clamp(1rem,2.2vw,1.2rem)] leading-snug text-[var(--color-text-on-primary)] lg:max-w-[24rem]">
          <span className="text-[var(--color-accent-yellow)] [font-weight:700]">
            {name}
          </span>
          , estas a un solo paso de ser miembro de{" "}
          <span className="[font-weight:700]">La Manada</span>
        </p>

        <Button
          type="button"
          variant="onPrimary"
          className="mt-10 min-w-[13rem] lg:min-w-[14rem]"
          onClick={() => router.push("/login")}
        >
          Confirmar registro
        </Button>
      </div>
    </main>
  );
}
