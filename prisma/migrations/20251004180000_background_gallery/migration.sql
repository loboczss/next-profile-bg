-- CreateEnum
CREATE TYPE "BackgroundDisplayMode" AS ENUM ('ALL', 'GROUP', 'SINGLE');

-- CreateTable
CREATE TABLE "BackgroundImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "groupKey" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BackgroundImage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GlobalSetting"
    ADD COLUMN "backgroundGroup" TEXT,
    ADD COLUMN "backgroundImageId" INTEGER,
    ADD COLUMN "backgroundMode" "BackgroundDisplayMode" NOT NULL DEFAULT 'ALL';

-- AddForeignKey
ALTER TABLE "GlobalSetting"
    ADD CONSTRAINT "GlobalSetting_backgroundImageId_fkey"
    FOREIGN KEY ("backgroundImageId") REFERENCES "BackgroundImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Trigger to keep updatedAt in sync
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_background_image_updated_at
BEFORE UPDATE ON "BackgroundImage"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
