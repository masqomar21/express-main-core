---
trigger: always_on
---

# perkim-be — Agent Guide

> Express.js 5 + TypeScript + Prisma (PostgreSQL) + BullMQ + Redis + Socket.io

---

## 🏗️ Project Structure

```
perkim-be/
├── app.ts                    # Entry point — Express app init
├── prisma/
│   ├── schema.prisma         # Sumber kebenaran schema DB
│   └── migrations/           # Riwayat migrasi
├── src/
│   ├── config/               # Database, Redis, Socket, WebPush, dll.
│   ├── controllers/          # Business logic (object of async functions)
│   │   ├── auth/
│   │   ├── master/           # CRUD entitas master (User, Role, dll.)
│   │   └── notification/
│   ├── db/seeder/            # Seed data awal
│   ├── middleware/           # Express middleware
│   ├── queues/               # Deklarasi BullMQ queue
│   ├── routes/               # Route definitions (factory function)
│   │   ├── api.route.ts      # Root router — daftarkan semua router di sini
│   │   ├── auth/
│   │   ├── master/
│   │   └── notification/
│   ├── schema/               # Zod validation schema
│   ├── services/             # External service (Mail, PDF, Excel, Notif)
│   ├── socket/               # Socket.io event handlers
│   ├── template/             # HTML template (Puppeteer PDF)
│   ├── types/
│   │   └── global.d.ts       # Global TypeScript declarations
│   ├── utilities/            # Helper functions (Response, Pagination, dll.)
│   └── workers/              # BullMQ worker processors
└── scripts/                  # Build & utility scripts
```

---

## 📐 Naming Conventions

### Files & Folders

| Konteks | Format | Contoh |
|---------|--------|--------|
| Controller | `PascalCase` + suffix `Controller` | `UserController.ts` |
| Router | `PascalCase` + suffix `Router` / `Route` | `UserRoute.ts`, `RoleRouter.ts` |
| Schema (Zod) | `PascalCase` + suffix `Schema` | `UserSchema.ts` |
| Middleware | `PascalCase` + suffix `Middleware` | `AuthMiddleware.ts` |
| Service | `PascalCase` + suffix `Service` | `MailService.ts` |
| Utility | `PascalCase` | `Response.ts`, `Pagination.ts` |

### Variables & Functions

- `camelCase` untuk variabel dan fungsi: `userData`, `getAllUser`
- `UPPER_CASE` untuk env vars dan konstanta global: `CONFIG.port`
- Boolean harus diawali verb: `isNaN`, `hasPermission`, `isActive`
- `I` prefix untuk interface: `jwtPayloadInterface` (ikuti pola yang sudah ada)
- Controller selalu berupa **object of async functions** (bukan class)

---

## 🔁 Alur Tambah Endpoint Baru

Ikuti urutan ini setiap menambah fitur/endpoint baru:

```
schema.prisma → migrate → Zod Schema → Controller → Router → api.route.ts
```

### 1. Update `prisma/schema.prisma` (jika butuh model baru)

```prisma
model NewEntity {
  id        Int       @id @default(autoincrement())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?  // opsional — tambahkan jika model perlu soft delete
}
```

Lalu jalankan:
```bash
npm run migrate        # dev: format + lint + prisma migrate dev + generate
npm run migrate:deploy # production
```

### 2. Buat Zod Schema (fleksibel)

Schema Zod boleh diletakkan di **dua tempat** sesuai kebutuhan:

**Opsi A — File terpisah di `src/schema/`** (direkomendasikan jika schema dipakai di lebih dari satu tempat)

```ts
// src/schema/NewEntitySchema.ts
import { z } from 'zod'

export const NewEntitySchemaForCreate = z.object({
  name: z.string().min(1, 'Name wajib diisi'),
})

export const NewEntitySchemaForUpdate = z.object({
  name: z.string().min(1, 'Name wajib diisi'),
})
```

**Opsi B — Inline di controller** (boleh jika schema sederhana dan hanya dipakai di satu controller)

```ts
// src/controllers/master/NewEntityController.ts
import { z } from 'zod'

const NewEntitySchemaForCreate = z.object({
  name: z.string().min(1, 'Name wajib diisi'),
})
```

### 3. Buat Controller di `src/controllers/`

```ts
// src/controllers/master/NewEntityController.ts
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { validateInput } from '@/utilities/ValidateHandler'
import { NewEntitySchemaForCreate, NewEntitySchemaForUpdate } from '@/schema/NewEntitySchema'
import { logActivity } from '@/utilities/LogActivity'
import { ResponseData } from '@/utilities/Response'

const NewEntityController = {
  getAll: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(req.query)
      const [data, count] = await Promise.all([
        prisma.newEntity.findMany({
          where: { deletedAt: null },
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.newEntity.count({ where: { deletedAt: null } }),
      ])
      return ResponseData.ok(res, page.paginate(count, data), 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  getById: async (req: Request, res: Response): Promise<any> => {
    try {
      const id = parseInt(req.params.id)
      const data = await prisma.newEntity.findUnique({ where: { id } })
      if (!data) return ResponseData.notFound(res, 'Data not found')
      return ResponseData.ok(res, data, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  create: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const validation = validateInput(NewEntitySchemaForCreate, req.body)
      if (!validation.success) {
        return ResponseData.badRequest(res, 'Invalid Input', validation.errors)
      }
      const data = await prisma.newEntity.create({ data: validation.data! })
      await logActivity(userLogin.id, 'CREATE', `Create newEntity ${data.name}`)
      return ResponseData.created(res, data, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  update: async (req: Request, res: Response): Promise<any> => {
    try {
      const id = parseInt(req.params.id)
      const userLogin = req.user as jwtPayloadInterface
      const validation = validateInput(NewEntitySchemaForUpdate, req.body)
      if (!validation.success) {
        return ResponseData.badRequest(res, 'Invalid Input', validation.errors)
      }
      const existing = await prisma.newEntity.findUnique({ where: { id } })
      if (!existing) return ResponseData.notFound(res, 'Data not found')
      const data = await prisma.newEntity.update({ where: { id }, data: validation.data! })
      await logActivity(userLogin.id, 'UPDATE', `Update newEntity ${data.name}`)
      return ResponseData.ok(res, data, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  softDelete: async (req: Request, res: Response): Promise<any> => {
    try {
      const id = parseInt(req.params.id)
      const userLogin = req.user as jwtPayloadInterface
      const existing = await prisma.newEntity.findUnique({ where: { id } })
      if (!existing) return ResponseData.notFound(res, 'Data not found')
      const data = await prisma.newEntity.update({ where: { id }, data: { deletedAt: new Date() } })
      await logActivity(userLogin.id, 'DELETE', `Delete newEntity ${existing.name}`)
      return ResponseData.ok(res, data, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },

  restore: async (req: Request, res: Response): Promise<any> => {
    try {
      const id = parseInt(req.params.id)
      const userLogin = req.user as jwtPayloadInterface
      const existing = await prisma.newEntity.findUnique({ where: { id } })
      if (!existing) return ResponseData.notFound(res, 'Data not found')
      const data = await prisma.newEntity.update({ where: { id }, data: { deletedAt: null } })
      await logActivity(userLogin.id, 'RESTORE', `Restore newEntity ${existing.name}`)
      return ResponseData.ok(res, data, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default NewEntityController
```

### 4. Buat Router di `src/routes/`

> 💡 **Ketentuan Middleware Pada Route:**
> - Jika **Role Type** di aplikasi/fitur hanya ada 2 (yaitu `SUPER_ADMIN` dan `OTHER`), gunakan **`permissionMiddleware`** (akses berbasis permission granular `canRead`, `canWrite`, dll).
> - Jika terdapat **Role Type** lain (misal role khusus selain 2 tipe tersebut), gunakan **`RoleMiddleware`**.

```ts
// src/routes/master/NewEntityRoute.ts
import NewEntityController from '@/controllers/master/NewEntityController'
import { permissionMiddleware } from '@/middleware/PermissionMidlleware'
import { RoleMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const NewEntityRouter = (): Router => {
  const router = Router()

  // Opsi A: Jika Role Type hanya 2 (SUPER_ADMIN & OTHER) -> Pakai permissionMiddleware
  router.get('/', permissionMiddleware('Master_Data', 'canRead'), NewEntityController.getAll)
  router.get('/:id', permissionMiddleware('Master_Data', 'canRead'), NewEntityController.getById)
  router.post('/', permissionMiddleware('Master_Data', 'canWrite'), NewEntityController.create)
  router.put('/:id', permissionMiddleware('Master_Data', 'canUpdate'), NewEntityController.update)
  router.delete('/:id/soft', permissionMiddleware('Master_Data', 'canDelete'), NewEntityController.softDelete)
  router.patch('/:id/restore', permissionMiddleware('Master_Data', 'canRestore'), NewEntityController.restore)

  // Opsi B: Jika terdapat Role Type lain -> Pakai RoleMiddleware
  // router.get('/', RoleMiddleware(['SUPER_ADMIN', 'ROLE_LAIN']), NewEntityController.getAll)

  return router
}
```

### 5. Daftarkan di `src/routes/api.route.ts`

```ts
import { NewEntityRouter } from './master/NewEntityRoute'
// ...di dalam appRouter():
app.use(CONFIG.apiUrl + 'master/new-entity', NewEntityRouter())
```

---

## 🛡️ Auth & Permission System

### Middleware Chain (selalu ikuti urutan ini)

```
AuthMiddleware → generatePermissionList → [permissionMiddleware / RoleMiddleware] → Controller
```

Di `api.route.ts` sudah ada global:
```ts
app.use(AuthMiddleware, generatePermissionList) // berlaku untuk semua route di bawahnya
```

### Aturan Pemilihan Middleware (Permission vs Role)

- **Gunakan `permissionMiddleware`**: Jika role type pada sistem/fitur hanya ada 2 (`SUPER_ADMIN` dan `OTHER`). Akses dikontrol via sistem permission granular (`canRead`, `canWrite`, `canUpdate`, `canDelete`, `canRestore`).
- **Gunakan `RoleMiddleware`**: Jika terdapat role type lain / spesifik. Akses dikontrol langsung berdasarkan tipe role.

### Cara Pakai Permission di Route (Jika Role Type = 2)

```ts
// action: 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete' | 'canRestore' | 'all'
router.get('/', permissionMiddleware('User_Management', 'canRead'), controller.getAll)
router.post('/', permissionMiddleware('User_Management', 'canWrite'), controller.create)
router.put('/:id', permissionMiddleware('User_Management', 'canUpdate'), controller.update)
router.delete('/:id/soft', permissionMiddleware('User_Management', 'canDelete'), controller.softDelete)
router.patch('/:id/restore', permissionMiddleware('User_Management', 'canRestore'), controller.restore)
```

### Cara Pakai Role Middleware (Jika terdapat Role Type lain)

```ts
import { RoleMiddleware } from '@/middleware/AuthMiddleware'
router.get('/admin-only', RoleMiddleware('SUPER_ADMIN'), controller.adminAction)
router.get('/multi-role', RoleMiddleware(['SUPER_ADMIN', 'OTHER']), controller.multiAction)
```

### Tambah Permission / Role Baru

Tambahkan ke union type di `src/types/global.d.ts`:
```ts
// Tambah Role Type baru jika terdapat tipe role lain
type JwtRoleType = 'OTHER' | 'SUPER_ADMIN' | 'NEW_ROLE' -> sesuaikan dengan enum RoleType pada prisma, tidak boleh ada tambahan

// Tambah Permission baru
type PermissionList = 'Dashboard' | 'User_Management' | 'Master_Data' | 'New_Permission'
```

### Redis Permission Cache

Permission di-cache dengan key `user_permissions:{userId}` selama **1 jam**.
Setelah update role/permission user, **wajib invalidasi**:
```ts
import redisClient from '@/config/redis'
await redisClient.del(`user_permissions:${userId}`)
```

---

## 📤 Response Format

**Selalu gunakan `ResponseData` dari `@/utilities/Response`. Jangan pernah `res.json()` langsung.**

| Method | HTTP | Kapan Digunakan |
|--------|------|-----------------|
| `ResponseData.ok(res, data, msg?)` | 200 | GET berhasil, update berhasil |
| `ResponseData.created(res, data, msg?)` | 201 | POST create berhasil |
| `ResponseData.badRequest(res, msg, data?)` | 400 | Input salah, logika gagal |
| `ResponseData.validateError(res, data)` | 400 | Khusus Zod validation errors |
| `ResponseData.unauthorized(res, msg?)` | 401 | Token tidak ada/invalid |
| `ResponseData.forbidden(res, msg?)` | 403 | Permission tidak cukup |
| `ResponseData.notFound(res, msg?)` | 404 | Data tidak ditemukan |
| `ResponseData.serverError(res, error, msg?)` | 500 | Catch block |
| `ResponseData.otherResponse(res, status, msg, data?)` | Custom | Status khusus (misal 498) |
| `ResponseData.okRaw(res, data, msg?)` | 200 | Data non-sensitif (tanpa sanitize) |

> ⚠️ `ok()` dan `created()` otomatis **sanitize** data (strip field sensitif seperti password).
> Gunakan `okRaw()` / `createdRaw()` **hanya** jika dipastikan tidak ada data sensitif.

---

## ✅ Validation Pattern

**Selalu gunakan `validateInput()` dari `@/utilities/ValidateHandler`.**

```ts
import { validateInput } from '@/utilities/ValidateHandler'
import { UserSchemaForCreate } from '@/schema/UserSchema'

const validation = validateInput(UserSchemaForCreate, req.body)
if (!validation.success) {
  return ResponseData.badRequest(res, 'Invalid Input', validation.errors)
}
// Aman digunakan setelah lolos validasi
const data = await prisma.user.create({ data: validation.data! })
```

- `validateInput` otomatis handle FormData (parse JSON string, indexed fields `obj[0][field]`)
- Zod schema boleh di `src/schema/` (untuk yang dipakai di banyak tempat) **atau** inline di controller (untuk yang sederhana dan lokal)

---

## 📄 Pagination Pattern

```ts
const page = new Pagination(req.query)
// Dengan custom default:
const page = new Pagination(req.query, { defaultLimit: 20, defaultPage: 1 })

const [data, count] = await Promise.all([
  prisma.entity.findMany({
    where: { deletedAt: null },
    skip: page.offset,
    take: page.limit,
    orderBy: { id: 'desc' },
  }),
  prisma.entity.count({ where: { deletedAt: null } }),
])

return ResponseData.ok(res, page.paginate(count, data))
```

Shape response pagination:
```json
{
  "total_items": 100,
  "page": 1,
  "items": [...],
  "total_pages": 10,
  "current_page": 1,
  "links": { "prev": null, "next": "?page=2&limit=10" }
}
```

---

## 📝 Activity Log (Wajib)

**Wajib log setiap operasi mutasi** (CREATE, UPDATE, DELETE, RESTORE, LOGIN, LOGOUT):

```ts
import { logActivity } from '@/utilities/LogActivity'

// Di dalam controller setelah operasi DB berhasil:
await logActivity(userLogin.id, 'CREATE', `Create user ${data.name}`)
await logActivity(userLogin.id, 'UPDATE', `Update role ${data.name}`)
await logActivity(userLogin.id, 'DELETE', `Delete user ${data.name}`)
await logActivity(userLogin.id, 'RESTORE', `Restore user ${data.name}`)
```

Cara akses `userLogin`:
```ts
const userLogin = req.user as jwtPayloadInterface
```

---

## 🔄 Soft Delete Pattern (Opsional)

Soft delete **hanya digunakan jika model memiliki field `deletedAt DateTime?`** di schema.
Jika model tidak punya field tersebut, gunakan hard delete biasa (`prisma.entity.delete`).

```ts
// Tambahkan ke schema HANYA jika perlu soft delete:
// deletedAt DateTime?

// Soft Delete
await prisma.entity.update({ where: { id }, data: { deletedAt: new Date() } })

// Restore
await prisma.entity.update({ where: { id }, data: { deletedAt: null } })

// Query list — filter deletedAt HANYA jika model punya field ini
prisma.entity.findMany({ where: { deletedAt: null } })

// Jika model tidak punya deletedAt, gunakan hard delete:
await prisma.entity.delete({ where: { id } })
```

---

## 🔌 Socket.io (Real-time Events)

Emit event setelah operasi penting (terutama CREATE):

```ts
import { getIO } from '@/config/socket'

getIO().emit('create-entity', data)           // broadcast ke semua
getIO().to(`room-${id}`).emit('event', data)  // ke room spesifik
```

---

## 📡 SSE — Server-Sent Events

Gunakan SSE untuk streaming **one-way** dari server ke client (notifikasi real-time, progress update, live feed data). SSE menggunakan **Redis Pub/Sub** sebagai message broker internal melalui `sseManager` dari `@/config/sse`.

### Arsitektur

```
Client  ──(GET /sse)──→  sseManager.register()  ──→  Redis subscribe
                                                            ↑
Controller  ──(mutasi data)──→  redisClient.publish()  ─────┘
                                                            ↓
                               sseManager.broadcast()  →  Client
```

### 1. Register SSE Endpoint di Route

```ts
// src/routes/master/SomeRoute.ts
import sseManager from '@/config/sse'

export const SomeRouter = (): Router => {
  const router = Router()

  // SSE endpoint — client GET, koneksi tetap terbuka (long-lived)
  router.get('/sse', (req, res) => {
    sseManager.register(req, res, 'some-channel')
  })

  // ...route CRUD biasa...
  return router
}
```

### 2. Publish Event dari Controller

Setelah operasi DB berhasil, publish ke Redis channel yang sama:

```ts
import redisClient from '@/config/redis'

const data = await prisma.someEntity.create({ data: validation.data! })

// sseManager otomatis broadcast ke semua client yang subscribe channel ini
await redisClient.publish('some-channel', JSON.stringify({
  event: 'created',
  data,
}))
```

### 3. Pola Lengkap di Controller

```ts
// src/controllers/master/SomeController.ts
import redisClient from '@/config/redis'
import sseManager from '@/config/sse'

const SomeController = {
  // SSE stream handler — daftarkan di route sebagai GET /sse
  stream: (req: Request, res: Response) => {
    sseManager.register(req, res, 'some-channel')
  },

  create: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const validation = validateInput(SomeSchema, req.body)
      if (!validation.success) {
        return ResponseData.badRequest(res, 'Invalid Input', validation.errors)
      }
      const data = await prisma.someEntity.create({ data: validation.data! })
      await logActivity(userLogin.id, 'CREATE', `Create entity ${data.name}`)

      // Notify semua SSE client yang sedang subscribe channel ini
      await redisClient.publish('some-channel', JSON.stringify({ event: 'created', data }))

      return ResponseData.created(res, data, 'Success')
    } catch (error: any) {
      return ResponseData.serverError(res, error)
    }
  },
}
```

### Channel Naming Convention

```ts
'entity-updates'              // global — semua user yang subscribe
`user-${userId}-notif`        // per-user — hanya user tertentu
`project-${projectId}-feed`   // per-resource — semua yang memantau resource ini
```

### SSE vs Socket.io

| | SSE | Socket.io |
|--|--|--|
| **Arah** | Server → Client saja | Bidirectional |
| **Kapan** | Notifikasi, progress, live feed | Chat, kolaborasi real-time |
| **Reconnect** | Otomatis oleh browser | Perlu handle manual |

---

## 📊 API Export Tabel (PDF & Excel)

Untuk endpoint export data tabel ke PDF atau Excel, **selalu gunakan `CreatePrintTableController`** dari `@/utilities/PrintHelper` jika memungkinkan. Utility ini menangani format detection, file naming, dan streaming response secara otomatis.

### Pattern Dasar

```ts
// src/controllers/master/SomeController.ts
import { CreatePrintTableController } from '@/utilities/PrintHelper'
import prisma from '@/config/database'

const SomeController = {
  // ...CRUD methods...

  exportTable: CreatePrintTableController(async (req, res) => {
    const data = await prisma.someEntity.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'desc' },
    })

    return {
      title: 'Laporan Some Entity',
      fileName: 'laporan-some-entity',  // tanpa ekstensi — otomatis ditambahkan
      columns: [
        { header: 'No', key: 'id', width: 10 },
        { header: 'Nama', key: 'name', width: 40 },
        { header: 'Tanggal', key: 'createdAt', width: 30 },
      ],
      data: data.map((item, index) => ({
        id: index + 1,
        name: item.name,
        createdAt: item.createdAt.toLocaleDateString('id-ID'),
      })),
    }
  }),
}
```

### Register Route

```ts
// Di router — format diambil dari query string: ?format=pdf atau ?format=excel
router.get('/export', permissionMiddleware('Master_Data', 'canRead'), SomeController.exportTable)
```

### Query Format yang Didukung

| Query param | Nilai valid | Keterangan |
|-------------|-------------|------------|
| `?format=pdf` | `pdf` | Export ke PDF (default jika tidak ada query) |
| `?format=excel` | `excel`, `xlsx` | Export ke Excel |
| `?fileType=...` | sama seperti di atas | Alias untuk `format` |
| `?type=...` | sama seperti di atas | Alias untuk `format` |

### Set Default Format

```ts
// Jika tidak ada query format, default ke excel:
exportTable: CreatePrintTableController(async (req, res) => { ... }, { defaultFormat: 'excel' })
```

### Dengan Early Response (return error sebelum export)

Provider boleh return `ResponseData.*` lebih awal — `CreatePrintTableController` otomatis mendeteksinya:

```ts
exportTable: CreatePrintTableController(async (req, res) => {
  const { startDate, endDate } = req.query
  if (!startDate || !endDate) {
    return ResponseData.badRequest(res, 'startDate dan endDate wajib diisi')
  }

  const data = await prisma.someEntity.findMany({ ... })

  return {
    title: 'Laporan',
    columns: [...],
    data: [...],
  }
}),
```

### Shape `PrintTableResponse`

```ts
interface PrintTableResponse {
  title?: string          // Judul laporan (di header PDF)
  fileName?: string       // Nama file tanpa ekstensi
  sheetName?: string      // Nama sheet Excel (default: 'Sheet1')
  columns: PrintTableColumn[]
  data: Record<string, any>[]
  pdfOptions?: Omit<PDFExportOptions, 'title'>  // Opsi tambahan untuk PDF
}

interface PrintTableColumn {
  header: string           // Label kolom
  key: string              // Key dari object data
  width?: number | string  // number = pt untuk Excel, string = mm/cm untuk PDF
  align?: 'left' | 'center' | 'right'  // Hanya berlaku untuk PDF
}
```

> ⚠️ Jika kebutuhan export sangat custom (template HTML, multi-sheet, dll.), baru gunakan `PDFExportService` atau `ExcelExportService` secara langsung dari `@/services/`.

---

## 📬 Queue & Worker (BullMQ)

Digunakan untuk pekerjaan berat/async (upload S3, generate PDF, kirim email massal).

```ts
// Enqueue job dari controller
import { awsUploadQueue } from '@/queues/AwsUploadQueue'

await awsUploadQueue.add('upload-job', {
  tempFilePath: '/path/to/temp',
  destinationKey: 'folder/filename.jpg',
  modelName: 'Entity',
  recordId: data.id,
  updateData: { imageUrl: '' },
  fieldNameToUpdate: 'imageUrl',
} satisfies AwsUploadJobData)
```

Worker processor di `src/workers/`. Jalankan terpisah dari main server:
```bash
npm run dev:worker   # development
npm run start:worker # production
```

---

## 📁 File Upload Pattern

Ada **dua konteks** penggunaan file yang berbeda — pahami perbedaannya sebelum implementasi.

---

### Konteks 1 — Proses File (Import Data, dll.)

Gunakan `fileUploadMiddleware` **hanya** untuk kasus file yang perlu **diproses di server** (baca isi, parsing, import data, dll). Request menggunakan `multipart/form-data`.

```ts
import { fileUploadMiddleware } from '@/middleware/FileUploadMiddleware'

const upload = fileUploadMiddleware.fileUploadHandler('uploads', {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  saveToBucket: false, // tidak perlu upload ke S3, cukup proses lokal
})

// Di router (bukan di api.route.ts global):
router.post('/import', upload.single('file'), controller.importData)
```

Di controller, akses file dari `req.file`:
```ts
const file = req.file  // Buffer, mimetype, originalname, dll.
```

---

### Konteks 2 — Simpan URL File ke DB (Gunakan Presigned URL)

Jika tujuannya hanya **menyimpan URL file ke database** (foto profil, attachment, dll.), **jangan gunakan** `fileUploadMiddleware`. Upload file dilakukan langsung dari client ke S3 via **presigned URL**, sehingga yang masuk ke backend hanya URL-nya saja dalam bentuk **string biasa** di `req.body`.

```ts
// ✅ Request body biasa (JSON), bukan FormData
// POST /api/master/entity
// Body: { "name": "John", "photoUrl": "https://s3.amazonaws.com/bucket/foto.jpg" }

const EntitySchemaForCreate = z.object({
  name: z.string(),
  photoUrl: z.string().url().optional(), // URL dari presigned upload
})

// Di controller — langsung simpan URL ke DB
const validation = validateInput(EntitySchemaForCreate, req.body)
const data = await prisma.entity.create({ data: validation.data! })
```

> ❌ **Jangan** buat endpoint upload dengan `fileUploadMiddleware` hanya untuk menyimpan URL ke DB.
> ✅ Client upload langsung ke S3 via presigned URL, lalu kirim URL-nya ke endpoint ini sebagai string.

---

## 🗄️ Prisma Best Practices

- Selalu import dari `@/config/database` (singleton) — **jangan** `new PrismaClient()`
- Gunakan `Promise.all()` untuk query paralel (list + count)
- Selalu `orderBy: { id: 'desc' }` untuk konsistensi urutan
- Gunakan `select` untuk batasi field — hindari expose `password`, `token`
- Import enums dari `generated/prisma/enums`, bukan dari `@prisma/client`

```ts
// ✅ Benar
import prisma from '@/config/database'
import { Process } from 'generated/prisma/enums'

// ❌ Salah
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

---

## ⚙️ Error Handling

- Semua controller method **wajib** punya `try/catch`
- Catch block **selalu** return `ResponseData.serverError(res, error)`

```ts

} catch (error: any) {
  return ResponseData.serverError(res, error)
}

// Jika perlu log tambahan:
} catch (error) {
  return ResponseData.serverError(res, error)
}
```

---

## 🌍 Global Types (`src/types/global.d.ts`)

Type/interface global tersedia tanpa import:

| Name | Deskripsi |
|------|-----------|
| `jwtPayloadInterface` | Payload JWT → `req.user` |
| `PermissionList` | Union type semua permission |
| `GeneratedPermissionList` | Shape permission per user di `res.locals` |
| `AwsUploadJobData` | Shape data untuk BullMQ S3 job |
| `PDFExportOptions` | Opsi export PDF (Puppeteer) |
| `ExcelExportOptions` | Opsi export Excel |

---

## 🔧 Available Scripts

```bash
npm run dev                   # Dev server (ts-node-dev + tsconfig-paths)
npm run build                 # Build ke dist/ (tsc + tsc-alias)
npm run migrate               # format + lint schema + migrate dev + generate
npm run migrate:deploy        # Deploy migrasi production
npm run migrate:reset:seed    # Reset DB + seed (dev only!)
npm run db:seed               # Jalankan seeder
npm run dev:worker            # BullMQ worker (dev)
npm run start:worker          # BullMQ worker (production)
npm run lint                  # ESLint check
npm run lint:fix              # ESLint autofix
```

---

## 🚫 Anti-Patterns (Jangan Dilakukan)

- ❌ `res.json()` langsung — selalu pakai `ResponseData.*`
- ❌ `new PrismaClient()` di luar `src/config/database`
- ❌ Skip `await logActivity()` setelah mutasi data
- ❌ Lupa invalidasi Redis `user_permissions:{id}` setelah update permission
- ❌ Skip `validateInput()` meski request body sederhana
- ❌ Query list tanpa filter `deletedAt: null` **jika model punya field deletedAt**
- ❌ Return semua field tanpa `select` (risiko expose password)
- ❌ `console.log` di production code — gunakan `logger`