import { useEffect } from "react";

type Handler = (e: MouseEvent | TouchEvent) => void;

export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: Handler,
  active = true,
): void {
  useEffect(() => {
    if (!active) return;
    const listener = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && el.contains(target)) return;
      handler(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, active]);
}
