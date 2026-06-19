import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, fullWidth = true, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `txt_${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        {...rest}
        className={cn(
          "min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)] resize-y",
          "transition-all duration-150 outline-none",
          "hover:border-[var(--border-strong)]",
          "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
          className,
        )}
      />
      {(error || hint) && (
        <span className={cn("text-xs", error ? "text-red-500" : "text-[var(--text-muted)]")}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
