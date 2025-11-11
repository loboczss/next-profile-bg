-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARTAO', 'PIX', 'BOLETO', 'CARNE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'CONCLUIDO', 'FALHOU');

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "amount" DECIMAL(10,2) NOT NULL,
    "externalReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_purchaseId_key" ON "Payment"("purchaseId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
