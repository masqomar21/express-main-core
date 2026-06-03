# Pagination Utility

**Source:** [`src/utilities/Pagination.ts`](../src/utilities/Pagination.ts)

Class helper untuk menangani logika pagination, offset, limit, dan sorting pada query list endpoint.

---

## Properties

| Property | Type | Default | Deskripsi |
|---|---|---|---|
| `page` | `number` | `1` | Halaman yang aktif |
| `limit` | `number` | `10` | Jumlah item per halaman |
| `offset` | `number` | `0` | Index awal data (dihitung otomatis: `(page - 1) * limit`) |
| `orderBy` | `Record<string, 'asc' \| 'desc'>` | `{}` | Objek urutan yang dipakai di Prisma |
| `isOrderBySet` | `boolean` | `false` | Penanda apakah `orderBy` sudah di-set |

---

## Constructor

```ts
new Pagination(reqQuery: Request['query'], option?: { defaultLimit?: number; defaultPage?: number })
```

### Parameters

| Parameter | Type | Wajib | Deskripsi |
|---|---|---|---|
| `reqQuery` | `Request['query']` | ✅ | Object query dari Express (`req.query`) |
| `option.defaultPage` | `number` | ❌ | Nilai default page jika tidak ada di query (default: `1`) |
| `option.defaultLimit` | `number` | ❌ | Nilai default limit jika tidak ada di query (default: `10`) |

### Query String yang Dibaca

| Query Param | Contoh | Keterangan |
|---|---|---|
| `page` | `?page=2` | Nomor halaman |
| `limit` | `?limit=20` | Jumlah item per halaman |

### Contoh Penggunaan

```ts
// Paling sederhana — langsung pass req.query
const paginate = new Pagination(req.query)

// Dengan default custom
const paginate = new Pagination(req.query, { defaultPage: 1, defaultLimit: 20 })
```

---

## Methods

### `buildOrderBy(res, reqQuery, validFields)`

Membaca query `?orderBy=field_direction` dan memvalidasinya. Jika valid, `this.orderBy` dan `this.isOrderBySet` akan di-set.

```ts
buildOrderBy(res: Response, reqQuery: Request['query'], validFields: string[]): void
```

#### Format Query

```
?orderBy=<field>_<direction>
```

| Contoh Query | Hasil |
|---|---|
| `?orderBy=createdAt_desc` | `{ createdAt: 'desc' }` |
| `?orderBy=name_asc` | `{ name: 'asc' }` |
| `?orderBy=unknownField_asc` | ❌ Validation error |
| `?orderBy=name_random` | ❌ Validation error |

#### Parameters

| Parameter | Type | Deskripsi |
|---|---|---|
| `res` | `Response` | Express response object (untuk mengirim error jika invalid) |
| `reqQuery` | `Request['query']` | Object query dari Express (`req.query`) |
| `validFields` | `string[]` | Daftar field yang diperbolehkan untuk sorting |

#### Validasi

- Jika `orderBy` tidak ada di query → tidak melakukan apa-apa (skip).
- Jika `field` tidak termasuk `validFields` → return validation error.
- Jika `direction` bukan `asc` atau `desc` → return validation error.

#### Contoh Penggunaan

```ts
const paginate = new Pagination(req.query)

// Harus dipanggil SEBELUM query ke database
paginate.buildOrderBy(res, req.query, ['createdAt', 'name', 'price'])

const data = await prisma.product.findMany({
  skip: paginate.offset,
  take: paginate.limit,
  orderBy: paginate.isOrderBySet ? paginate.orderBy : { createdAt: 'desc' },
})
```

> [!IMPORTANT]
> Selalu cek `paginate.isOrderBySet` sebelum memakai `paginate.orderBy` di query Prisma.
> Jika tidak di-set (tidak ada `?orderBy` di query), gunakan fallback default.

---

### `paginate<T>(count, data, other?)`

Menghasilkan object response pagination standar untuk dikirim ke client.

```ts
paginate<T>(count: number, data: T[], other?: any): PaginationResult
```

#### Parameters

| Parameter | Type | Wajib | Deskripsi |
|---|---|---|---|
| `count` | `number` | ✅ | Total seluruh item (sebelum dipaginasi) |
| `data` | `T[]` | ✅ | Array item untuk halaman saat ini |
| `other` | `any` | ❌ | Data tambahan opsional yang disertakan dalam response |

#### Response Shape

```json
{
  "total_items": 100,
  "page": 2,
  "total_pages": 10,
  "current_page": 2,
  "items": [ /* ... data array ... */ ],
  "links": {
    "prev": "?page=1&limit=10",
    "next": "?page=3&limit=10"
  },
  "other": null
}
```

| Field | Tipe | Deskripsi |
|---|---|---|
| `total_items` | `number` | Total seluruh item |
| `page` | `number` | Halaman aktif |
| `total_pages` | `number` | Total halaman |
| `current_page` | `number` | Halaman aktif (sama dengan `page`) |
| `items` | `T[]` | Data halaman ini |
| `links.prev` | `string \| null` | URL prev page, `null` jika halaman pertama |
| `links.next` | `string \| null` | URL next page, `null` jika halaman terakhir |
| `other` | `any \| undefined` | Data tambahan (opsional) |

#### Contoh Penggunaan

```ts
const paginate = new Pagination(req.query)

const [data, count] = await Promise.all([
  prisma.user.findMany({
    skip: paginate.offset,
    take: paginate.limit,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.user.count(),
])

return ResponseData.ok(res, paginate.paginate(count, data), 'Success')
```

---

## Contoh Lengkap — Controller dengan Sorting

```ts
import { Pagination } from '@/utilities/Pagination'

async getAllProduct(req: Request, res: Response) {
  const paginate = new Pagination(req.query)

  // Validasi dan set orderBy dari query string
  paginate.buildOrderBy(res, req.query, ['createdAt', 'name', 'price'])

  const [products, count] = await Promise.all([
    prisma.product.findMany({
      skip: paginate.offset,
      take: paginate.limit,
      orderBy: paginate.isOrderBySet ? paginate.orderBy : { createdAt: 'desc' },
    }),
    prisma.product.count(),
  ])

  return ResponseData.ok(res, paginate.paginate(count, products), 'Success')
}
```

### Query String yang Didukung

```
GET /products?page=2&limit=5&orderBy=name_asc
```

---

## Catatan

- `page` dan `limit` dari query yang tidak valid (bukan angka) otomatis fallback ke default (`page=1`, `limit=10`).
- `buildOrderBy` harus dipanggil **sebelum** query database dijalankan.
- `paginate.paginate()` harus dipanggil dengan hasil `count` dari database agar `total_items` dan `total_pages` akurat.
