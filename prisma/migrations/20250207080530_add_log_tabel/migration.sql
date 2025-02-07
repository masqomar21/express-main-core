-- CreateEnum
CREATE TYPE "Process" AS ENUM ('create', 'update', 'delete', 'login', 'logout');

-- CreateTable
CREATE TABLE "Loger" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "process" "Process" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Loger" ADD CONSTRAINT "Loger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
