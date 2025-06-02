import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function seedUser() {
  await prisma.user.createMany({
    data: [
      {
        'id': 1,
        'email': 'super_admin@app.com',
        'name': 'Super Admin',
        'password': '$2b$10$IvPxKon8U/rx2Z9QtzRh4uvFCHksW6l4ZR2kvPwRa5lHBTt7LSlj6',
        'roleId': 3,
        'createdAt': '2025-05-28T09:27:29.330Z',
        'updatedAt': '2025-05-28T09:27:29.330Z',
        'deletedAt': null,
      },
      {
        'id': 2,
        'email': 'admin@app.com',
        'name': 'Admin',
        'password': '$2b$10$IvPxKon8U/rx2Z9QtzRh4uvFCHksW6l4ZR2kvPwRa5lHBTt7LSlj6',
        'roleId': 1,
        'createdAt': '2025-05-28T09:27:29.341Z',
        'updatedAt': '2025-05-28T09:27:29.341Z',
        'deletedAt': null,
      },
      {
        'id': 3,
        'email': 'user@app.com',
        'name': 'User',
        'password': '$2b$10$IvPxKon8U/rx2Z9QtzRh4uvFCHksW6l4ZR2kvPwRa5lHBTt7LSlj6',
        'roleId': 2,
        'createdAt': '2025-05-28T09:27:29.349Z',
        'updatedAt': '2025-05-28T09:27:29.349Z',
        'deletedAt': null,
      },
    ],
    skipDuplicates: true,
  })
}