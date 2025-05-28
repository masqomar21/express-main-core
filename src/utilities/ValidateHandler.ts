import { z } from 'zod'

/**
 * Validates the request body against a Zod schema.
 * @param schema - The Zod schema to validate against.
 * @param reqBody - The request body to validate.
 * @returns An object indicating success or failure, and the validated data or errors.
 * @template T - The type of the schema.
 */
export const validateInput = <T>(schema: z.ZodSchema<T>, reqBody: unknown) => {
  const validationResult = schema.safeParse(reqBody)

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  return { success: true, data : reqBody as z.infer<typeof schema> }
}
