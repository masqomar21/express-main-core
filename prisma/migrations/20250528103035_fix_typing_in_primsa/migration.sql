/*
  Warnings:

  - The values [create,update,delete,login,logout,restore] on the enum `Process` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Process_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT');
ALTER TABLE "Loger" ALTER COLUMN "process" TYPE "Process_new" USING ("process"::text::"Process_new");
ALTER TYPE "Process" RENAME TO "Process_old";
ALTER TYPE "Process_new" RENAME TO "Process";
DROP TYPE "Process_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropTable
DROP TABLE "permissions";

-- CreateTable
CREATE TABLE "Permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
