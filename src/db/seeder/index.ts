import { PrismaClient } from "@prisma/client";
import { seedRole } from "./dataseet/RoleSeeder";
import { seedUser } from "./dataseet/UserSeeder";

const prisma = new PrismaClient();

async function main() {
  await seedRole();
  await seedUser();

  console.log("Seed data inserted successfully");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
