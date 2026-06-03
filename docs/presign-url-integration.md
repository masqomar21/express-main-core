# Pre-Signed URL S3 — Panduan Integrasi Front-End

Dokumen ini menjelaskan cara menggunakan fitur **pre-signed URL** untuk upload dan delete file ke/dari S3 Storage langsung dari sisi front-end, tanpa melewatkan file melalui server backend.

---

## Gambaran Umum Alur Upload

```
Front-End                        Back-End                         S3 Storage
    │                                │                                │
    │  1. GET /generate-pre-sign-url │                                │
    │──────────────────────────────▶ │                                │
    │                                │  generate signed URL           │
    │                                │──────────────────────────────▶ │
    │  2. { signedUrl, fileUrl }      │                                │
    │ ◀────────────────────────────── │                                │
    │                                │                                │
    │  3. PUT signedUrl (file binary) │                                │
    │──────────────────────────────────────────────────────────────▶ │
    │                                │                                │
    │  4. Simpan `fileUrl` ke DB      │                                │
    │──────────────────────────────▶ │                                │
```

> **Penting:** Pre-signed URL **berlaku selama 120 detik** sejak dibuat. Segera lakukan PUT setelah mendapatkan URL.

---

## Endpoint

Base URL: sesuai environment (e.g. `https://api.jualtix.com`)

| Method   | Path                             | Deskripsi                      |
|----------|----------------------------------|--------------------------------|
| `GET`    | `/s3/generate-pre-sign-url`      | Generate pre-signed upload URL |
| `DELETE` | `/s3/delete-file`                | Hapus file dari S3             |

---

## 1. Generate Pre-Signed Upload URL

### Request

```
GET /s3/generate-pre-sign-url
```

#### Query Parameters

| Parameter    | Tipe     | Wajib | Deskripsi                                                                 |
|--------------|----------|-------|---------------------------------------------------------------------------|
| `fileName`   | `string` | ✅    | Nama file asli beserta ekstensinya (e.g. `photo.jpg`)                     |
| `fileType`   | `string` | ✅    | MIME type file (e.g. `image/jpeg`, `image/png`, `application/pdf`)        |
| `folderPath` | `string` | ❌    | Subfolder tujuan di dalam bucket (e.g. `events/banners`). Default: root   |

#### Contoh Request

```http
GET /s3/generate-pre-sign-url?fileName=banner.jpg&fileType=image%2Fjpeg&folderPath=events%2Fbanners
```

### Response

#### Success `200 OK`

```json
{
  "status": "success",
  "data": {
    "signedUrl": "https://bucket-name.s3.ap-southeast-1.amazonaws.com/prod/events/banners/1717401234567_banner.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Expires=120&...",
    "fileUrl": "https://bucket-name.s3.ap-southeast-1.amazonaws.com/prod/events/banners/1717401234567_banner.jpg"
  }
}
```

| Field        | Deskripsi                                                                 |
|--------------|---------------------------------------------------------------------------|
| `signedUrl`  | URL yang digunakan untuk upload file langsung ke S3 (via HTTP `PUT`)      |
| `fileUrl`    | URL publik permanen file setelah berhasil diupload — **simpan ini ke DB** |

#### Error `422 Unprocessable Entity` (validasi gagal)

```json
{
  "status": "error",
  "errors": [
    { "field": "fileName", "message": "Required" }
  ]
}
```

---

## 2. Upload File ke S3 Menggunakan `signedUrl`

Gunakan `signedUrl` dari response di atas untuk melakukan HTTP `PUT` langsung ke S3.

### Persyaratan Request

- Method: **`PUT`**
- Header `Content-Type` **harus sama** dengan `fileType` yang dikirim ke backend
- Body: binary file (bukan `FormData`)

### Contoh: JavaScript / Fetch API

```js
async function uploadFileToS3(file, folderPath = '') {
  // Step 1 — Minta signed URL dari backend
  const params = new URLSearchParams({
    fileName: file.name,
    fileType: file.type,
    ...(folderPath && { folderPath }),
  })

  const res = await fetch(`/s3/generate-pre-sign-url?${params}`)
  const { data } = await res.json()
  const { signedUrl, fileUrl } = data

  // Step 2 — Upload file langsung ke S3
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file, // File object dari <input type="file">
  })

  if (!uploadRes.ok) {
    throw new Error('Upload ke S3 gagal')
  }

  // Step 3 — fileUrl siap disimpan ke database
  return fileUrl
}
```

### Contoh: Axios

```js
async function uploadFileToS3Axios(file, folderPath = '') {
  // Step 1 — Minta signed URL
  const { data } = await axios.get('/s3/generate-pre-sign-url', {
    params: {
      fileName: file.name,
      fileType: file.type,
      folderPath: folderPath || undefined,
    },
  })

  const { signedUrl, fileUrl } = data.data

  // Step 2 — Upload file ke S3 (gunakan axios instance tanpa Authorization header)
  await axios.put(signedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  })

  return fileUrl
}
```

> **Perhatian Axios:** Jika axios Anda menggunakan interceptor yang menambahkan `Authorization` header secara global, pastikan **tidak mengirim header tersebut** saat request ke `signedUrl`. S3 akan menolak request jika ada header yang tidak tercantum di dalam signature.

---

## 3. Hapus File dari S3

### Request

```
DELETE /s3/delete-file
```

#### Query Parameters

| Parameter | Tipe     | Wajib | Deskripsi                                  |
|-----------|----------|-------|--------------------------------------------|
| `fileUrl` | `string` | ✅    | URL publik file yang akan dihapus (URL penuh, bukan path) |

#### Contoh Request

```http
DELETE /s3/delete-file?fileUrl=https%3A%2F%2Fbucket-name.s3.ap-southeast-1.amazonaws.com%2Fprod%2Fevents%2Fbanners%2F1717401234567_banner.jpg
```

### Response

#### Success `200 OK`

```json
{
  "status": "success",
  "data": {}
}
```

#### Error `400 Bad Request`

```json
{
  "status": "error",
  "message": "fileUrl is required"
}
```

---

## 4. Contoh Implementasi Lengkap (React)

```tsx
import { useState } from 'react'

function ImageUploader() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadFileToS3(file, 'events/banners')
      setImageUrl(url)
      console.log('File berhasil diupload:', url)
    } catch (err) {
      console.error('Gagal upload:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!imageUrl) return
    await fetch(`/s3/delete-file?fileUrl=${encodeURIComponent(imageUrl)}`, {
      method: 'DELETE',
    })
    setImageUrl(null)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Mengupload...</p>}
      {imageUrl && (
        <>
          <img src={imageUrl} alt="Uploaded" width={200} />
          <button onClick={handleDelete}>Hapus File</button>
        </>
      )}
    </div>
  )
}
```

---

## 5. Tips & Catatan Penting

| # | Catatan |
|---|---------|
| 1 | **`signedUrl` hanya berlaku 120 detik.** Jangan di-cache; minta baru setiap kali upload. |
| 2 | **`fileUrl` adalah URL permanen.** Simpan nilai ini ke database sebagai referensi file. |
| 3 | `Content-Type` saat PUT ke S3 **harus identik** dengan `fileType` yang dikirim ke backend. |
| 4 | Jika ada interceptor Axios/global header `Authorization`, **bypass untuk request ke `signedUrl`**. |
| 5 | `folderPath` disarankan diisi berdasarkan konteks (e.g. `events/thumbnails`, `users/avatars`). |
| 6 | Saat menghapus file, gunakan `fileUrl` penuh (bukan hanya nama file). |

---

## 6. MIME Type Umum

| Format | MIME Type          |
|--------|--------------------|
| JPEG   | `image/jpeg`       |
| PNG    | `image/png`        |
| WebP   | `image/webp`       |
| PDF    | `application/pdf`  |
| MP4    | `video/mp4`        |
| GIF    | `image/gif`        |
