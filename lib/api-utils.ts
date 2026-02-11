/**
 * API utility functions for consistent response handling
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "./constants";
import type { ApiResponse, ApiError } from "@/types";

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      message,
      details,
    },
    { status }
  );
}

/**
 * Creates a validation error response
 */
export function createValidationError(
  message: string
): NextResponse<ApiError> {
  return createErrorResponse(message, HTTP_STATUS.BAD_REQUEST);
}

/**
 * Creates a not found error response
 */
export function createNotFoundError(
  resource: string = "Resource"
): NextResponse<ApiError> {
  return createErrorResponse(
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND
  );
}

/**
 * Creates an unauthorized error response
 */
export function createUnauthorizedError(
  message: string = "Unauthorized"
): NextResponse<ApiError> {
  return createErrorResponse(message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Creates a conflict error response
 */
export function createConflictError(
  message: string
): NextResponse<ApiError> {
  return createErrorResponse(message, HTTP_STATUS.CONFLICT);
}

/**
 * Wraps an async API route handler with error handling
 */
export function withErrorHandling<T = unknown>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
  return handler().catch((error) => {
    console.error("API Error:", error);
    return createErrorResponse(
      error.message || "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  });
}

/**
 * Adds no-cache headers to a response
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    (field) => !body[field] || (typeof body[field] === "string" && !body[field].toString().trim())
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitizes user input by trimming whitespace
 */
export function sanitizeInput<T extends Record<string, unknown>>(
  data: T
): T {
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = (sanitized[key] as string).trim() as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}
