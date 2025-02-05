import { PrismaClient } from "@prisma/client";

interface CostumeNodeGlobal extends Global {
  prisma: PrismaClient;
}

declare const global: CostumeNodeGlobal;

const prisma = global.prisma || new PrismaClient();
global.prisma = prisma;

export default prisma;
