import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "default" | "strong" | "subtle";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass-subtle",
};

export function GlassCard({ variant = "default", className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        variantClass[variant],
        "rounded-2xl shadow-[0_20px_60px_-30px_oklch(0_0_0/0.7)]",
        className,
      )}
      {...props}
    />
  );
}
