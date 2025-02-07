# API SIPAKGURU

## Teknologi yang Digunakan

- **Node.js**: Runtime untuk menjalankan JavaScript di server.
- **Express**: Framework web untuk Node.js.
- **TypeScript**: Superset JavaScript dengan tipe statis.
- **Prisma**: ORM untuk interaksi dengan database.\

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
   npx prisma migrate dev
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