/**
 * Response Sanitizer Utility
 * Automatically removes sensitive data from response objects
 */

/**
 * Default sensitive keys that will be removed from responses
 */
const DEFAULT_SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'password_hash',
  'currentPassword',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'access_token',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'secret_key',
  'privateKey',
  'private_key',
  'authToken',
  'auth_token',
  'sessionToken',
  'session_token',
  'otp',
  'otpSecret',
  'otp_secret',
  'jti',
  'salt',
  'hash',
  'verificationToken',
  'verification_token',
  'resetToken',
  'reset_token',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'cvv2',
  'pin',
  'ssn',
  'social_security',
  'bankAccount',
  'bank_account',
  'iban',
  'swift',
  'encryptionKey',
  'encryption_key',
] as const

export type SanitizeOptions = {
  /** Custom sensitive keys to remove (in addition to default keys) */
  customSensitiveKeys?: string[]
  /** Keys that should NOT be sanitized even if they match sensitive patterns */
  allowedSensitiveKeys?: (typeof DEFAULT_SENSITIVE_KEYS)[number][]
  /** Deep sanitization - recursively sanitize nested objects and arrays */
  deep?: boolean
  /** If true, replace sensitive values with '[REDACTED]' instead of removing the key */
  replaceWithRedacted?: boolean
}

/**
 * Check if a key should be sanitized
 */
const isSensitiveKey = (
  key: string,
  customKeys: string[] = [],
  allowedKeys: string[] = [],
): boolean => {
  // If key is in allowed list, don't sanitize it
  if (allowedKeys.some((allowedKey) => allowedKey.toLowerCase() === key.toLowerCase())) {
    return false
  }

  const allSensitiveKeys = [...DEFAULT_SENSITIVE_KEYS, ...customKeys]
  const keyLower = key.toLowerCase()

  return allSensitiveKeys.some((sensitiveKey) => {
    const sensitiveLower = sensitiveKey.toLowerCase()
    // Exact match or contains the sensitive word
    return (
      keyLower === sensitiveLower ||
      keyLower.includes(sensitiveLower) ||
      keyLower.endsWith(sensitiveLower)
    )
  })
}

/**
 * Sanitize a single object
 */
const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  options: SanitizeOptions = {},
): Partial<T> => {
  const {
    customSensitiveKeys = [],
    allowedSensitiveKeys = [],
    deep = true,
    replaceWithRedacted = false,
  } = options

  if (!obj || typeof obj !== 'object') {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    if (deep) {
      return obj.map((item) =>
        typeof item === 'object' ? sanitizeObject(item, options) : item,
      ) as any
    }
    return obj as any
  }

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Check if key is sensitive
    if (isSensitiveKey(key, customSensitiveKeys, allowedSensitiveKeys)) {
      if (replaceWithRedacted) {
        sanitized[key] = '[REDACTED]'
      }
      // If not replacing, simply don't add the key (effectively removing it)
      continue
    }

    // Deep sanitization for nested objects
    if (deep && value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'object' && item !== null ? sanitizeObject(item, options) : item,
        )
      } else {
        sanitized[key] = sanitizeObject(value, options)
      }
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as Partial<T>
}

/**
 * Main sanitize function
 * Removes sensitive data from response objects
 *
 * @example
 * ```ts
 * const user = {
 *   id: 1,
 *   email: 'user@example.com',
 *   password: 'secret123',
 *   token: 'abc123'
 * }
 *
 * const sanitized = sanitizeResponse(user)
 * // Result: { id: 1, email: 'user@example.com' }
 * ```
 */
export const sanitizeResponse = <T>(data: T, options: SanitizeOptions = {}): Partial<T> => {
  if (data === null || data === undefined) {
    return data as any
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data as any
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponse(item, options)) as any
  }

  // Handle objects
  return sanitizeObject(data as Record<string, any>, options) as Partial<T>
}

/**
 * Export sensitive keys list for reference
 */
export const SENSITIVE_KEYS = DEFAULT_SENSITIVE_KEYS

export default {
  sanitizeResponse,
  SENSITIVE_KEYS,
}
