#!/bin/bash

echo "📁 Memulai refactor struktur express-main-core..."

# Buat struktur baru
mkdir -p src/modules/auth
mkdir -p src/modules/user
mkdir -p src/core
mkdir -p src/utils
mkdir -p src/db/seeders
mkdir -p src/middlewares
mkdir -p src/routes

# Pindahkan controller
mv src/controllers/auth/AuthController.ts src/modules/auth/auth.controller.ts
mv src/controllers/master/UserController.ts src/modules/user/user.controller.ts
mv src/controllers/master/testController.ts src/modules/user/test.controller.ts 2>/dev/null

# Pindahkan route
mv src/routes/auth/authRoute.ts src/modules/auth/auth.route.ts
mv src/routes/master/userRoute.ts src/modules/user/user.route.ts
mv src/routes/api.route.ts src/routes/index.ts

# Pindahkan schema
mv src/Schema/UserSchema.ts src/modules/user/user.schema.ts

# Pindahkan utility ke core & utils
mv src/utilities/jwtHanldler.ts src/core/jwt.ts
mv src/utilities/passwordHandler.ts src/core/password.ts
mv src/utilities/log.ts src/core/logger.ts
mv src/utilities/logActivity.ts src/core/logActivity.ts 2>/dev/null
mv src/utilities/response.ts src/core/response.ts
mv src/utilities/awsHeldler.ts src/utils/aws.ts
mv src/utilities/ParseArgs.ts src/utils/parseArgs.ts
mv src/utilities/pagination.ts src/utils/pagination.ts
mv src/utilities/ValidateHandler.ts src/utils/validateHandler.ts

# Pindahkan seeder
mv src/db/seeder/dataseet/*.ts src/db/seeders/
rm -rf src/db/seeder/dataseet
mv src/db/seeder/index.ts src/db/seeders/index.ts

# Pindahkan middleware
mv src/middleware/*.ts src/middlewares/

# Bersihkan folder lama
rm -rf src/controllers
rm -rf src/Schema
rm -rf src/utilities
rm -rf src/middleware
rm -rf src/routes/auth
rm -rf src/routes/master
rm -rf src/db/seeder

echo "✅ Refactor selesai. Struktur sudah optimal."
