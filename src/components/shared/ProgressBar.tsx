import { cn } from "../../utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function ProgressBar({ value, max = 100, showLabel, size = "md", color, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]", heights[size])}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: color ?? "var(--accent)" }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-[var(--text-muted)]">{Math.round(pct)}%</div>
      )}
    </div>
  );
}
