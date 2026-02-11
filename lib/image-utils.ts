/**
 * Image processing utilities
 */

import {
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_COMPRESSION_QUALITY,
  MAX_IMAGE_DIMENSION,
  ALLOWED_IMAGE_TYPES,
} from "./constants";
import { validateImageType, validateImageSize } from "./utils";

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file
 */
export function validateImage(file: File): ImageValidationResult {
  if (!validateImageType(file)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, or WebP images are allowed",
    };
  }

  if (!validateImageSize(file, MAX_IMAGE_SIZE_BYTES)) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image file to a base64 string
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height *= MAX_IMAGE_DIMENSION / width;
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width *= MAX_IMAGE_DIMENSION / height;
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_COMPRESSION_QUALITY));
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and compresses an image file
 */
export async function processImage(
  file: File
): Promise<{ success: boolean; data?: string; error?: string }> {
  const validation = validateImage(file);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    const compressed = await compressImage(file);
    return {
      success: true,
      data: compressed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process image",
    };
  }
}
