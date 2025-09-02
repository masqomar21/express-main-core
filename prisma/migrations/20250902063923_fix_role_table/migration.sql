/*
  Warnings:

  - The values [USER,ADMIN] on the enum `RoleType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('OTHER', 'SUPER_ADMIN');
ALTER TABLE "Role" ALTER COLUMN "roleType" DROP DEFAULT;
ALTER TABLE "Role" ALTER COLUMN "roleType" TYPE "RoleType_new" USING ("roleType"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "RoleType_old";
ALTER TABLE "Role" ALTER COLUMN "roleType" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "roleType" SET DEFAULT 'OTHER';
