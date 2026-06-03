# Mobile Push Notification (Expo) — Panduan Integrasi Front-End

Dokumen ini menjelaskan cara mengintegrasikan **Mobile Push Notification** via **Expo Push API** dari aplikasi React Native / Expo ke backend Jualtix.

---

## Gambaran Umum Alur

```
Expo App                        Back-End                     Expo Push Server
    │                               │                               │
    │  1. getExpoPushTokenAsync()   │                               │
    │ ◀────────────────────────────  │                               │
    │  ExponentPushToken[xxx]        │                               │
    │                               │                               │
    │  2. POST /mobile-push/subscribe│                               │
    │──────────────────────────────▶ │                               │
    │  { ok: true }                  │                               │
    │ ◀────────────────────────────── │                               │
    │                               │                               │
    │  3. Trigger notifikasi         │                               │
    │  (dari server / event)         │──────────────────────────────▶│
    │                               │  POST exp.host/api/push/send   │
    │                               │ ◀─────────────────────────────│
    │  4. App menerima push          │                               │
    │ ◀──────────────────────────────│                               │
```

> **Penting:** Semua endpoint memerlukan **Authorization header** (JWT Bearer Token) karena dikaitkan dengan user yang sedang login.

---

## Endpoint

Base URL: `{BASE_API_URL}` (e.g. `https://api.jualtix.com/api/v1`)

| Method   | Path                           | Auth | Deskripsi                         |
|----------|--------------------------------|------|-----------------------------------|
| `POST`   | `/mobile-push/subscribe`       | ✅   | Daftarkan token Expo push         |
| `POST`   | `/mobile-push/unsubscribe`     | ✅   | Hapus token Expo push             |

---

## 1. Subscribe Mobile Push

### Request

```
POST /mobile-push/subscribe
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body Parameters

| Field   | Tipe     | Wajib | Deskripsi                                                    |
|---------|----------|-------|--------------------------------------------------------------|
| `token` | `string` | ✅    | Expo push token dari `getExpoPushTokenAsync()` (min. 1 char) |

#### Contoh Body

```json
{
  "token": "ExpoxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX"
}
```

> **Catatan:** Kirim token mentah tanpa wrapper `ExponentPushToken[...]` — backend akan menyimpan raw token-nya saja.

### Response

#### Success `200 OK`

```json
{
  "status": "success",
  "message": "success upsert subcribe",
  "data": {}
}
```

#### Error `400 Bad Request` (validasi)

```json
{
  "status": "error",
  "errors": [
    { "field": "token", "message": "token harus diisi" }
  ]
}
```

---

## 2. Unsubscribe Mobile Push

### Request

```
POST /mobile-push/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body Parameters

| Field   | Tipe     | Wajib | Deskripsi                              |
|---------|----------|-------|----------------------------------------|
| `token` | `string` | ✅    | Token yang akan dihapus dari database  |

#### Contoh Body

```json
{
  "token": "ExpoxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX"
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

## 3. Implementasi Lengkap (React Native / Expo)

### Instalasi Dependency

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Step 1 — Minta Izin dan Ambil Token

```ts
// utils/pushNotification.ts
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Konfigurasi handler notifikasi yang diterima saat app foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function getExpoPushToken(): Promise<string | null> {
  // Push notif hanya berfungsi di device fisik (bukan emulator)
  if (!Device.isDevice) {
    console.warn('Push notification hanya berfungsi di device fisik')
    return null
  }

  // Minta izin
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Izin push notification ditolak')
    return null
  }

  // Android: wajib set Notification Channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  // Ambil token Expo
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data // => "ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]"
}
```

### Step 2 — Daftarkan Token ke Backend

```ts
// utils/pushNotification.ts (lanjutan)

export async function registerPushToken(authToken: string): Promise<void> {
  const token = await getExpoPushToken()
  if (!token) return

  // Kirim raw token (tanpa wrapper ExponentPushToken[...])
  const rawToken = token.replace('ExponentPushToken[', '').replace(']', '')

  const res = await fetch('https://api.jualtix.com/api/v1/mobile-push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: rawToken }),
  })

  if (!res.ok) {
    console.error('Gagal mendaftarkan push token:', await res.json())
    return
  }

  console.log('Push token berhasil didaftarkan')
}

export async function unregisterPushToken(authToken: string): Promise<void> {
  const token = await getExpoPushToken()
  if (!token) return

  const rawToken = token.replace('ExponentPushToken[', '').replace(']', '')

  await fetch('https://api.jualtix.com/api/v1/mobile-push/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: rawToken }),
  })

  console.log('Push token berhasil dihapus')
}
```

### Step 3 — Gunakan di App

```tsx
// App.tsx atau setelah login sukses
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { registerPushToken } from './utils/pushNotification'

export default function App() {
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    const authToken = 'your_jwt_token_here' // dari state/context/store
    registerPushToken(authToken)

    // Listener: notif diterima saat app foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notifikasi diterima:', notification)
    })

    // Listener: user mengetuk notifikasi
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      console.log('Notifikasi diklik, data:', data)
      // Navigasi berdasarkan data.type dan data.refId
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  return (/* ... */)
}
```

### Step 4 — Logout: Hapus Token

```ts
// Panggil saat user logout
async function onLogout() {
  const authToken = 'your_jwt_token_here'
  await unregisterPushToken(authToken)

  // lanjut proses logout...
}
```

---

## 4. Payload Notifikasi yang Diterima

Saat backend mengirim push, `notification.request.content` akan memiliki struktur:

```json
{
  "title": "Tiket Baru",
  "body": {
    "id": 123,
    "title": "Tiket Baru",
    "body": "Pesanan tiket kamu berhasil dibuat",
    "data": {
      "refId": "TRX-001",
      "type": "newTiketTransaction",
      "createdAt": "2024-05-30T10:00:00.000Z"
    }
  }
}
```

#### Contoh Navigasi Berdasarkan Tipe

```ts
function handleNotificationTap(data: { type: string; refId: string }) {
  const { type, refId } = data

  switch (type) {
    case 'newTiketTransaction':
    case 'paymentStatusTiket':
    case 'paymentSuccesTiket':
      navigation.navigate('TransactionDetail', { id: refId })
      break
    case 'payoutRequest':
    case 'payoutStatus':
    case 'payoutReject':
      navigation.navigate('PayoutDetail', { id: refId })
      break
    case 'subscriptionOrder':
    case 'subscriptionSuccess':
    case 'subscriptionRemainder':
      navigation.navigate('Subscription')
      break
    default:
      navigation.navigate('Notifications')
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
| 1 | Token Expo **bersifat per-device** — satu user bisa login di banyak device |
| 2 | Panggil `registerPushToken` **setelah login berhasil**, bukan saat splash screen |
| 3 | Panggil `unregisterPushToken` **sebelum logout** agar device lama tidak menerima notif |
| 4 | Push notif **tidak berfungsi di emulator/simulator** — gunakan device fisik |
| 5 | Untuk production Expo, pastikan `eas.projectId` sudah dikonfigurasi di `app.json` |
| 6 | Backend menyimpan raw token (tanpa wrapper `ExponentPushToken[...]`) |

---

## 6. Referensi

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [expo-notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
