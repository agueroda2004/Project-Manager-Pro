import { format, formatDistanceToNow, parseISO, isAfter, isBefore, differenceInDays, differenceInCalendarDays } from "date-fns";
import type { ISODate } from "../types";

export const nowISO = (): ISODate => new Date().toISOString();

export const toISO = (d: Date | string | null): ISODate => {
  if (!d) return new Date().toISOString();
  if (typeof d === "string") return d;
  return d.toISOString();
};

export const fromISO = (iso: ISODate | null): Date | null => {
  if (!iso) return null;
  try {
    return parseISO(iso);
  } catch {
    return null;
  }
};

export const formatDate = (iso: ISODate | null, pattern = "dd MMM yyyy"): string => {
  if (!iso) return "—";
  const d = fromISO(iso);
  if (!d) return "—";
  return format(d, pattern);
};

export const formatShort = (iso: ISODate | null): string => formatDate(iso, "dd MMM");

export const formatRelative = (iso: ISODate | null): string => {
  if (!iso) return "—";
  const d = fromISO(iso);
  if (!d) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isOverdue = (iso: ISODate | null, status: string): boolean => {
  if (!iso || status === "terminado" || status === "finalizado") return false;
  return isBefore(fromISO(iso) as Date, new Date());
};

export const daysUntil = (iso: ISODate | null): number | null => {
  if (!iso) return null;
  return differenceInCalendarDays(fromISO(iso) as Date, new Date());
};

export const isUpcoming = (iso: ISODate | null, days = 7): boolean => {
  if (!iso) return false;
  const d = fromISO(iso) as Date;
  return isAfter(d, new Date()) && differenceInDays(d, new Date()) <= days;
};
