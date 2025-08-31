
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(urlString: string): boolean {
  if (!urlString) return false;
  if (urlString.startsWith('data:')) return true;
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}
