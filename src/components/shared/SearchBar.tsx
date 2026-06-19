import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function SearchBar({ value, onChange, placeholder = "Buscar…", className, autoFocus, onKeyDown }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-9 rounded-lg border bg-[var(--bg-surface)] px-3 transition-all duration-150",
        focused ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30" : "border-[var(--border)]",
        className,
      )}
    >
      <Search className="h-4 w-4 text-[var(--text-muted)]" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

