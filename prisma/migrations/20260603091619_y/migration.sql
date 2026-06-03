-- CreateTable
CREATE TABLE "MobilPushSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobilPushSubscription_token_key" ON "MobilPushSubscription"("token");

-- CreateIndex
CREATE INDEX "MobilPushSubscription_userId_idx" ON "MobilPushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "MobilPushSubscription" ADD CONSTRAINT "MobilPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
