# Web Push Notification — Panduan Integrasi Front-End

Dokumen ini menjelaskan cara mengintegrasikan **Web Push Notification** berbasis browser (VAPID/Web Push API) dari sisi front-end ke backend Jualtix.

---

## Gambaran Umum Alur

```
Browser (Service Worker)          Front-End (JS)               Back-End
         │                             │                            │
         │  1. requestPermission()     │                            │
         │ ◀─────────────────────────── │                            │
         │                             │                            │
         │  2. subscribe(vapidKey)     │                            │
         │ ◀─────────────────────────── │                            │
         │  PushSubscription object    │                            │
         │──────────────────────────▶ │                            │
         │                             │  3. POST /web-push/subscribe│
         │                             │──────────────────────────▶ │
         │                             │  { ok: true }              │
         │                             │ ◀────────────────────────── │
         │                             │                            │
         │  4. Browser menerima push   │                            │
         │ ◀─────────────────────────────────────────────────────── │
```

> **Penting:** Semua endpoint di bawah (kecuali unsubscribe) memerlukan **Authorization header** (JWT Bearer Token).

---

## Endpoint

Base URL: `{BASE_API_URL}` (e.g. `https://api.jualtix.com/api/v1`)

| Method   | Path                         | Auth | Deskripsi                          |
|----------|------------------------------|------|------------------------------------|
| `POST`   | `/web-push/subscribe`        | ✅   | Daftarkan subscription browser     |
| `POST`   | `/web-push/unsubscribe`      | ✅   | Hapus subscription browser         |

---

## 1. Subscribe Web Push

### Request

```
POST /web-push/subscribe
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body Parameters

| Field                  | Tipe                   | Wajib | Deskripsi                                              |
|------------------------|------------------------|-------|--------------------------------------------------------|
| `endpoint`             | `string` (URL)         | ✅    | URL endpoint push dari browser (maks. 2048 karakter)  |
| `keys.p256dh`          | `string` (base64url)   | ✅    | Public key ECDH dari subscription browser             |
| `keys.auth`            | `string` (base64url)   | ✅    | Auth secret dari subscription browser                 |
| `expirationTime`       | `number \| null`       | ❌    | Epoch ms masa berlaku subscription (opsional)         |
| `userAgent`            | `string`               | ❌    | User agent browser (maks. 512 karakter)               |

#### Contoh Body

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/xxxxxxxxxxxxxx",
  "keys": {
    "p256dh": "BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "auth": "xxxxxxxxxxxxxxxx"
  },
  "expirationTime": null,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"
}
```

### Response

#### Success `200 OK`

```json
{
  "status": "success",
  "message": "success upsert subcribe",
  "data": {}
}
```

---

## 2. Unsubscribe Web Push

### Request

```
POST /web-push/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body Parameters

| Field      | Tipe           | Wajib | Deskripsi                          |
|------------|----------------|-------|------------------------------------|
| `endpoint` | `string` (URL) | ✅    | URL endpoint yang akan dihapus     |

#### Contoh Body

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/xxxxxxxxxxxxxx"
}
```

### Response

#### Success `200 OK`

```json
{
  "status": "success",
  "message": "success unSubcribe",
  "data": {}
}
```

---

## 3. Implementasi Lengkap (JavaScript/React)

### Step 1 — Daftarkan Service Worker

Buat file `public/sw.js`:

```js
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const title = data.title || 'Notifikasi Baru'
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/badge.png',
    data: data.data || {},
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const refId = event.notification.data?.refId
  const type = event.notification.data?.type

  // Navigasi berdasarkan tipe notifikasi
  event.waitUntil(
    clients.openWindow(`/?type=${type}&refId=${refId}`)
  )
})
```

### Step 2 — Subscribe ke Push Notification

```js
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_FROM_BACKEND'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

async function subscribeWebPush(authToken) {
  // 1 — Minta izin notifikasi
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Izin notifikasi ditolak')
    return null
  }

  // 2 — Daftarkan Service Worker
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  // 3 — Subscribe ke push API browser
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  // 4 — Kirim subscription ke backend
  const subJson = subscription.toJSON()
  await fetch('/api/v1/web-push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
      expirationTime: subscription.expirationTime ?? null,
      userAgent: navigator.userAgent,
    }),
  })

  console.log('Web push subscription berhasil didaftarkan')
  return subscription
}
```

### Step 3 — Unsubscribe

```js
async function unsubscribeWebPush(authToken) {
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint

  // 1 — Unsubscribe dari browser
  await subscription.unsubscribe()

  // 2 — Hapus dari backend
  await fetch('/api/v1/web-push/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ endpoint }),
  })

  console.log('Web push berhasil di-unsubscribe')
}
```

### Contoh React Hook

```tsx
import { useEffect } from 'react'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function useWebPush(authToken: string | null) {
  useEffect(() => {
    if (!authToken) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    subscribeWebPush(authToken).catch(console.error)

    return () => {
      // opsional: unsubscribe saat unmount
    }
  }, [authToken])
}

export default useWebPush
```

---

## 4. Payload Notifikasi yang Diterima Service Worker

Saat backend mengirim push, `event.data.json()` akan memiliki struktur berikut:

```json
{
  "id": 123,
  "title": "Tiket Baru",
  "body": "Pesanan tiket kamu berhasil dibuat",
  "data": {
    "refId": "TRX-001",
    "type": "newTiketTransaction",
    "createdAt": "2024-05-30T10:00:00.000Z"
  }
}
```

### Tipe Notifikasi (`type`)

| Tipe                     | Deskripsi                        |
|--------------------------|----------------------------------|
| `messageFormDeveloper`   | Pesan dari developer             |
| `newTiketTransaction`    | Tiket baru                       |
| `paymentStatusTiket`     | Status pembayaran tiket          |
| `paymentSuccesTiket`     | Pembayaran tiket berhasil        |
| `remainderEventDate`     | Pengingat hari H event           |
| `remainderSelingTiket`   | Pengingat seling tiket           |
| `payoutRequest`          | Pengajuan pembayaran             |
| `payoutStatus`           | Status pembayaran                |
| `payoutReject`           | Pembayaran ditolak               |
| `subscriptionOrder`      | Pesanan langganan                |
| `subscriptionRemainder`  | Pengingat langganan              |
| `subscriptionSuccess`    | Langganan berhasil               |

---

## 5. Tips & Catatan Penting

| # | Catatan |
|---|---------|
| 1 | Web Push hanya berfungsi di **HTTPS** atau `localhost` |
| 2 | Pastikan file `sw.js` ada di **root public** (bukan di subfolder) |
| 3 | `VAPID_PUBLIC_KEY` harus sama dengan yang dikonfigurasi di backend |
| 4 | Subscription bersifat **per-browser/device** — satu user bisa punya banyak subscription |
| 5 | Jika subscription sudah tidak valid (error 404/410), backend akan otomatis menghapusnya |
| 6 | Panggil `subscribeWebPush` setelah user login, bukan saat halaman pertama dimuat |
