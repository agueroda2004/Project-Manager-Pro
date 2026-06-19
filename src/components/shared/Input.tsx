import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, fullWidth = true, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `inp_${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={cn(
            "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "transition-all duration-150 outline-none",
            "hover:border-[var(--border-strong)]",
            "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            className,
          )}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)]">
            {rightIcon}
          </span>
        )}
      </div>
      {(error || hint) && (
        <span className={cn("text-xs", error ? "text-red-500" : "text-[var(--text-muted)]")}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
