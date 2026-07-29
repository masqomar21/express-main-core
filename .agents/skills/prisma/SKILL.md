---
name: prisma-perkim
description: >
  Prisma ORM workflow, schema patterns, migration, query best practices, dan
  troubleshooting spesifik untuk perkim-be (PostgreSQL + Prisma v7 + adapter-pg).
  Load skill ini saat bekerja dengan schema.prisma, migrasi DB, atau query Prisma.
---

# Prisma Skill — perkim-be

> Prisma v7 · PostgreSQL · `@prisma/adapter-pg` · output: `generated/prisma`

---

## ⚙️ Setup Info

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"   // bukan default node_modules
}

datasource db {
  provider = "postgresql"
}
```

Import client **selalu** dari config singleton:
```ts
import prisma from '@/config/database'
```

Import enum **selalu** dari generated path:
```ts
import { Process, RoleType, OtpPurpose } from 'generated/prisma/enums'
```

---

## 🔄 Migration Workflow

### Development

```bash
# 1. Edit prisma/schema.prisma
# 2. Format + lint + migrate + generate (semuanya dalam satu command):
npm run migrate

# Equivalent manual:
npx prisma format
ts-node scripts/lint-prisma-schema.ts
npx prisma migrate dev --name <nama_fitur>
npx prisma generate
```

### Production

```bash
npm run migrate:deploy
# Equivalent: prisma migrate deploy && prisma generate
```

### Reset (Dev Only — BERBAHAYA, hapus semua data)

```bash
npm run migrate:reset         # reset tanpa seed
npm run migrate:reset:seed    # reset + jalankan seeder
```

### Setelah Pull Code yang Ada Migrasi Baru

```bash
npm run migrate:deploy  # atau npx prisma migrate dev
npx prisma generate     # wajib regenerate client
```

---

## 📐 Schema Conventions

### Model Baru — Checklist

```prisma
model EntityName {
  // 1. ID integer auto-increment
  id        Int      @id @default(autoincrement())

  // 2. Field bisnis
  name      String
  label     String?

  // 3. Timestamps (wajib ada)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 4. Soft delete (opsional — tambahkan hanya jika model perlu soft delete)
  // deletedAt DateTime?

  // 5. Relasi di bagian akhir
  userId    Int
  user      User     @relation(fields: [userId], references: [id])

  // 6. Index & unique constraint
  @@unique([userId, entityId])
  @@index([userId])
}
```

### Enum

```prisma
// Definisikan enum sebelum model yang menggunakannya
enum StatusType {
  ACTIVE
  INACTIVE
  PENDING
}

model Entity {
  status StatusType @default(ACTIVE)
}
```

### Relasi One-to-Many

```prisma
model Parent {
  id       Int     @id @default(autoincrement())
  children Child[]
}

model Child {
  id       Int    @id @default(autoincrement())
  parentId Int
  parent   Parent @relation(fields: [parentId], references: [id])
}
```

### Relasi Many-to-Many (lewat join table — pola yang dipakai project ini)

```prisma
// Lihat pola RolePermission di schema.prisma sebagai referensi
model RolePermission {
  id           Int         @id @default(autoincrement())
  roleId       Int
  role         Role        @relation(fields: [roleId], references: [id])
  permissionId Int
  permission   Permissions @relation(fields: [permissionId], references: [id])
  canRead      Boolean     @default(false)
  canWrite     Boolean     @default(false)
}
```

---

## 🔍 Query Patterns

### GET List dengan Pagination

```ts
import { Pagination } from '@/utilities/Pagination'

const page = new Pagination(req.query)

const [data, count] = await Promise.all([
  prisma.entity.findMany({
    where: { deletedAt: null }, // hanya jika model punya field deletedAt
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    skip: page.offset,
    take: page.limit,
    orderBy: { id: 'desc' },
  }),
  prisma.entity.count({ where: { deletedAt: null } }), // sesuaikan jika tidak ada deletedAt
])

return ResponseData.ok(res, page.paginate(count, data))
```

### GET dengan Filter Tanggal

```ts
import { buildDateFilter } from '@/utilities/PrismaFilter'

const { startDate, endDate } = req.query
const dateFilter = buildDateFilter(startDate as string, endDate as string)

const where: Prisma.EntityWhereInput = { deletedAt: null }
if (Object.keys(dateFilter).length > 0) {
  where.createdAt = dateFilter
}
```

### GET Detail — findUnique vs findFirst

```ts
// Gunakan findUnique untuk primary key atau @unique field
const data = await prisma.entity.findUnique({ where: { id } })

// Gunakan findFirst untuk kondisi non-unique
const data = await prisma.entity.findFirst({
  where: { name, deletedAt: null }
})

// Selalu cek null setelah find
if (!data) return ResponseData.notFound(res, 'Data not found')
```

### CREATE

```ts
const data = await prisma.entity.create({
  data: {
    name: validation.data!.name,
    userId: userLogin.id,
  },
})
```

### UPDATE

```ts
const data = await prisma.entity.update({
  where: { id },
  data: { name: validation.data!.name },
})
```

### Soft Delete & Restore (Opsional)

Gunakan soft delete **hanya jika model memiliki field `deletedAt DateTime?`** di schema.
Jika tidak ada, langsung gunakan hard delete.

```ts
// Cek schema dulu — apakah model punya deletedAt?

// Jika YA → Soft delete
await prisma.entity.update({ where: { id }, data: { deletedAt: new Date() } })

// Restore
await prisma.entity.update({ where: { id }, data: { deletedAt: null } })
```

### DELETE Permanen (Hard Delete)

Gunakan ini jika model **tidak punya** `deletedAt`, atau memang perlu hapus permanen:

```ts
await prisma.entity.delete({ where: { id } })
```

### Nested Create (relasi)

```ts
await prisma.parent.create({
  data: {
    name: 'Parent',
    children: {
      create: [{ name: 'Child 1' }, { name: 'Child 2' }],
    },
  },
})
```

### Upsert

```ts
await prisma.entity.upsert({
  where: { email: reqBody.email },
  create: { email: reqBody.email, name: reqBody.name },
  update: { name: reqBody.name },
})
```

---

## 🔒 Select Pattern (Security)

**Selalu gunakan `select` untuk batasi field yang dikembalikan.** Jangan pernah return object user lengkap dengan password.

```ts
// ✅ Benar
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    role: {
      select: { name: true },
    },
  },
})

// ❌ Berbahaya — expose password
const user = await prisma.user.findUnique({ where: { id } })
```

Jika terpaksa query tanpa select, hapus field sensitif setelahnya:
```ts
const user = await prisma.user.findUnique({ where: { id } })
delete (user as { password?: string }).password
```

---

## 📊 Prisma dengan TypeScript Type Safety

### Gunakan `Prisma.EntityWhereInput` untuk kondisi dinamis

```ts
import { Prisma } from 'generated/prisma/client'

const where: Prisma.UserWhereInput = { deletedAt: null }

if (req.query.search) {
  where.OR = [
    { name: { contains: req.query.search as string, mode: 'insensitive' } },
    { email: { contains: req.query.search as string, mode: 'insensitive' } },
  ]
}
```

### `Prisma.EntityCreateInput` dan `Prisma.EntityUpdateInput`

```ts
import { Prisma } from 'generated/prisma/client'

const createData: Prisma.EntityCreateInput = {
  name: 'New Entity',
  user: { connect: { id: userLogin.id } },
}
```

---

## 🔗 Transaction (Atomic Operations)

Gunakan `prisma.$transaction` untuk operasi yang harus atomik:

```ts
await prisma.$transaction(async (tx) => {
  const entity = await tx.entity.create({ data: { name } })
  await tx.loger.create({
    data: { userId: userLogin.id, process: 'CREATE', detail: `Created ${entity.id}` },
  })
  return entity
})
```

---

## 📝 Seeder Pattern

Seeder di `src/db/seeder/`. Struktur seeder baru:

```ts
// src/db/seeder/entitySeeder.ts
import prisma from '@/config/database'

export const entitySeeder = async () => {
  await prisma.entity.createMany({
    data: [
      { name: 'Entity 1' },
      { name: 'Entity 2' },
    ],
    skipDuplicates: true, // idempotent
  })
  console.log('Entity seeded')
}
```

Daftarkan di `src/db/seeder/index.ts` dan jalankan:
```bash
npm run db:seed
```

---

## 🐛 Troubleshooting

### `Prisma Client not generated`
```bash
npx prisma generate
```

### `Schema not in sync with migration`
```bash
npm run migrate  # dev
# atau
npx prisma migrate dev
```

### `P2002: Unique constraint failed`
```ts
// Handle di catch block
import { Prisma } from 'generated/prisma/client'

} catch (error: any) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return ResponseData.badRequest(res, 'Data sudah ada (duplicate)')
  }
  return ResponseData.serverError(res, error)
}
```

### `P2025: Record not found` (saat update/delete)
```ts
} catch (error: any) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return ResponseData.notFound(res, 'Data tidak ditemukan')
  }
  return ResponseData.serverError(res, error)
}
```

### Regenerate setelah pull schema baru
```bash
npx prisma generate
# Jika masih error, coba:
npx prisma migrate dev
npx prisma generate
```

---

## ✅ Quick Checklist — Tambah Model Baru

- [ ] Tambah model di `prisma/schema.prisma`
- [ ] Jalankan `npm run migrate` (dev) atau `npm run migrate:deploy` (prod)
- [ ] Buat Zod schema di `src/schema/NamaSchema.ts`
- [ ] Buat Controller di `src/controllers/[folder]/NamaController.ts`
- [ ] Buat Router di `src/routes/[folder]/NamaRoute.ts`
- [ ] Daftarkan router di `src/routes/api.route.ts`
- [ ] Jika ada permission baru: update `PermissionList` di `src/types/global.d.ts`
- [ ] Jika ada seeder: tambahkan di `src/db/seeder/`
