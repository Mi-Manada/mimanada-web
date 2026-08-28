import type { CSSProperties } from "react";

/** Usa PNGs del brief (rosa sobre negro) como máscara con currentColor. */
export function MaskIcon({
  src,
  size = 20,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    // PNGs del brief: trazo rosa sobre negro
    WebkitMaskMode: "luminance",
    maskMode: "luminance",
  } as CSSProperties;

  return (
    <span aria-hidden className={`inline-block shrink-0 ${className}`} style={style} />
  );
}

export function DogIcon({ size = 20 }: { size?: number }) {
  return <MaskIcon src="/brand/icons/dog.png" size={size} />;
}

export function CatIcon({ size = 20 }: { size?: number }) {
  return <MaskIcon src="/brand/icons/cat.png" size={size} />;
}

export function CamadaIcon({ size = 28 }: { size?: number }) {
  return <MaskIcon src="/brand/icons/camada.png" size={size} />;
}

export function MascotaIcon({ size = 28 }: { size?: number }) {
  return <MaskIcon src="/brand/icons/mascota.png" size={size} />;
}

export function FemaleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="12" cy="9" r="5.2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 14.2v6.3M9.2 17.8h5.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MaleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="10.2" cy="13.8" r="5.2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14.2 9.8 19.5 4.5M15.2 4.5h4.3V8.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UnknownSexIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.2 9.4a2.8 2.8 0 1 1 4.6 2.2c-.8.7-1.6 1.2-1.6 2.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.2" r="1.1" fill="currentColor" />
    </svg>
  );
}
