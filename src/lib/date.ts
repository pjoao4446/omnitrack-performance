import { format, startOfWeek, addDays, parseISO, isSameDay, differenceInCalendarDays } from "date-fns";
import type { ISODate, Weekday } from "./types";

export const todayISO = (): ISODate => format(new Date(), "yyyy-MM-dd");
export const toISO = (d: Date): ISODate => format(d, "yyyy-MM-dd");
export const fromISO = (s: ISODate) => parseISO(s);

export const weekdayOf = (d: Date | string): Weekday => {
  const date = typeof d === "string" ? parseISO(d) : d;
  return date.getDay() as Weekday;
};

export const weekDates = (anchor = new Date()): Date[] => {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const weekISO = (anchor = new Date()): ISODate[] => weekDates(anchor).map(toISO);

export const weekdayLabel = (w: Weekday) =>
  ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w];

export const weekdayLabelLong = (w: Weekday) =>
  ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][w];

export { format, isSameDay, differenceInCalendarDays, addDays };
