import { clsx, type ClassValue } from "clsx";
import { format, isWithinInterval, parse } from "date-fns";
import { twMerge } from "tailwind-merge";

import { ATTENDANCE_WINDOW } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy") {
  return format(new Date(date), pattern);
}

export function formatBirthDatePassword(date: string) {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return date;
  }

  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function isAttendanceWindowOpen(now = new Date()) {
  const date = format(now, "yyyy-MM-dd");
  const start = parse(`${date} ${ATTENDANCE_WINDOW.start}`, "yyyy-MM-dd HH:mm", now);
  const end = parse(`${date} ${ATTENDANCE_WINDOW.end}`, "yyyy-MM-dd HH:mm", now);

  return isWithinInterval(now, { start, end });
}

export function percent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
