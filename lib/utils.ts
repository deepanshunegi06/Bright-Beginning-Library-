import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  IST_OFFSET_MS,
  ONE_DAY_MS,
  DATE_FORMAT_OPTIONS,
  DATETIME_FORMAT_OPTIONS,
  DEFAULT_LOCALE,
  PHONE_REGEX,
} from "./constants";

/**
 * Merges Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Date and Time Utilities
 */

/**
 * Gets the current date and time in IST
 */
export function getISTNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
}

/**
 * Converts a UTC date to IST
 */
export function toIST(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Gets the start of today in IST (00:00:00)
 */
export function getISTToday(): Date {
  const istNow = getISTNow();
  return new Date(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate()
  );
}

/**
 * Gets the start of tomorrow in IST (00:00:00)
 */
export function getISTTomorrow(): Date {
  const today = getISTToday();
  return new Date(today.getTime() + ONE_DAY_MS);
}

/**
 * Formats a time string in 12-hour format with AM/PM (IST)
 */
export function formatTimeIST(date: Date): string {
  const istDate = toIST(date);
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const seconds = istDate.getUTCSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")} ${ampm}`;
}

/**
 * Formats a date in DD MMM YYYY format (e.g., "11 Feb 2026")
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = DATE_FORMAT_OPTIONS
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(DEFAULT_LOCALE, options);
}

/**
 * Formats a date with time in DD MMM YYYY HH:MM format
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, DATETIME_FORMAT_OPTIONS);
}

/**
 * Gets today's date in YYYY-MM-DD format (for date inputs)
 */
export function getTodayInputValue(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Gets yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayInputValue(): string {
  return new Date(Date.now() - ONE_DAY_MS).toISOString().split("T")[0];
}

/**
 * Checks if a date is within the next N days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const futureDate = new Date(Date.now() + days * ONE_DAY_MS);
  return targetDate <= futureDate;
}

/**
 * Checks if a date has passed
 */
export function isPast(date: Date | string): boolean {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  return targetDate < new Date();
}

/**
 * Validation Utilities
 */

/**
 * Validates a phone number (must be 10 digits)
 */
export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validates if a string is not empty
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validates if a file is an allowed image type
 */
export function validateImageType(file: File): boolean {
  return file.type.match(/^image\/(jpeg|png|webp)$/) !== null;
}

/**
 * Validates if a file size is within the limit
 */
export function validateImageSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * String Utilities
 */

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
}

/**
 * Sanitizes a phone number (removes non-digits)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
