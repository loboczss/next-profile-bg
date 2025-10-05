-- CreateEnum
CREATE TYPE "BackgroundDisplayMode" AS ENUM ('ALL', 'GROUP', 'SINGLE');

-- AlterTable
ALTER TABLE "GlobalSetting" ADD COLUMN     "backgroundGroup" TEXT,
ADD COLUMN     "backgroundImageId" INTEGER,
ADD COLUMN     "backgroundMode" "BackgroundDisplayMode" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "BackgroundImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "groupKey" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GlobalSetting" ADD CONSTRAINT "GlobalSetting_backgroundImageId_fkey" FOREIGN KEY ("backgroundImageId") REFERENCES "BackgroundImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
