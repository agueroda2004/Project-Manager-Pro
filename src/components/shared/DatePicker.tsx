import { useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface DatePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  min?: string | null;
  max?: string | null;
}

function toInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function fromInputValue(v: string): string | null {
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return d.toISOString();
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Seleccionar fecha",
  error,
  disabled,
  className,
  min,
  max,
}: DatePickerProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [internal, setInternal] = useState<string>(() => toInputValue(value));

  const minStr = toInputValue(min ?? null) || undefined;
  const maxStr = toInputValue(max ?? null) || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type="date"
          value={internal}
          disabled={disabled}
          min={minStr}
          max={maxStr}
          onChange={(e) => {
            const v = e.target.value;
            setInternal(v);
            onChange(fromInputValue(v));
          }}
          onClick={() => ref.current?.showPicker?.()}
          className={cn(
            "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]",
            "transition-all duration-150 outline-none cursor-pointer",
            "hover:border-[var(--border-strong)]",
            "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "[color-scheme:light] dark:[color-scheme:dark]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            !internal && "text-[var(--text-muted)]",
          )}
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {!error && !internal && <span className="text-xs text-[var(--text-muted)]">{placeholder}</span>}
    </div>
  );
}
