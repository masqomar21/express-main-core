import { z } from 'zod'

/**
//  * Validates the request body against a Zod schema.
//  * Automatically parses JSON strings (like arrays/objects) from FormData.
//  *
//  * @param schema - The Zod schema to validate against.
//  * @param reqBody - The request body to validate.
//  * @returns An object indicating success or failure, and the validated data or errors.
//  * @template T - The type of the schema.
//  */
export const validateInput = <T>(schema: z.ZodSchema<T>, reqBody: unknown) => {
  const parsedBody = preprocessFormData(reqBody)

  // console.log('Parsed Body:', parsedBody) // Debug log

  const validationResult = schema.safeParse(parsedBody)
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.issues,
    }
  }

  return { success: true, data: validationResult.data }
}

function preprocessFormData(data: any): any {
  if (!data || typeof data !== 'object') return data
  const cloned: Record<string, any> = { ...data }

  // 1️⃣ Parse JSON string field (ex: obj="[{}]")
  for (const key of Object.keys(cloned)) {
    const value = cloned[key]
    if (typeof value === 'string' && looksLikeJson(value)) {
      try {
        cloned[key] = JSON.parse(value)
      } catch {
        // biarkan jika bukan JSON valid
      }
    }
  }

  // 2️⃣ Deteksi pola indexed seperti obj[0][fieldName]
  const grouped: Record<string, Record<number, Record<string, any>>> = {}

  for (const key of Object.keys(cloned)) {
    const match = key.match(/^([a-zA-Z0-9_]+)\[(\d+)\]\[?([a-zA-Z0-9_]*)\]?$/)
    if (match) {
      const [, baseKey, indexStr, fieldName] = match
      const index = parseInt(indexStr)
      if (!grouped[baseKey]) grouped[baseKey] = {}
      if (!grouped[baseKey][index]) grouped[baseKey][index] = {}

      // kalau ada fieldName → obj[0][foo] = val
      // kalau gak ada fieldName → obj[0] = val (misal array of primitive)
      if (fieldName) {
        grouped[baseKey][index][fieldName] = tryCastNumber(cloned[key])
      } else {
        grouped[baseKey][index] = tryCastNumber(cloned[key])
      }

      delete cloned[key]
    }
  }

  // 3️⃣ Bentuk ulang semua baseKey jadi array of object
  for (const baseKey of Object.keys(grouped)) {
    const arr = Object.keys(grouped[baseKey])
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((i) => grouped[baseKey][parseInt(i)])
    cloned[baseKey] = arr
  }

  return cloned
}

/** Deteksi cepat apakah string tampak seperti JSON */
function looksLikeJson(str: string): boolean {
  const s = str.trim()
  return (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))
}

/** Coba konversi value string menjadi number bila valid */
function tryCastNumber(value: any): any {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (trimmed === '') return value
  const num = Number(trimmed)
  return !isNaN(num) ? num : value
}

/**
 * Ekstrak index dari nama field seperti: member[0].ktp
 * @param fieldname - nama field dari multer (contoh: "member[0].ktp")
 * @param parentKey - nama induk (contoh: "member")
 * @param fieldKey - nama field target (contoh: "ktp")
 * @returns number | null
 * @example
 * for (const file of files) {
 *   const index = extractIndexFromFieldname(file.fieldname, 'member', 'ktp')
 *   if (index === null || index < 0 || index >= membersToAdd.length) continue
 *   const fileName = await handleUpload(req, file.fieldname, 'poktanDoc', ['image/jpeg', 'image/png'])
 *   membersToAdd[index].ktp = fileName!
 * }
 */
export function extractIndexFromFieldname(
  fieldname: string,
  parentKey: string,
  fieldKey: string,
): number | null {
  const regex = new RegExp(`^${parentKey}\\[(\\d+)\\]\\.${fieldKey}$`)
  const match = fieldname.match(regex)
  if (!match) return null

  const index = parseInt(match[1], 10)
  return isNaN(index) ? null : index
}
