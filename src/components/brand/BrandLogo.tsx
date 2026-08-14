type BrandLogoProps = {
  /** vertical = white stack for pink panel; horizontal = coral lockup for light bg */
  layout?: "horizontal" | "vertical";
  className?: string;
};

const SRC = {
  vertical: "/brand/logo-mimanada-vertical.png",
  horizontal: "/brand/logo-mimanda-horizontal-diapo.png",
} as const;

export function BrandLogo({
  layout = "horizontal",
  className = "",
}: BrandLogoProps) {
  const isVertical = layout === "vertical";

  return (
    <img
      src={SRC[layout]}
      alt="Mi Manada"
      className={
        isVertical
          ? `h-auto w-[13.75rem] object-contain ${className}`
          : `h-[3.125rem] w-auto object-contain sm:h-[3.4375rem] ${className}`
      }
    />
  );
}
