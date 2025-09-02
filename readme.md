# Express Main Core

> Express.js starter project dengan TypeScript, Prisma ORM, dan best practices untuk pengembangan aplikasi web modern.

## 🚀 Fitur Utama

- **Express.js** - Framework web minimalis untuk Node.js
- **TypeScript** - JavaScript dengan type safety
- **Prisma ORM** - Modern database toolkit
- **Environment Configuration** - Manajemen konfigurasi yang aman
- **Database Migration** - Sistem migrasi database terintegrasi
- **Seeding System** - Sistem untuk mengisi data awal database
- **Development Tools** - Hot reload dan development utilities

## 📋 Prasyarat

Pastikan sistem Anda memiliki:

- **Node.js**: Versi 18.x atau lebih baru
- **npm**: Versi terbaru (atau yarn sebagai alternatif)
- **Database**: PostgreSQL, MySQL, atau MongoDB
- **Redis**: Untuk caching dan message brokering
- **Git**: Untuk version control

## 🛠️ Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/masqomar21/express-main-core.git
cd express-main-core
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Buat file `.env` di root directory:

```bash
cp .env.example .env
```

Edit file `.env` sesuai dengan konfigurasi Anda:

```env
# Server Configuration
APP_ENV="development" # production or development
PORT="3000"
```

```env
# Database Configuration
DB_USERNAME="root"
DB_PASSWORD="root"
DB_HOST="localhost"
DB_DIALECT="postgres"
DB_TIMEZONE="Asia/Jakarta"
DB_NAME="starter_kit"

```

### 4. Database Setup

#### Migrasi Database development

```bash
npm run migrate
```

#### Migrasi Production

```bash
npm run migrate:deploy
```

#### Seed Database

```bash
npm run db:seed

npm run db:seed --seed <seed_name>
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
express-main-core/
├── src/
│   ├── config/          # Configuration files (database, CONFIG, soket, web-push, redis etc.)
│   ├── controllers/     # Business logic controllers
│   ├── db/seeder/       # Seeder files
│   ├── middleware/      # Custom middleware functions
│   ├── queue/           # Declaration of job queue
│   ├── routes/          # API route definitions
│   ├── schema/          # zod validation schema
│   ├── services/        # Service layer
│   ├── socket/          # Socket.io event list
│   ├── template/        # Template html to generate view or pdf (puppeteer)
│   ├── utilities/       # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── worker/          # Background job workers
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── app.ts               # Express app configuration
├── docs/                # Additional documentation
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json        # TypeScript configuration
└── README.md
```

## 🔧 Scripts Available

| Script                       | Deskripsi                                                                   |
| ---------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                | Jalankan server dalam mode development (ts-node-dev + tsconfig-paths)       |
| `npm run build`              | Build TypeScript → JavaScript dan perbaiki path alias (tsc + tsc-alias)     |
| `npm run start`              | Jalankan aplikasi hasil build (Node `dist/app.js`)                          |
| `npm run prebuild`           | Jalankan skrip pra-build (`scripts/generate-build-time.js`)                 |
| `npm run test`               | Placeholder untuk test (belum dikonfigurasi)                                |
| `npm run lint`               | Jalankan ESLint untuk file `.ts`                                            |
| `npm run lint:fix`           | Jalankan ESLint dengan autofix                                              |
| `npm run prepare`            | Setup Husky git hooks                                                       |
| `npm run db:seed`            | Jalankan seeder database (ts-node `src/db/seeder/index.ts`)                 |
| `npm run db:seed:reverse`    | Generate seeder dari data/skrip (`scripts/generate-seeders.ts`)             |
| `npm run prisma:lint`        | Lint schema Prisma (`scripts/lint-prisma-schema.ts`)                        |
| `npm run prisma:format`      | Format schema Prisma (`prisma format`)                                      |
| `npm run migrate`            | Format & lint schema, lalu `prisma migrate dev`                             |
| `npm run migrate:deploy`     | Deploy migrasi di environment produksi (`prisma migrate deploy` + generate) |
| `npm run migrate:reset:seed` | Reset migrasi tanpa seed bawaan, lalu jalankan `db:seed`                    |
| `npm run start:worker`       | Jalankan worker BullMQ hasil build (`dist/src/workers/index.js`)            |
| `npm run dev:worker`         | Jalankan worker BullMQ (ts-node)                                            |


## 📝 Development Guidelines

### Code Style

- Gunakan TypeScript untuk type safety
- Follow ESLint rules yang sudah dikonfigurasi
- Gunakan Prettier untuk formatting
- Tulis tests untuk setiap feature baru

### Git Workflow

1. Create branch dari `main`
2. Commit changes dengan descriptive messages
3. Push branch dan create Pull Request
4. Code review dan merge

### Commit Messages

Gunakan conventional commit format:

```
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**

```
Error: Can't reach database server
```

- Periksa DATABASE_URL di file `.env`
- Pastikan database service berjalan
- Verify credentials dan network connectivity

**Port Already in Use**

```
Error: listen EADDRINUSE: address already in use :::3000
```

- Ubah PORT di file `.env`
- Kill process yang menggunakan port tersebut

**Prisma Generate Error**

```
Error: Prisma schema not found
```

- Jalankan `npx prisma generate`
- Periksa file `prisma/schema.prisma`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Masqomar**

- GitHub: [@masqomar21](https://github.com/masqomar21)

## 🙏 Acknowledgments

- Express.js team untuk framework yang luar biasa
- Prisma team untuk ORM yang modern dan powerful
- TypeScript team untuk type safety
- Community contributors

---

Untuk pertanyaan atau bantuan lebih lanjut, silakan buka issue di repository atau contact maintainer.
