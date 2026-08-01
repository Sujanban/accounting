import NepaliDate, { dateConfigMap } from "nepali-date-converter";

export const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Asar",
  "Shrawan",
  "Bhadra",
  "Aswin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

export const BS_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MIN_BS_YEAR = 2000;
export const MAX_BS_YEAR = 2090;

export type BsDate = { year: number; month: number; day: number };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatAdDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatBsDate(date: BsDate) {
  return `${date.year}-${pad(date.month + 1)}-${pad(date.day)}`;
}

export function parseBsDate(value: string): BsDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  if (date.year < MIN_BS_YEAR || date.year > MAX_BS_YEAR || date.month < 0 || date.month > 11) return null;
  return date.day >= 1 && date.day <= daysInBsMonth(date.year, date.month) ? date : null;
}

export function todayBsDate() {
  const converted = adToBsDate(formatAdDate(new Date()));
  return converted ? formatBsDate(converted) : "";
}

export function adToBsDate(value: string): BsDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const adDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (formatAdDate(adDate) !== value) return null;

  try {
    const date = new NepaliDate(adDate);
    return { year: date.getYear(), month: date.getMonth(), day: date.getDate() };
  } catch {
    return null;
  }
}

export function bsToAdDate(date: BsDate) {
  try {
    const converted = new NepaliDate(date.year, date.month, date.day);
    if (converted.getYear() !== date.year || converted.getMonth() !== date.month || converted.getDate() !== date.day) return null;
    const adDate = converted.getAD();
    return `${adDate.year}-${pad(adDate.month + 1)}-${pad(adDate.date)}`;
  } catch {
    return null;
  }
}

export function daysInBsMonth(year: number, month: number) {
  const config = dateConfigMap[String(year)];
  return config?.[BS_MONTHS[month]] ?? 0;
}

export function firstWeekdayOfBsMonth(year: number, month: number) {
  try {
    return new NepaliDate(year, month, 1).getDay();
  } catch {
    return 0;
  }
}

export function isAdDateInRange(value: string, min?: string, max?: string) {
  return (!min || value >= min) && (!max || value <= max);
}

export function isBsDateInRange(value: string, min?: string, max?: string) {
  return (!min || value >= min) && (!max || value <= max);
}
