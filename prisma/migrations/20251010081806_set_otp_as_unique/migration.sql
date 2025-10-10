/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Otp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Otp_code_key" ON "Otp"("code");
