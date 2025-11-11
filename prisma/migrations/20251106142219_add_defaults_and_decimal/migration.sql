/*
  Warnings:

  - You are about to alter the column `price` on the `Destination` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "departureLocation" TEXT NOT NULL DEFAULT 'A definir',
ADD COLUMN     "totalSeats" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "seatCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Passenger" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Passenger_purchaseId_idx" ON "Passenger"("purchaseId");

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
