import { z } from "zod"

export const validateInput = <T>(schema: z.ZodSchema<T>, reqBody: unknown) => {
  const validationResult = schema.safeParse(reqBody)

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  return { success: true }
}
