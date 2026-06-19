import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { useClickOutside } from "../../hooks/useClickOutside";


export interface DropdownOption<V extends string = string> {
  value: V;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  disabled?: boolean;
}

interface CustomDropdownProps<V extends string = string> {
  options: DropdownOption<V>[];
  value: V | V[] | null;
  onChange: (v: V | V[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: boolean;
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  emptyMessage?: string;
  maxHeight?: number;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  clearable?: boolean;
  fullWidth?: boolean;
}

const SIZE_TRIGGER: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 text-xs px-2.5",
  md: "h-10 text-sm px-3",
  lg: "h-11 text-sm px-3.5",
};

export function CustomDropdown<V extends string = string>(props: CustomDropdownProps<V>) {
  const {
    options,
    value,
    onChange,
    placeholder = "Selecciona…",
    multiple = false,
    searchable = false,
    disabled = false,
    error = false,
    size = "md",
    leftIcon,
    emptyMessage = "Sin resultados",
    maxHeight = 260,
    className,
    triggerClassName,
    panelClassName,
    clearable = false,
    fullWidth = true,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  useClickOutside<HTMLDivElement>(panelRef, () => setOpen(false), open);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query, searchable]);

  const selectedValues = useMemo<V[]>(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value as V[];
    if (multiple) return [value];
    return [value];
  }, [value, multiple]);

  const isSelected = (v: V): boolean => selectedValues.includes(v);

  const display = useMemo<DropdownOption<V> | DropdownOption<V>[] | null>(() => {
    if (selectedValues.length === 0) return null;
    if (multiple) {
      return selectedValues
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is DropdownOption<V> => Boolean(o));
    }
    return options.find((o) => o.value === selectedValues[0]) ?? null;
  }, [selectedValues, options, multiple]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 10);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const setOpenExternal = (next: boolean) => {
    if (next) {
      setQuery("");
      setActiveIdx(0);
    }
    setOpen(next);
  };

  const safeActiveIdx = activeIdx >= filtered.length ? Math.max(0, filtered.length - 1) : activeIdx;

  const handleSelect = (v: V) => {
    if (multiple) {
      const next = isSelected(v) ? selectedValues.filter((x) => x !== v) : [...selectedValues, v];
      onChange(next);
    } else {
      onChange(v);
      close();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : ("" as V));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        setOpenExternal(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(filtered.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = filtered[safeActiveIdx];
      if (opt && !opt.disabled) handleSelect(opt.value);
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div
      className={cn("relative", fullWidth ? "w-full" : "inline-block", className)}
      onKeyDown={onKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && filtered[safeActiveIdx] ? `${listboxId}-${filtered[safeActiveIdx].value}` : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpenExternal(!open)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border bg-[var(--bg-surface)] text-[var(--text-primary)]",
          "transition-all duration-150 outline-none",
          "border-[var(--border)] hover:border-[var(--border-strong)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-app)]",
          SIZE_TRIGGER[size],
          error && "border-red-500 focus-visible:ring-red-500",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName,
        )}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {leftIcon && <span className="shrink-0 text-[var(--text-muted)]">{leftIcon}</span>}
          {multiple ? (
            selectedValues.length === 0 ? (
              <span className="text-[var(--text-muted)] truncate">{placeholder}</span>
            ) : (
              <span className="flex flex-wrap items-center gap-1 min-w-0">
                {selectedValues.slice(0, 2).map((v) => {
                  const opt = options.find((o) => o.value === v);
                  if (!opt) return null;
                  return (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] px-1.5 py-0.5 text-xs"
                    >
                      {opt.color && (
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: opt.color }} />
                      )}
                      {opt.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(v);
                        }}
                        className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        aria-label={`Quitar ${opt.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedValues.length > 2 && (
                  <span className="text-xs text-[var(--text-muted)]">+{selectedValues.length - 2}</span>
                )}
              </span>
            )
          ) : display && !Array.isArray(display) ? (
            <span className="flex items-center gap-2 min-w-0">
              {display.color && (
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: display.color }} />
              )}
              {display.icon && <span className="shrink-0">{display.icon}</span>}
              <span className="truncate">{display.label}</span>
            </span>
          ) : (
            <span className="text-[var(--text-muted)] truncate">{placeholder}</span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && selectedValues.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              aria-label="Limpiar selección"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[var(--text-muted)] transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-[var(--border)]",
            "bg-[var(--bg-surface)] shadow-xl",
            "animate-dropdown-in",
            panelClassName,
          )}
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
              <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const opt = filtered[safeActiveIdx];
                    if (opt && !opt.disabled) handleSelect(opt.value);
                  }
                }}
                placeholder="Buscar…"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          )}
          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            className="overflow-y-auto py-1"
            style={{ maxHeight }}
          >
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-[var(--text-muted)] text-center">{emptyMessage}</li>
            )}
            {filtered.map((opt, i) => {
              const selected = isSelected(opt.value);
              const active = i === safeActiveIdx;
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-${opt.value}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={opt.disabled}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={cn(
                    "mx-1 my-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                    "text-[var(--text-primary)]",
                    active && "bg-[var(--bg-elevated)]",
                    opt.disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {opt.color && (
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: opt.color }} />
                  )}
                  {opt.icon && <span className="shrink-0 text-[var(--text-muted)]">{opt.icon}</span>}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block truncate text-xs text-[var(--text-muted)]">{opt.description}</span>
                    )}
                  </span>
                  {multiple && selected && <Check className="h-4 w-4 text-[var(--accent)]" />}
                  {!multiple && selected && <Check className="h-4 w-4 text-[var(--accent)]" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
