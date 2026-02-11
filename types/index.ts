/**
 * Shared type definitions for the application
 */

import { PAYMENT_DURATIONS } from "@/lib/constants";

// ============================================================================
// User Types
// ============================================================================

export type PaymentDuration = (typeof PAYMENT_DURATIONS)[number];

export interface User {
  _id: string;
  name: string;
  phone: string;
  joiningDate?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastPaymentMonths?: PaymentDuration;
  subscriptionExpiryDate?: string;
  hasAadhaar?: boolean;
  aadhaarUploadedAt?: string;
  createdAt: string;
}

export interface UserFormData {
  name: string;
  phone: string;
  joiningDate?: string;
  aadhaarImage?: string;
}

// ============================================================================
// Attendance Types
// ============================================================================

export interface Attendance {
  _id: string;
  name: string;
  phone: string;
  date: string;
  inTime: string;
  outTime: string | null;
}

export interface AttendanceStats {
  totalToday: number;
  currentlyInside: number;
  crowdLevel: "low" | "medium" | "high";
}

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment {
  _id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  months: PaymentDuration;
  paymentDate: string;
  expiryDate: string;
  createdAt: string;
}

export interface PaymentFormData {
  userId: string;
  months: PaymentDuration;
  amount?: number;
  paymentDate?: string;
}

export type PaymentStatus =
  | "No Payment"
  | "Active"
  | "Expiring Soon"
  | "Expired";

export interface PaymentStatusInfo {
  status: PaymentStatus;
  badge: string;
  color: string;
}

export type PaymentFilter = "all" | "paid" | "expired" | "expiring" | "no-payment";

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Form State Types
// ============================================================================

export interface FormState {
  isSubmitting: boolean;
  message: string;
  error: boolean;
}

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface Admin {
  username: string;
  isAuthenticated: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  admin?: Admin;
}
