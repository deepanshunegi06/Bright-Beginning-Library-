/**
 * Payment and subscription utilities
 */

import type { User, PaymentStatusInfo, PaymentStatus } from "@/types";
import { DAYS_BEFORE_EXPIRY_WARNING } from "./constants";
import { isPast, isWithinDays } from "./utils";

/**
 * Calculates the payment status for a user
 */
export function getPaymentStatus(user: User): PaymentStatusInfo {
  // User has no payment
  if (!user.lastPaymentDate || !user.subscriptionExpiryDate) {
    return {
      status: "No Payment",
      badge: "⚪",
      color: "bg-gray-100 text-gray-700",
    };
  }

  const expiryDate = new Date(user.subscriptionExpiryDate);

  // Subscription expired
  if (isPast(expiryDate)) {
    return {
      status: "Expired",
      badge: "🔴",
      color: "bg-red-100 text-red-700",
    };
  }

  // Expiring soon (within next 5 days)
  if (isWithinDays(expiryDate, DAYS_BEFORE_EXPIRY_WARNING)) {
    return {
      status: "Expiring Soon",
      badge: "🟡",
      color: "bg-yellow-100 text-yellow-700",
    };
  }

  // Active subscription
  return {
    status: "Active",
    badge: "🟢",
    color: "bg-green-100 text-green-700",
  };
}

/**
 * Calculates the number of days until expiry
 */
export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates expiry date based on start date and months
 */
export function calculateExpiryDate(
  startDate: Date | string,
  months: number
): Date {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

/**
 * Formats payment amount with currency
 */
export function formatPaymentAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Gets the default payment amount based on months
 */
export function getDefaultPaymentAmount(months: 1 | 3): number {
  return months === 1 ? 200 : 500;
}
