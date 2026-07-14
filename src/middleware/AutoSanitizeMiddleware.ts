/**
 * Auto-Sanitize Middleware
 * Automatically sanitizes all response bodies to remove sensitive data
 * This provides a safety net in case sensitive data leaks through
 */

import { Request, Response, NextFunction } from 'express'
import { sanitizeResponse } from '../utilities/ResponseSanitizer'

/**
 * Middleware that intercepts JSON responses and removes sensitive data
 * This is a defensive layer - use response utilities directly for better control
 *
 * Usage in app.ts:
 * app.use(autoSanitizeMiddleware())
 *
 * NOTE: This intercepts ALL responses, which has a small performance cost.
 * For better performance and control, sanitize data explicitly using
 * ResponseWithSanitizer or sanitizeResponse() in your controllers.
 */
export const autoSanitizeMiddleware = (options?: { enabled?: boolean }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if middleware is disabled
    if (options?.enabled === false) {
      return next()
    }

    // Store the original json method
    const originalJson = res.json.bind(res)

    // Override the json method to sanitize before sending
    res.json = function (body: any) {
      try {
        // Sanitize the response body
        const sanitized = sanitizeResponse(body, {
          deep: true,
          replaceWithRedacted: false,
        })

        // Call the original json method with sanitized data
        return originalJson(sanitized)
      } catch (error) {
        // If sanitization fails, log but still send original
        console.warn('Response sanitization failed:', error)
        return originalJson(body)
      }
    }

    next()
  }
}

export default autoSanitizeMiddleware
