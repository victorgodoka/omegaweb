import type { ImgHTMLAttributes, ReactNode } from "react";

export type AvatarProps = {
  img: (props: ImgHTMLAttributes<HTMLImageElement>) => ReactNode;
  size?: "sm" | "md" | "lg";
  bordered?: boolean;
  rounded?: boolean;
  stacked?: boolean;
  /** Flowbite-style status ring color name; empty disables extra ring. */
  color?: string;
  className?: string;
  alt?: string;
  onClick?: () => void;
  /** Stable selector for tests / analytics (renders as `data-user-id`). */
  userId?: string;
};

const sizeClass: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

const colorRing: Record<string, string> = {
  gray: "ring-gray-500",
  light: "ring-gray-300",
  failure: "ring-red-500",
  success: "ring-green-500",
  warning: "ring-yellow-400",
  purple: "ring-purple-500",
  info: "ring-cyan-500",
  pink: "ring-pink-500",
};

export function Avatar({
  img,
  size = "md",
  bordered = false,
  rounded = false,
  stacked = false,
  color = "",
  className = "",
  alt = "",
  onClick,
  userId,
}: AvatarProps) {
  const roundClass = rounded ? "rounded-full" : "rounded-lg";
  const ringTone = color && colorRing[color] ? colorRing[color] : "";
  const ringClass = ringTone ? `ring-2 ring-offset-2 ring-offset-zinc-900 ${ringTone}` : "";

  return (
    <span
      className={[
        "relative inline-flex shrink-0 overflow-hidden",
        sizeClass[size],
        roundClass,
        bordered ? "border-2 border-zinc-600" : "",
        stacked ? "-ml-3 first:ml-0 ring-2 ring-zinc-900" : "",
        ringClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-user-id={userId}
    >
      {img({
        alt,
        className: ["h-full w-full object-cover", roundClass].join(" "),
      })}
    </span>
  );
}

export default Avatar;
