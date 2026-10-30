import React from "react";
import clsx from "clsx";

export interface AvatarProps {
  name?: string;
  src?: string | null;
  image?: string | null;
  initials?: string;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "primary" | "muted";
  className?: string;
}

function getInitials(name?: string, fallbackInitials?: string): string {
  if (fallbackInitials) return fallbackInitials.slice(0, 2).toUpperCase();
  if (!name) return "?";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeMap = {
  sm: "w-8 h-8 text-[12px]",
  md: "w-10 h-10 text-[14px]",
  lg: "w-14 h-14 text-[18px]",
};

const toneMap = {
  ink: "bg-ink text-white",
  primary: "bg-primary text-white",
  muted: "bg-border text-ink",
};

export function Avatar({
  name,
  src,
  image,
  initials,
  size = "md",
  tone = "ink",
  className,
}: AvatarProps) {
  const imgUrl = src ?? image;
  const text = getInitials(name, initials);

  if (imgUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgUrl}
        alt={name ?? "Avatar"}
        className={clsx(
          "rounded-full object-cover shrink-0",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={clsx(
        "rounded-full inline-flex items-center justify-center font-bold shrink-0 select-none",
        sizeMap[size],
        toneMap[tone],
        className
      )}
    >
      {text}
    </div>
  );
}

export default Avatar;
