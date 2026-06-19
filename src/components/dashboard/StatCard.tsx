import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type Tone = "indigo" | "blue" | "zinc" | "red" | "emerald" | "amber" | "purple" | "pink";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  trend?: { value: number; positive?: boolean };
  className?: string;
}

const TONE_BG: Record<Tone, string> = {
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  zinc: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

export function StatCard({ icon, label, value, hint, tone = "indigo", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", TONE_BG[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</div>}
    </div>
  );
}
