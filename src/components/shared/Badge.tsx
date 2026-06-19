import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type Tone =
  | "neutral"
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "indigo"
  | "purple"
  | "pink"
  | "zinc";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  variant?: "soft" | "solid" | "outline";
  className?: string;
  size?: "xs" | "sm";
  leftIcon?: ReactNode;
}

const TONES: Record<Tone, { soft: string; solid: string; outline: string }> = {
  neutral: { soft: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]", solid: "bg-zinc-700 text-white", outline: "border-zinc-500 text-zinc-700 dark:text-zinc-300" },
  gray: { soft: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300", solid: "bg-zinc-500 text-white", outline: "border-zinc-500 text-zinc-700 dark:text-zinc-300" },
  blue: { soft: "bg-blue-500/15 text-blue-700 dark:text-blue-300", solid: "bg-blue-500 text-white", outline: "border-blue-500 text-blue-600 dark:text-blue-400" },
  green: { soft: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", solid: "bg-emerald-500 text-white", outline: "border-emerald-500 text-emerald-600 dark:text-emerald-400" },
  amber: { soft: "bg-amber-500/15 text-amber-700 dark:text-amber-300", solid: "bg-amber-500 text-white", outline: "border-amber-500 text-amber-600 dark:text-amber-400" },
  red: { soft: "bg-red-500/15 text-red-700 dark:text-red-300", solid: "bg-red-500 text-white", outline: "border-red-500 text-red-600 dark:text-red-400" },
  indigo: { soft: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300", solid: "bg-indigo-500 text-white", outline: "border-indigo-500 text-indigo-600 dark:text-indigo-400" },
  purple: { soft: "bg-purple-500/15 text-purple-700 dark:text-purple-300", solid: "bg-purple-500 text-white", outline: "border-purple-500 text-purple-600 dark:text-purple-400" },
  pink: { soft: "bg-pink-500/15 text-pink-700 dark:text-pink-300", solid: "bg-pink-500 text-white", outline: "border-pink-500 text-pink-600 dark:text-pink-400" },
  zinc: { soft: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300", solid: "bg-zinc-500 text-white", outline: "border-zinc-500 text-zinc-700 dark:text-zinc-300" },
};

export function Badge({ children, tone = "neutral", variant = "soft", size = "sm", leftIcon, className }: BadgeProps) {
  const toneMap = TONES[tone];
  const variantClass = toneMap[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        variantClass,
        className,
      )}
    >
      {leftIcon}
      {children}
    </span>
  );
}
