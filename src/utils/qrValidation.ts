/**
 * Security utilities for QR code validation and sanitization
 */

// Maximum allowed QR data length (prevent DoS)
const MAX_QR_LENGTH = 500;

// Allowed characters for QR codes (alphanumeric, colon, underscore, hyphen)
const QR_PATTERN = /^[a-zA-Z0-9:_\-]+$/;

/**
 * Sanitize and validate QR code data
 * @param qrData - Raw QR code data from scanner
 * @returns Sanitized QR data or null if invalid
 */
export const sanitizeQRData = (qrData: string | null | undefined): string | null => {
  if (!qrData || typeof qrData !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = qrData.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > MAX_QR_LENGTH) {
    return null;
  }

  // Validate pattern (prevent XSS and injection)
  if (!QR_PATTERN.test(trimmed)) {
    return null;
  }

  // Additional security: Remove any potential script tags or dangerous patterns
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return null;
    }
  }

  return trimmed;
};

/**
 * Validate QR code format (mission:csbc:grp1:level1)
 * @param qrData - Sanitized QR data
 * @returns true if format is valid
 */
export const validateQRFormat = (qrData: string): boolean => {
  if (!qrData) return false;

  // Allow various formats:
  // - mission:csbc:grp1:level1
  // - level_1
  // - 1 (just number)
  // - Any alphanumeric string with allowed separators
  
  return QR_PATTERN.test(qrData);
};

/**
 * Escape HTML to prevent XSS in error messages
 * @param text - Text to escape
 * @returns Escaped text safe for HTML display
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

