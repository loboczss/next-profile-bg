-- CreateTable
CREATE TABLE "PixTestPayment" (
    "id" SERIAL NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "amount" DECIMAL(10,2) NOT NULL,
    "externalReference" TEXT NOT NULL,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixTestPayment_pkey" PRIMARY KEY ("id")
);
