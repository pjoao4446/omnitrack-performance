import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  indicatorClassName?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 200,
  strokeWidth = 14,
  trackClassName = "stroke-border",
  indicatorClassName = "stroke-primary",
  children,
  className,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const dash = c * v;

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          fill="none"
          className={trackClassName}
          opacity={0.35}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn(indicatorClassName, "transition-[stroke-dasharray] duration-700 ease-out")}
          style={{
            strokeDasharray: `${dash} ${c}`,
            filter: "drop-shadow(0 0 8px color-mix(in oklab, currentColor 60%, transparent))",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
