/** PRISMA wordmark + mark (white artwork; use `onLight` for dark rendering on light backgrounds). */
export const BRAND_MARK_SRC = "/images/brand/group-42.svg";

export function BrandMark({
  variant = "onDark",
  className = "",
}: {
  variant?: "onDark" | "onLight";
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_MARK_SRC}
      alt="PRISMA"
      width={80}
      height={64}
      className={`h-auto max-h-12 w-auto max-w-[200px] object-contain object-left ${variant === "onLight" ? "brightness-0" : ""} ${className}`.trim()}
    />
  );
}
