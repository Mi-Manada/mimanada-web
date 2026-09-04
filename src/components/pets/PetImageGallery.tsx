"use client";

import { useEffect, useState, type ReactNode } from "react";

export function PetImageGallery({
  photos,
  alt,
  topLeft,
  topRight,
}: {
  photos: string[];
  alt: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = photos[index] ?? photos[0] ?? null;
  const hasMany = photos.length > 1;

  useEffect(() => {
    setIndex(0);
  }, [photos]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (!hasMany) return;
      if (event.key === "ArrowRight") {
        setIndex((i) => (i + 1) % photos.length);
      }
      if (event.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + photos.length) % photos.length);
      }
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, hasMany, photos.length]);

  function go(delta: number) {
    if (!hasMany) return;
    setIndex((i) => (i + delta + photos.length) % photos.length);
  }

  return (
    <>
      <section className="relative bg-[#f5f5f5] lg:overflow-hidden lg:rounded-[24px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-2.5 md:p-0">
          {hasMany ? (
            <div className="order-2 flex gap-2 overflow-x-auto px-3 pb-3 md:order-1 md:w-[4.75rem] md:flex-col md:gap-2 md:overflow-y-auto md:overflow-x-visible md:px-0 md:py-0 md:pb-0 md:pl-0">
              {photos.map((src, i) => {
                const active = i === index;
                return (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={active}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => setIndex(i)}
                    className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[10px] border-2 bg-white transition md:h-[5rem] md:w-full ${
                      active
                        ? "border-[var(--color-primary)]"
                        : "border-transparent hover:border-[#d0d0d0]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="relative order-1 min-w-0 flex-1 md:order-2">
            <div className="relative aspect-[4/3] min-h-[18rem] w-full overflow-hidden bg-[#f5f5f5] sm:min-h-[22rem] md:aspect-auto md:min-h-[28rem] lg:min-h-[32rem]">
              {current ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="group relative h-full w-full cursor-zoom-in"
                  aria-label="Ver foto en grande"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current}
                    alt={alt}
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[0.7rem] text-white opacity-0 transition group-hover:opacity-100">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="m16.2 16.2 3.3 3.3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M11 8.5v5M8.5 11h5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Ampliar
                  </span>
                </button>
              ) : (
                <div className="flex h-full min-h-[18rem] items-center justify-center text-[0.9rem] text-[var(--color-text-muted)]">
                  Sin foto
                </div>
              )}

              {topLeft ? (
                <div className="absolute top-3 left-3 z-10 md:top-4 md:left-4">{topLeft}</div>
              ) : null}
              {topRight ? (
                <div className="absolute top-3 right-3 z-10 md:top-4 md:right-4">{topRight}</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {lightboxOpen && current ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-black/92"
          role="dialog"
          aria-modal
          aria-label="Galería ampliada"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-[0.85rem] text-white/80">
              {photos.length > 0 ? `${index + 1} / ${photos.length}` : ""}
            </p>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Cerrar"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
            {hasMany ? (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Foto anterior"
                className="absolute left-3 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 5 8 12l7 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={alt}
              className="max-h-full max-w-full object-contain"
            />

            {hasMany ? (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Foto siguiente"
                className="absolute right-3 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="m9 5 7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          {hasMany ? (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5">
              {photos.map((src, i) => {
                const active = i === index;
                return (
                  <button
                    key={`lb-${src}-${i}`}
                    type="button"
                    aria-label={`Ir a foto ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-[8px] border-2 ${
                      active
                        ? "border-[var(--color-primary)]"
                        : "border-white/25 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
