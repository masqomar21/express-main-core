import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcrypt"

const prisma = new PrismaClient();

export async function seedRole() {
  console.log("Seed data inserted role");

  await prisma.role.createMany({
    data: [
      {
        name: "admin",
      },
      {
        name: "user",
      },
    ],
  });
}
