# API Proyek

API ini adalah aplikasi backend yang dibangun menggunakan **Express**, **TypeScript**, dan **Prisma** sebagai ORM untuk mengelola interaksi dengan database. Proyek ini dirancang untuk memberikan layanan RESTful yang efisien dan terstruktur, ideal untuk aplikasi web atau mobile.

## Fitur

- **CRUD untuk Product**: Buat, baca, perbarui, dan hapus produk
- **Validasi Input**: Middleware untuk memvalidasi input dan menangani kesalahan.
- **Prisma ORM**: Mengelola database dengan Prisma untuk query yang aman dan efisien.
- **Penggunaan TypeScript**: Keamanan tipe dan pengembangan yang lebih baik.
- **Pengujian Otomatis**: Mendukung pengujian otomatis untuk endpoint API.

## Teknologi yang Digunakan

- **Node.js**: Runtime untuk menjalankan JavaScript di server.
- **Express**: Framework web untuk Node.js.
- **TypeScript**: Superset JavaScript dengan tipe statis.
- **Prisma**: ORM untuk interaksi dengan database.
- **MySQL**: Database relasional untuk menyimpan data.
- **Multer**: Middleware untuk mengelola upload file.

## Prerequisites

Sebelum memulai, pastikan Anda memiliki hal-hal berikut:

- **Node.js**: Versi 14.x atau lebih baru.
- **npm**: Versi terbaru.
- **Database**: PostgreSQL/MySQL/MongoDB terinstal dan berjalan.

## Instalasi

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan proyek ini:

1. **Clone repositori ini:**

   ```bash
   git clone https://github.com/username/repo-name.git
   cd repo-name
    ```
2. **Install dependencies:**

   ```bash
   npm install
   ```
3. **Atur variabel lingkungan:**

   Buat file `.env` di root proyek dan isi variabel lingkungan yang diperlukan. Lihat contoh `.env.example` untuk referensi.

4. **Migrasi database:**

   Jalankan migrasi Prisma untuk membuat skema database:

   ```bash
   npx prisma migrate dev --name init
   ```
5. **Jalankan Seeder database:**

   Jalankan seeder untuk mengisi database dengan data awal:

   ```bash
   npm run db:seed
   ```
6. **Jalankan server:**

   Terakhir, jalankan server dengan perintah:

   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:3000`.

   ---
## Dokumentasi API

Dokumentasi lengkap untuk API ini dapat ditemukan di [Dokumentasi API](./api_documentation.md).

## author
- [masqomar21](https://github.com/masqomar21)