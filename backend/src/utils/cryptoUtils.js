import crypto from 'crypto';

/**
 * Hash a string using SHA-256
 * @param {string} input - The string to hash
 * @returns {string} - The hex-encoded hash
 */
export const hashSHA256 = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Compare a plaintext string with a hash (constant-time comparison)
 * @param {string} plaintext - The plaintext to check
 * @param {string} hash - The hash to compare against
 * @returns {boolean} - True if they match
 */
export const compareHash = (plaintext, hash) => {
  const plaintextHash = hashSHA256(plaintext);
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(plaintextHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * Validate flag format
 * @param {string} flag - The flag to validate
 * @returns {boolean} - True if format is valid
 */
export const validateFlagFormat = (flag) => {
  // Expected format: CSBC{...}
  if (!flag || typeof flag !== 'string') return false;
  if (!flag.startsWith('CSBC{') || !flag.endsWith('}')) return false;
  const content = flag.slice(5, -1);
  return content.length > 0;
};

/**
 * Sanitize input string
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000); // Max 1000 chars
};


