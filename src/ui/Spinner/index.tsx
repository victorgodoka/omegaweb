export type SpinnerProps = {
  color?: "purple" | "gray" | "white";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  "aria-label"?: string;
};

const sizeClass: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-12 w-12 border-4",
};

const colorClass: Record<NonNullable<SpinnerProps["color"]>, string> = {
  purple: "border-purple-500 border-t-transparent",
  gray: "border-zinc-500 border-t-transparent",
  white: "border-white border-t-transparent",
};

export function Spinner({
  color = "purple",
  size = "md",
  className = "",
  "aria-label": ariaLabel,
}: SpinnerProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={[
        "inline-block animate-spin rounded-full",
        sizeClass[size],
        colorClass[color],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export default Spinner;
