import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTicketNumber(num: number): string {
  return `T-${String(num).padStart(4, "0")}`;
}
