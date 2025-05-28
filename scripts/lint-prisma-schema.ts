import fs from 'fs'
import path from 'path'

const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
const schema = fs.readFileSync(schemaPath, 'utf8')

let hasError = false

const modelRegex = /model (\w+) \{([\s\S]*?)\}/g
const enumRegex = /enum (\w+) \{([\s\S]*?)\}/g

const modelNames: Set<string> = new Set()
let match: RegExpExecArray | null

// ✅ 1. Validasi Model & Field
while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1]
  const body = match[2]

  // 1.1 Model harus PascalCase
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(modelName)) {
    console.error(`❌ Model "${modelName}" harus menggunakan PascalCase`)
    hasError = true
  }

  // 1.2 Cek model duplikat
  if (modelNames.has(modelName)) {
    console.error(`❌ Model "${modelName}" terduplikasi`)
    hasError = true
  } else {
    modelNames.add(modelName)
  }

  // 1.3 Validasi field
  const fields = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'))

  const fieldNames = fields.map((l) => l.split(/\s+/)[0])

  for (const field of fieldNames) {
    if (!field.startsWith('@') && !/^[a-z][a-zA-Z0-9]*$/.test(field)) {
      console.error(`❌ Field "${field}" di model "${modelName}" harus menggunakan camelCase`)
      hasError = true
    }
  }
}

// ✅ 2. Validasi Enum
while ((match = enumRegex.exec(schema)) !== null) {
  const enumName = match[1]
  const body = match[2].trim()

  // 2.1 Enum name PascalCase
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(enumName)) {
    console.error(`❌ Enum "${enumName}" harus menggunakan PascalCase`)
    hasError = true
  }

  // 2.2 Enum value SCREAMING_SNAKE_CASE
  const values = body.split('\n').map((l) => l.trim()).filter((v) => v)
  for (const value of values) {
    const v = value.split('//')[0].trim() // abaikan komentar
    if (!/^[A-Z0-9_]+$/.test(v)) {
      console.error(`❌ Value "${v}" di enum "${enumName}" harus menggunakan SCREAMING_SNAKE_CASE`)
      hasError = true
    }
  }
}

// ✅ Final check
if (hasError) {
  console.error('\n❌ Prisma schema memiliki kesalahan. Harap diperbaiki sebelum migrasi.')
  process.exit(1)
} else {
  console.log('✅ Prisma schema valid dan sesuai standar Newus.')
}
